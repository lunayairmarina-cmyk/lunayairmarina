import { z } from "zod";
import type {
  ChatErrorCode,
  ChatHistoryItem,
  ChatRequest,
  ChatResponse,
} from "@/lib/chatbot/types";
import {
  emptyCustomerContext,
  extractContextFromMessage,
  updateConversationSummary,
  type CustomerContext,
} from "@/lib/agent/context";
import {
  appendConversationMessage,
  buildConversationRecord,
  loadConversation,
  makeMessageId,
  saveConversation,
} from "@/server/agent/conversationStore";
import { pairedMessageTimestamps } from "@/lib/agent/messageOrder";
import {
  appendConversationMessageAdmin,
  loadConversationAdmin,
  saveConversationAdmin,
} from "@/server/agent/conversationStoreAdmin";
import {
  createKnowledgeCandidate,
  estimateAnswerConfidence,
  shouldCreateKnowledgeCandidate,
} from "@/server/agent/knowledgeCandidates";
import { detectLeadSignal } from "@/server/agent/leadDetection";
import {
  buildAiLeadRecord,
  createAiLeadClient,
  updateAiLeadClient,
} from "@/lib/agent/aiAdminClient";
import { createAiLeadAdmin, updateAiLeadAdmin } from "@/server/agent/leadsStoreAdmin";
import { maybeRunPendingKnowledgeSync } from "@/server/agent/knowledgeSync";
import { buildHistoryContextSnippet, retrieveKnowledge } from "@/server/agent/retrieve";
import { tryGetAdminFirestore } from "@/server/agent/firebaseAdmin";
import { logAiUsage } from "@/server/agent/usageLog";
import { getDb } from "@/lib/firebase";
import type { AiConversationRecord } from "@/lib/agent/types";
import { getChatbotConfig } from "./config";
import {
  estimateHistoryTokens,
  prepareGeminiHistory,
} from "./contextManagement";
import { resolveConversationHistory } from "./conversationHistory";
import { logChatTrace } from "./chatTrace";
import { GeminiServiceError, generateChatReply } from "./gemini";
import { checkRateLimit } from "./rateLimit";

const historyItemSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(4000),
});

export function createChatRequestSchema(maxMessageLength: number) {
  return z.object({
    message: z.string().trim().min(1).max(maxMessageLength),
    language: z.enum(["ar", "en"]),
    sessionId: z
      .string()
      .trim()
      .min(8)
      .max(64)
      .regex(/^[a-zA-Z0-9_-]+$/),
    /** Client may send empty history — server resolves from Firestore by sessionId. */
    history: z.array(historyItemSchema).default([]),
  });
}

export { trimHistory } from "./contextManagement";

export function validateChatRequest(
  input: unknown,
  config = getChatbotConfig(),
): { ok: true; data: ChatRequest } | { ok: false; code: ChatErrorCode } {
  const schema = createChatRequestSchema(config.maxMessageLength);
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    logChatTrace("VALIDATION_FAIL", {
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        code: issue.code,
      })),
    });
    return { ok: false, code: "VALIDATION" };
  }

  return {
    ok: true,
    data: parsed.data,
  };
}

async function loadExistingConversation(sessionId: string): Promise<AiConversationRecord | null> {
  const adminDb = await tryGetAdminFirestore();
  if (adminDb) return loadConversationAdmin(adminDb, sessionId);
  return loadConversation(getDb(), sessionId);
}

async function persistConversationTurn(input: {
  sessionId: string;
  language: "ar" | "en";
  userMessage: string;
  assistantReply: string;
  customerContext: CustomerContext;
  summary: string;
  intent: string;
  retrievedIds: string[];
  confidence: "high" | "medium" | "low";
  leadStatus: "none" | "potential" | "handoff";
  leadId?: string;
}) {
  try {
    const existing = await loadExistingConversation(input.sessionId);
    const record =
      existing ??
      buildConversationRecord({
        sessionId: input.sessionId,
        language: input.language,
        customerContext: input.customerContext,
      });

    record.lastMessageAt = new Date().toISOString();
    record.summary = input.summary;
    record.customerContext = input.customerContext as unknown as Record<string, unknown>;
    const visitorName = input.customerContext.name?.trim() || record.visitorName;
    const visitorPhone = input.customerContext.phone?.trim() || record.visitorPhone;
    const visitorEmail = input.customerContext.email?.trim() || record.visitorEmail;
    if (visitorName) record.visitorName = visitorName;
    else delete record.visitorName;
    if (visitorPhone) record.visitorPhone = visitorPhone;
    else delete record.visitorPhone;
    if (visitorEmail) record.visitorEmail = visitorEmail;
    else delete record.visitorEmail;
    record.lastIntent = input.intent;
    record.leadStatus = input.leadStatus;
    if (input.leadId) record.leadId = input.leadId;

    const { userAt, assistantAt } = pairedMessageTimestamps();
    const userMsg = {
      id: makeMessageId("user"),
      role: "user" as const,
      content: input.userMessage,
      timestamp: userAt,
      intent: input.intent,
      entities: input.customerContext.interests,
      confidence: input.confidence,
    };
    const assistantMsg = {
      id: makeMessageId("assistant"),
      role: "assistant" as const,
      content: input.assistantReply,
      timestamp: assistantAt,
      retrievedKnowledgeIds: input.retrievedIds,
      confidence: input.confidence,
    };

    const adminDb = await tryGetAdminFirestore();
    if (adminDb) {
      await saveConversationAdmin(adminDb, record);
      await appendConversationMessageAdmin(adminDb, input.sessionId, userMsg);
      await appendConversationMessageAdmin(adminDb, input.sessionId, assistantMsg);
      return;
    }

    const clientRecord = { ...record };
    delete clientRecord.visitorName;
    delete clientRecord.visitorPhone;
    delete clientRecord.visitorEmail;
    const db = getDb();
    await saveConversation(db, clientRecord);
    await appendConversationMessage(db, input.sessionId, userMsg);
    await appendConversationMessage(db, input.sessionId, assistantMsg);
  } catch {
    // Conversation persistence must not break chat replies.
  }
}

export async function processChatMessage(input: unknown): Promise<ChatResponse> {
  const config = getChatbotConfig();
  const validated = validateChatRequest(input, config);
  const startedAt = Date.now();

  if (!validated.ok) {
    logChatTrace("REQUEST_FAILED", { stage: "validation", code: validated.code });
    logAiUsage({ event: "chat_error", errorCode: validated.code });
    return { ok: false, code: validated.code };
  }

  logChatTrace("REQUEST_START", {
    sessionId: validated.data.sessionId,
    language: validated.data.language,
    clientHistoryCount: validated.data.history.length,
    messageLength: validated.data.message.length,
  });

  if (!config.geminiApiKey) {
    logChatTrace("REQUEST_FAILED", { stage: "config", code: "CONFIG" });
    logAiUsage({
      event: "chat_error",
      sessionId: validated.data.sessionId,
      language: validated.data.language,
      errorCode: "CONFIG",
    });
    return { ok: false, code: "CONFIG" };
  }

  const rate = checkRateLimit(validated.data.sessionId, config);
  if (!rate.allowed) {
    logChatTrace("REQUEST_FAILED", {
      stage: "rate_limit",
      code: "RATE_LIMIT",
      reason: rate.reason,
    });
    logAiUsage({
      event: "chat_error",
      sessionId: validated.data.sessionId,
      language: validated.data.language,
      errorCode: "RATE_LIMIT",
    });
    return { ok: false, code: "RATE_LIMIT" };
  }
  logChatTrace("RATE_LIMIT_PASS", { sessionId: validated.data.sessionId });

  try {
    void maybeRunPendingKnowledgeSync();

    const { history: conversationHistory, source: historySource } =
      await resolveConversationHistory(validated.data.sessionId, validated.data.history);

    logChatTrace("HISTORY_RESOLVED", {
      sessionId: validated.data.sessionId,
      source: historySource,
      conversationHistoryCount: conversationHistory.length,
      clientHistoryCount: validated.data.history.length,
    });

    const existing = await loadExistingConversation(validated.data.sessionId);
    let customerContext = emptyCustomerContext();
    if (existing?.customerContext && typeof existing.customerContext === "object") {
      const stored = existing.customerContext as unknown as CustomerContext;
      customerContext = {
        ...emptyCustomerContext(),
        ...stored,
        interests: Array.isArray(stored.interests) ? stored.interests : [],
      };
    }
    let summary = existing?.summary ?? "";
    const priorLeadStatus = existing?.leadStatus ?? "none";

    const extracted = extractContextFromMessage(
      validated.data.message,
      validated.data.language,
      customerContext,
    );
    customerContext = extracted.context;

    const historyText = buildHistoryContextSnippet(conversationHistory);
    const retrieval = await retrieveKnowledge(validated.data.message, validated.data.language, {
      context: customerContext,
      historyText,
    });

    logChatTrace("RETRIEVAL_PASS", {
      sessionId: validated.data.sessionId,
      documents: retrieval.documents.length,
      intent: retrieval.analysis.intent,
      fromFallback: retrieval.fromFallback,
    });

    if (retrieval.fromFallback) {
      logAiUsage({
        event: "retrieval_fallback",
        sessionId: validated.data.sessionId,
        language: validated.data.language,
        intent: retrieval.analysis.intent,
        fromFallback: true,
        knowledgeSource: retrieval.diagnostic.knowledgeSource,
        documentCount: retrieval.documents.length,
      });
    } else if (retrieval.diagnostic.websiteSearchUsed) {
      logAiUsage({
        event: "website_search",
        sessionId: validated.data.sessionId,
        language: validated.data.language,
        intent: retrieval.analysis.intent,
        fromFallback: false,
        knowledgeSource: retrieval.diagnostic.knowledgeSource,
        documentCount: retrieval.documents.length,
      });
    }

    summary = updateConversationSummary(
      summary,
      validated.data.message,
      validated.data.language,
      customerContext,
    );

    const lead = detectLeadSignal(
      validated.data.message,
      customerContext,
      retrieval.analysis.intent,
      priorLeadStatus,
    );
    if (lead.phone && !customerContext.phone) {
      customerContext = { ...customerContext, phone: lead.phone };
    }
    if (lead.email && !customerContext.email) {
      customerContext = { ...customerContext, email: lead.email };
    }
    if (lead.name && !customerContext.name) {
      customerContext = { ...customerContext, name: lead.name };
    }

    const geminiHistory = prepareGeminiHistory(conversationHistory, config);

    logChatTrace("CONTEXT_PREPARED", {
      sessionId: validated.data.sessionId,
      inputHistoryCount: conversationHistory.length,
      geminiHistoryCount: geminiHistory.length,
      estimatedHistoryTokens: estimateHistoryTokens(geminiHistory),
    });

    logChatTrace("GEMINI_START", { sessionId: validated.data.sessionId });

    const reply = await generateChatReply(
      config,
      validated.data.language,
      validated.data.message,
      geminiHistory,
      retrieval.formatted,
      {
        conversationSummary: summary,
        customerContext,
        offerHandoff: lead.shouldOfferHandoff,
        needsContactCapture: false,
        contactAlreadyAsked: false,
      },
    );

    logChatTrace("GEMINI_SUCCESS", {
      sessionId: validated.data.sessionId,
      replyLength: reply.length,
    });

    const topScore = retrieval.diagnostic.selected[0]?.score ?? 0;
    const confidence = estimateAnswerConfidence(topScore, retrieval.documents.length);

    let leadId = existing?.leadId;
    if (lead.shouldCreateLead || lead.shouldUpdateLead) {
      try {
        const adminDb = await tryGetAdminFirestore();
        if (leadId && lead.shouldUpdateLead) {
          const patch = {
            name: (lead.name ?? customerContext.name ?? "").slice(0, 120),
            phone: (lead.phone ?? customerContext.phone ?? "").slice(0, 40),
            email: (lead.email ?? customerContext.email ?? "").slice(0, 200),
            yachtType: (customerContext.yachtType ?? customerContext.customerType ?? "").slice(0, 80),
            yachtLength: (customerContext.yachtLength ?? "").slice(0, 40),
            location: (customerContext.location ?? "").slice(0, 80),
            serviceInterest: (customerContext.interests ?? []).slice(0, 12),
          };
          if (adminDb) await updateAiLeadAdmin(adminDb, leadId, patch);
          else await updateAiLeadClient(getDb(), leadId, patch);
        } else if (lead.shouldCreateLead && !leadId) {
          const record = buildAiLeadRecord({
            conversationId: validated.data.sessionId,
            context: customerContext,
            phone: lead.phone ?? customerContext.phone,
            email: lead.email ?? customerContext.email,
            name: lead.name ?? customerContext.name,
          });
          if (adminDb) await createAiLeadAdmin(adminDb, record);
          else await createAiLeadClient(getDb(), record);
          leadId = record.id;
          logAiUsage({
            event: "lead_created",
            sessionId: validated.data.sessionId,
            language: validated.data.language,
            intent: retrieval.analysis.intent,
          });
        }
      } catch {
        // Lead write is best-effort.
      }
    }

    logChatTrace("FIRESTORE_PERSIST_START", { sessionId: validated.data.sessionId });

    await persistConversationTurn({
      sessionId: validated.data.sessionId,
      language: validated.data.language,
      userMessage: validated.data.message,
      assistantReply: reply,
      customerContext,
      summary,
      intent: retrieval.analysis.intent,
      retrievedIds: retrieval.documents.map((doc) => doc.id),
      confidence,
      leadStatus: lead.leadStatus,
      leadId,
    });

    logChatTrace("FIRESTORE_PERSIST_SUCCESS", { sessionId: validated.data.sessionId });

    let candidateCreated = false;
    if (
      shouldCreateKnowledgeCandidate({
        intent: retrieval.analysis.intent,
        retrievedCount: retrieval.documents.length,
        topScore,
        message: validated.data.message,
      })
    ) {
      try {
        const adminDb = await tryGetAdminFirestore();
        if (adminDb) {
          const id = `kc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          await adminDb
            .collection("knowledgeCandidates")
            .doc(id)
            .set({
              id,
              question: validated.data.message.trim().slice(0, 500),
              language: validated.data.language,
              reason: "Low-confidence or missing authoritative website knowledge",
              sourceConversationId: validated.data.sessionId,
              status: "pending",
              createdAt: new Date().toISOString(),
            });
        } else {
          await createKnowledgeCandidate(getDb(), {
            question: validated.data.message,
            language: validated.data.language,
            reason: "Low-confidence or missing authoritative website knowledge",
            sourceConversationId: validated.data.sessionId,
          });
        }
        candidateCreated = true;
      } catch {
        // Candidate creation is best-effort.
      }
    }

    if (candidateCreated) {
      logAiUsage({
        event: "candidate_created",
        sessionId: validated.data.sessionId,
        language: validated.data.language,
        intent: retrieval.analysis.intent,
        confidence,
      });
    }

    logAiUsage({
      event: "chat_ok",
      sessionId: validated.data.sessionId,
      language: validated.data.language,
      intent: retrieval.analysis.intent,
      fromFallback: retrieval.fromFallback,
      knowledgeSource: retrieval.diagnostic.knowledgeSource,
      documentCount: retrieval.documents.length,
      confidence,
      latencyMs: Date.now() - startedAt,
    });

    logChatTrace("REQUEST_SUCCESS", {
      sessionId: validated.data.sessionId,
      latencyMs: Date.now() - startedAt,
    });

    return { ok: true, reply };
  } catch (error) {
    const errorCode =
      error instanceof GeminiServiceError && error.status === 408
        ? "TIMEOUT"
        : error instanceof GeminiServiceError && !error.retryable
          ? "SERVICE"
          : "SERVICE";
    logChatTrace("REQUEST_FAILED", {
      stage:
        error instanceof GeminiServiceError
          ? "gemini"
          : error instanceof Error
            ? error.name
            : "unknown",
      code: errorCode,
      sessionId: validated.data.sessionId,
      conversationHistoryCount: validated.data.history.length,
      errorType: error instanceof Error ? error.name : "unknown",
      geminiStatus:
        error instanceof GeminiServiceError ? error.status ?? "" : "",
    });
    logAiUsage({
      event: "chat_error",
      sessionId: validated.data.sessionId,
      language: validated.data.language,
      errorCode,
      latencyMs: Date.now() - startedAt,
    });
    if (error instanceof GeminiServiceError && error.status === 408) {
      return { ok: false, code: "TIMEOUT" };
    }
    if (error instanceof GeminiServiceError && !error.retryable) {
      return { ok: false, code: "SERVICE" };
    }
    return { ok: false, code: "SERVICE" };
  }
}
