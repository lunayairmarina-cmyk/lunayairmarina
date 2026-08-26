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
import { buildAiLeadRecord, createAiLeadClient } from "@/lib/agent/aiAdminClient";
import { createAiLeadAdmin } from "@/server/agent/leadsStoreAdmin";
import { maybeRunPendingKnowledgeSync } from "@/server/agent/knowledgeSync";
import { buildHistoryContextSnippet, retrieveKnowledge } from "@/server/agent/retrieve";
import { tryGetAdminFirestore } from "@/server/agent/firebaseAdmin";
import { logAiUsage } from "@/server/agent/usageLog";
import { getDb } from "@/lib/firebase";
import type { AiConversationRecord } from "@/lib/agent/types";
import { getChatbotConfig } from "./config";
import { GeminiServiceError, generateChatReply } from "./gemini";
import { checkRateLimit } from "./rateLimit";

const historyItemSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(4000),
});

export function createChatRequestSchema(maxMessageLength: number, maxHistoryItems: number) {
  return z.object({
    message: z.string().trim().min(1).max(maxMessageLength),
    language: z.enum(["ar", "en"]),
    sessionId: z
      .string()
      .trim()
      .min(8)
      .max(64)
      .regex(/^[a-zA-Z0-9_-]+$/),
    history: z.array(historyItemSchema).max(maxHistoryItems),
  });
}

export function trimHistory(history: ChatHistoryItem[], maxItems: number): ChatHistoryItem[] {
  if (history.length <= maxItems) return history;
  return history.slice(-maxItems);
}

export function validateChatRequest(
  input: unknown,
  config = getChatbotConfig(),
): { ok: true; data: ChatRequest } | { ok: false; code: ChatErrorCode } {
  const schema = createChatRequestSchema(config.maxMessageLength, config.maxHistoryItems);
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: "VALIDATION" };
  }

  return {
    ok: true,
    data: {
      ...parsed.data,
      history: trimHistory(parsed.data.history, config.maxHistoryItems),
    },
  };
}

async function loadExistingConversation(sessionId: string): Promise<AiConversationRecord | null> {
  const adminDb = tryGetAdminFirestore();
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
    record.lastIntent = input.intent;
    record.leadStatus = input.leadStatus;
    if (input.leadId) record.leadId = input.leadId;

    const userMsg = {
      id: makeMessageId("user"),
      role: "user" as const,
      content: input.userMessage,
      timestamp: new Date().toISOString(),
      intent: input.intent,
      entities: input.customerContext.interests,
      confidence: input.confidence,
    };
    const assistantMsg = {
      id: makeMessageId("assistant"),
      role: "assistant" as const,
      content: input.assistantReply,
      timestamp: new Date().toISOString(),
      retrievedKnowledgeIds: input.retrievedIds,
      confidence: input.confidence,
    };

    const adminDb = tryGetAdminFirestore();
    if (adminDb) {
      await saveConversationAdmin(adminDb, record);
      await appendConversationMessageAdmin(adminDb, input.sessionId, userMsg);
      await appendConversationMessageAdmin(adminDb, input.sessionId, assistantMsg);
      return;
    }

    const db = getDb();
    await saveConversation(db, record);
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
    logAiUsage({ event: "chat_error", errorCode: validated.code });
    return { ok: false, code: validated.code };
  }

  if (!config.geminiApiKey) {
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
    logAiUsage({
      event: "chat_error",
      sessionId: validated.data.sessionId,
      language: validated.data.language,
      errorCode: "RATE_LIMIT",
    });
    return { ok: false, code: "RATE_LIMIT" };
  }

  try {
    // Soft CMS→knowledge sync (only when flagged + Admin credentials present).
    void maybeRunPendingKnowledgeSync();

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

    const historyText = buildHistoryContextSnippet(validated.data.history);
    const retrieval = await retrieveKnowledge(validated.data.message, validated.data.language, {
      context: customerContext,
      historyText,
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

    const topScore = retrieval.diagnostic.selected[0]?.score ?? 0;
    const confidence = estimateAnswerConfidence(topScore, retrieval.documents.length);

    const reply = await generateChatReply(
      config,
      validated.data.language,
      validated.data.message,
      validated.data.history,
      retrieval.formatted,
      {
        conversationSummary: summary,
        customerContext,
        offerHandoff: lead.shouldOfferHandoff,
      },
    );

    let leadId = existing?.leadId;
    if (lead.shouldCreateLead && !leadId) {
      try {
        const record = buildAiLeadRecord({
          conversationId: validated.data.sessionId,
          context: customerContext,
          phone: lead.phone,
          email: lead.email,
          name: lead.name,
        });
        const adminDb = tryGetAdminFirestore();
        if (adminDb) await createAiLeadAdmin(adminDb, record);
        else await createAiLeadClient(getDb(), record);
        leadId = record.id;
        logAiUsage({
          event: "lead_created",
          sessionId: validated.data.sessionId,
          language: validated.data.language,
          intent: retrieval.analysis.intent,
        });
      } catch {
        // Lead write is best-effort.
      }
    }

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
        const adminDb = tryGetAdminFirestore();
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

    return { ok: true, reply };
  } catch (error) {
    const errorCode =
      error instanceof GeminiServiceError && error.status === 408
        ? "TIMEOUT"
        : error instanceof GeminiServiceError && !error.retryable
          ? "SERVICE"
          : "SERVICE";
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
