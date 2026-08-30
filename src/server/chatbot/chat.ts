import { z } from "zod";
import type {
  ChatErrorCode,
  ChatRequest,
  ChatResponse,
} from "@/lib/chatbot/types";
import {
  emptyCustomerContext,
  extractContextFromMessage,
  hasVisitorContact,
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
import { tryGetAdminFirestore } from "@/server/agent/firebaseAdmin";
import { logAiUsage } from "@/server/agent/usageLog";
import { getDb } from "@/lib/firebase";
import type { AiConversationRecord } from "@/lib/agent/types";
import { getChatbotConfig } from "./config";
import { resolveConversationHistory } from "./conversationHistory";
import { createChatRequestId, logChatTrace } from "./chatTrace";
import { checkRateLimit } from "./rateLimit";
import { generateChatReply, GeminiServiceError } from "./gemini";
import { ensureAssistantReply } from "./geminiFallback";
import { composeGeminiKnowledge } from "./knowledge";
import { prepareGeminiHistory } from "./contextManagement";
import { leadPatchFromContext } from "./leadPatch";
import {
  buildHistoryContextSnippet,
  retrieveKnowledge,
} from "@/server/agent/retrieve";

/** Client history is ignored — only message/session/language are validated. */
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
    history: z.unknown().optional(),
  });
}

export { trimHistory } from "./contextManagement";

function redactConversationSummaryForGemini(summary: string): string {
  return summary
    .replace(/(?:الجوال|Phone|الإيميل|Email):\s*[^\n.]+/gi, "")
    .replace(/(?:\+?\d[\d\s\-()]{7,}\d)/g, "")
    .replace(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

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

  const clientHistory = Array.isArray((input as { history?: unknown })?.history)
    ? (input as { history: unknown[] }).history.length
    : 0;

  if (clientHistory > 0) {
    logChatTrace("CLIENT_HISTORY_IGNORED", { clientHistoryCount: clientHistory });
  }

  return {
    ok: true,
    data: {
      message: parsed.data.message,
      language: parsed.data.language,
      sessionId: parsed.data.sessionId,
      history: [],
    },
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
  const requestId = createChatRequestId();
  const validated = validateChatRequest(input, config);
  const startedAt = Date.now();

  if (!validated.ok) {
    logChatTrace("REQUEST_FAILED", { stage: "validation", code: validated.code }, requestId);
    logAiUsage({ event: "chat_error", errorCode: validated.code });
    return { ok: false, code: validated.code };
  }

  logChatTrace(
    "REQUEST_START",
    {
      sessionId: validated.data.sessionId,
      language: validated.data.language,
      messageLength: validated.data.message.length,
    },
    requestId,
  );

  const rate = checkRateLimit(validated.data.sessionId, config);
  if (!rate.allowed) {
    logChatTrace(
      "REQUEST_FAILED",
      {
        stage: "rate_limit",
        code: "RATE_LIMIT",
        reason: rate.reason,
        sessionId: validated.data.sessionId,
      },
      requestId,
    );
    logAiUsage({
      event: "chat_error",
      sessionId: validated.data.sessionId,
      language: validated.data.language,
      errorCode: "RATE_LIMIT",
    });
    return { ok: false, code: "RATE_LIMIT" };
  }
  logChatTrace("RATE_LIMIT_PASS", { sessionId: validated.data.sessionId }, requestId);

  try {
    void maybeRunPendingKnowledgeSync();

    const { history: conversationHistory, source: historySource } =
      await resolveConversationHistory(validated.data.sessionId, validated.data.history);

    logChatTrace(
      "HISTORY_RESOLVED",
      {
        sessionId: validated.data.sessionId,
        source: historySource,
        conversationHistoryCount: conversationHistory.length,
      },
      requestId,
    );

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
    customerContext.detectedLanguage = validated.data.language;
    customerContext.messageCount = (customerContext.messageCount ?? 0) + 1;

    summary = updateConversationSummary(
      summary,
      validated.data.message,
      validated.data.language,
      customerContext,
    );

    const geminiHistory = prepareGeminiHistory(conversationHistory, config);
    const historyText = buildHistoryContextSnippet(geminiHistory);

    logChatTrace("GEMINI_START", { sessionId: validated.data.sessionId }, requestId);

    let retrieval: Awaited<ReturnType<typeof retrieveKnowledge>>;
    try {
      retrieval = await retrieveKnowledge(validated.data.message, validated.data.language, {
        context: customerContext,
        historyText,
      });
    } catch {
      retrieval = {
        documents: [],
        formatted: "",
        fromFallback: true,
        analysis: {
          original: validated.data.message,
          normalized: validated.data.message,
          tokens: [],
          intent: "unknown",
          preferredTypes: [],
          entities: [],
        },
        diagnostic: {
          query: validated.data.message,
          normalizedQuery: validated.data.message,
          intent: "unknown",
          entities: [],
          selected: [],
          documentCount: 0,
          fromFallback: true,
          knowledgeSource: "static-fallback",
          retrievalPass: "kb_primary",
          websiteSearchUsed: false,
          sufficiencyReason: "retrieve_error",
        },
      };
    }
    const resolvedIntent = retrieval.analysis.intent;
    const topScore = retrieval.diagnostic.selected[0]?.score ?? 0;
    const confidence = estimateAnswerConfidence(topScore, retrieval.documents.length);
    const composedKnowledge = composeGeminiKnowledge(
      validated.data.language,
      retrieval.formatted,
    );

    const lead = detectLeadSignal(
      validated.data.message,
      customerContext,
      resolvedIntent,
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

    let reply: string;
    let fromGeminiFallback = false;
    try {
      reply = await generateChatReply(
        config,
        validated.data.language,
        validated.data.message,
        geminiHistory,
        composedKnowledge,
        {
          conversationSummary: redactConversationSummaryForGemini(summary),
          customerContext,
          offerHandoff: lead.shouldOfferHandoff,
          needsContactCapture: !hasVisitorContact(customerContext),
          contactAlreadyAsked: hasVisitorContact(customerContext),
        },
      );
      if (!reply.trim()) {
        fromGeminiFallback = true;
        reply = ensureAssistantReply(reply, validated.data.language, "empty");
      }
      logChatTrace(
        fromGeminiFallback ? "GEMINI_FALLBACK" : "GEMINI_OK",
        {
          sessionId: validated.data.sessionId,
          intent: resolvedIntent,
          confidence,
          replyLength: reply.length,
          knowledgeSource: retrieval.diagnostic.knowledgeSource,
          documentCount: retrieval.documents.length,
        },
        requestId,
      );
    } catch (error) {
      fromGeminiFallback = true;
      const kind = error instanceof GeminiServiceError ? error.kind : "unknown";
      reply = ensureAssistantReply(
        null,
        validated.data.language,
        kind === "empty" ? "empty" : "error",
      );
      logChatTrace(
        "GEMINI_FALLBACK",
        {
          sessionId: validated.data.sessionId,
          kind: error instanceof GeminiServiceError ? error.kind : "unknown",
          hasApiKey: Boolean(config.geminiApiKey),
        },
        requestId,
      );
    }

    let leadId = existing?.leadId;
    const leadPatch = leadPatchFromContext(customerContext, resolvedIntent);
    const shouldSyncLead =
      Boolean(leadId) || hasVisitorContact(customerContext) || lead.shouldCreateLead;

    if (shouldSyncLead) {
      try {
        const adminDb = await tryGetAdminFirestore();
        if (leadId) {
          if (adminDb) await updateAiLeadAdmin(adminDb, leadId, leadPatch);
          else await updateAiLeadClient(getDb(), leadId, leadPatch);
        } else if (lead.shouldCreateLead || hasVisitorContact(customerContext)) {
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
            intent: resolvedIntent,
          });
        }
      } catch {
        // Lead write is best-effort — must not block chat replies.
      }
    }

    logChatTrace("FIRESTORE_PERSIST_START", { sessionId: validated.data.sessionId }, requestId);

    await persistConversationTurn({
      sessionId: validated.data.sessionId,
      language: validated.data.language,
      userMessage: validated.data.message,
      assistantReply: reply,
      customerContext,
      summary,
      intent: resolvedIntent,
      retrievedIds: retrieval.documents.map((doc) => doc.id),
      confidence,
      leadStatus: lead.leadStatus,
      leadId,
    });

    logChatTrace("FIRESTORE_PERSIST_SUCCESS", { sessionId: validated.data.sessionId }, requestId);

    let candidateCreated = false;
    if (
      !fromGeminiFallback &&
      shouldCreateKnowledgeCandidate({
        intent: resolvedIntent,
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
        intent: resolvedIntent,
        confidence,
      });
    }

    logAiUsage({
      event: "chat_ok",
      sessionId: validated.data.sessionId,
      language: validated.data.language,
      intent: resolvedIntent,
      fromFallback: fromGeminiFallback || retrieval.fromFallback,
      knowledgeSource: fromGeminiFallback ? "gemini-fallback" : retrieval.diagnostic.knowledgeSource,
      documentCount: retrieval.documents.length,
      confidence,
      latencyMs: Date.now() - startedAt,
    });

    logChatTrace(
      "REQUEST_SUCCESS",
      { sessionId: validated.data.sessionId, latencyMs: Date.now() - startedAt },
      requestId,
    );

    return { ok: true, reply };
  } catch (error) {
    const errorCode: ChatErrorCode = "INTERNAL";
    logChatTrace(
      "REQUEST_FAILED",
      {
        stage: "gemini",
        code: errorCode,
        sessionId: validated.data.sessionId,
        conversationHistoryCount: validated.data.history.length,
        errorType: error instanceof Error ? error.name : "unknown",
      },
      requestId,
    );
    logAiUsage({
      event: "chat_error",
      sessionId: validated.data.sessionId,
      language: validated.data.language,
      errorCode,
      latencyMs: Date.now() - startedAt,
    });
    return { ok: false, code: errorCode };
  }
}
