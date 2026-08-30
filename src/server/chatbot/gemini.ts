import type { ChatHistoryItem, ChatLanguage } from "@/lib/chatbot/types";
import type { CustomerContext } from "@/lib/agent/context";
import type { ChatbotConfig } from "./config";
import { buildSystemPrompt } from "./prompt";
import { shrinkGeminiHistoryForRetry } from "./contextManagement";
import { extractUserFacingReply, parseGeminiAgentOutputDetailed } from "./agent/parseOutput";
import type { AgentTurnResult } from "./agent/types";
import { geminiResponseJsonSchema } from "./agent/types";
import {
  isNearVerbatimKnowledgeMatch,
  PARAPHRASE_RETRY_HINT,
} from "./agent/verbatimGuard";

export type GeminiAgentContext = {
  conversationSummary?: string;
  customerContext?: CustomerContext;
  offerHandoff?: boolean;
  needsContactCapture?: boolean;
  contactAlreadyAsked?: boolean;
  agentStateBlock?: string;
  jsonMode?: boolean;
  /** KB snippets for near-verbatim detection (quality control). */
  verbatimSources?: string[];
  paraphraseRetryDone?: boolean;
};

interface GeminiContent {
  role: "user" | "model";
  parts: Array<{ text: string }>;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
    finishReason?: string;
  }>;
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
}

export class GeminiServiceError extends Error {
  readonly retryable: boolean;
  readonly status?: number;
  readonly kind: "quota" | "context" | "timeout" | "api" | "empty" | "network";

  constructor(
    message: string,
    options: { retryable: boolean; status?: number; kind?: GeminiServiceError["kind"] },
  ) {
    super(message);
    this.name = "GeminiServiceError";
    this.retryable = options.retryable;
    this.status = options.status;
    this.kind = options.kind ?? "api";
  }
}

export function extractGeminiText(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const candidates = (payload as GeminiResponse).candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) return null;
  const parts = candidates[0]?.content?.parts;
  if (!Array.isArray(parts) || parts.length === 0) return null;
  const text = parts
    .map((part) => (typeof part?.text === "string" ? part.text : ""))
    .join("")
    .trim();
  return text.length > 0 ? text : null;
}

function classifyGeminiFailure(status: number, message: string): GeminiServiceError["kind"] {
  if (status === 429) return "quota";
  if (status === 408) return "timeout";
  if (status === 400 && /context|token|length|too large|exceed/i.test(message)) return "context";
  return "api";
}

function toGeminiHistory(history: ChatHistoryItem[]): GeminiContent[] {
  return history.map((item) => ({
    role: item.role === "assistant" ? "model" : "user",
    parts: [{ text: item.content }],
  }));
}

async function callGeminiOnce(
  config: ChatbotConfig,
  language: ChatLanguage,
  message: string,
  history: ChatHistoryItem[],
  retrievedKnowledge: string,
  agentContext?: GeminiAgentContext,
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.geminiModel)}:generateContent`;

  const body = {
    systemInstruction: {
      parts: [
        {
          text: buildSystemPrompt(language, retrievedKnowledge, {
            conversationSummary: agentContext?.conversationSummary,
            customerContext: agentContext?.customerContext,
            offerHandoff: agentContext?.offerHandoff,
            needsContactCapture: agentContext?.needsContactCapture,
            contactAlreadyAsked: agentContext?.contactAlreadyAsked,
            agentStateBlock: agentContext?.agentStateBlock,
          }),
        },
      ],
    },
    contents: [...toGeminiHistory(history), { role: "user", parts: [{ text: message }] }],
    generationConfig: {
      maxOutputTokens: config.maxOutputTokens,
      temperature: config.geminiTemperature,
      topP: config.geminiTopP,
      ...(agentContext?.jsonMode === false
        ? {}
        : {
            responseMimeType: "application/json",
            responseSchema: geminiResponseJsonSchema(),
          }),
    },
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.requestTimeoutMs);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": config.geminiApiKey,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    let payload: GeminiResponse;
    try {
      payload = (await response.json()) as GeminiResponse;
    } catch {
      throw new GeminiServiceError("Invalid Gemini response", { retryable: false, kind: "empty" });
    }

    if (!response.ok) {
      const message = payload.error?.message ?? `Gemini request failed (${response.status})`;
      const kind = classifyGeminiFailure(response.status, message);
      const contextOverflow = kind === "context";
      const retryable =
        response.status === 429 || response.status >= 500 || contextOverflow;
      throw new GeminiServiceError(message, { retryable, status: response.status, kind });
    }

    const text = extractGeminiText(payload);
    if (!text) {
      throw new GeminiServiceError("Empty Gemini response", { retryable: false, kind: "empty" });
    }

    return text;
  } catch (error) {
    if (error instanceof GeminiServiceError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new GeminiServiceError("Gemini request timed out", {
        retryable: true,
        kind: "timeout",
        status: 408,
      });
    }
    throw new GeminiServiceError("Gemini network error", { retryable: true, kind: "network" });
  } finally {
    clearTimeout(timeout);
  }
}

function extractReplyFromRaw(raw: string): {
  reply: string;
  parsed: AgentTurnResult["geminiParsed"];
  parsedResult: ReturnType<typeof parseGeminiAgentOutputDetailed>;
} {
  const parsedResult = parseGeminiAgentOutputDetailed(raw);
  const parsed = parsedResult.output;
  const reply =
    parsed?.reply?.trim() ||
    parsedResult.reply?.trim() ||
    extractUserFacingReply(raw);
  return { reply: reply?.trim() ?? "", parsed, parsedResult };
}

export async function generateChatReply(
  config: ChatbotConfig,
  language: ChatLanguage,
  message: string,
  history: ChatHistoryItem[],
  retrievedKnowledge: string,
  agentContext?: GeminiAgentContext,
): Promise<string> {
  const turn = await generateAgentTurn(
    config,
    language,
    message,
    history,
    retrievedKnowledge,
    agentContext,
  );
  return turn.reply;
}

export async function generateAgentTurn(
  config: ChatbotConfig,
  language: ChatLanguage,
  message: string,
  history: ChatHistoryItem[],
  retrievedKnowledge: string,
  agentContext?: GeminiAgentContext,
): Promise<AgentTurnResult> {
  if (!config.geminiApiKey) {
    throw new GeminiServiceError("Gemini API key is not configured", {
      retryable: false,
      kind: "api",
    });
  }

  const run = async (ctx: GeminiAgentContext | undefined) =>
    callGeminiOnce(config, language, message, history, retrievedKnowledge, ctx);

  let raw: string;
  let paraphraseRetried = false;
  let nearVerbatimDetected = false;
  try {
    raw = await run(agentContext);
  } catch (error) {
    if (error instanceof GeminiServiceError && error.retryable) {
      const trimmedHistory =
        error.status === 400 ? shrinkGeminiHistoryForRetry(history) : history;
      try {
        raw = await callGeminiOnce(
          config,
          language,
          message,
          trimmedHistory,
          retrievedKnowledge,
          agentContext,
        );
      } catch (retryError) {
        if (
          retryError instanceof GeminiServiceError &&
          retryError.status === 400 &&
          agentContext?.jsonMode !== false
        ) {
          raw = await callGeminiOnce(
            config,
            language,
            message,
            trimmedHistory,
            retrievedKnowledge,
            { ...agentContext, jsonMode: false },
          );
        } else {
          throw retryError;
        }
      }
    } else if (
      error instanceof GeminiServiceError &&
      error.status === 400 &&
      agentContext?.jsonMode !== false
    ) {
      raw = await run({ ...agentContext, jsonMode: false });
    } else {
      throw error;
    }
  }

  let { reply, parsed, parsedResult } = extractReplyFromRaw(raw);

  const verbatimSources = agentContext?.verbatimSources ?? [];
  if (
    reply &&
    verbatimSources.length > 0 &&
    isNearVerbatimKnowledgeMatch(reply, verbatimSources) &&
    !agentContext?.paraphraseRetryDone
  ) {
    nearVerbatimDetected = true;
    const hint = PARAPHRASE_RETRY_HINT[language === "ar" ? "ar" : "en"];
    const retryContext: GeminiAgentContext = {
      ...agentContext,
      paraphraseRetryDone: true,
      agentStateBlock: [agentContext?.agentStateBlock?.trim(), hint].filter(Boolean).join("\n\n"),
    };
    try {
      const retryRaw = await run(retryContext);
      const retryExtracted = extractReplyFromRaw(retryRaw);
      if (retryExtracted.reply) {
        raw = retryRaw;
        reply = retryExtracted.reply;
        parsed = retryExtracted.parsed;
        parsedResult = retryExtracted.parsedResult;
        paraphraseRetried = true;
      }
    } catch {
      // Keep first reply — no infinite retry loop
    }
  }

  if (!reply?.trim()) {
    throw new GeminiServiceError("Empty Gemini response", { retryable: false, kind: "empty" });
  }

  return {
    reply,
    rawGeminiText: raw,
    paraphraseRetried,
    nearVerbatimDetected,
    geminiParsed: parsed,
    structuredParseFailed: parsedResult.status === "failed",
    parseStatus: parsedResult.status,
    parseErrors: parsedResult.errors,
    salvageMethod: parsedResult.salvageMethod,
    analysis: {
      intent: parsed?.intent ?? "GENERAL",
      secondaryIntents: parsed?.secondaryIntents ?? [],
      conversationStage: "DISCOVERY",
      commercialScore: parsed?.commercialScore ?? 0,
      nextBestAction: "ANSWER",
      urgency: "LOW",
      entities: {},
      missingInformation: parsed?.missingInformation ?? [],
      leadSignals: parsed?.leadSignals ?? [],
      objections: [],
      buyingSignals: [],
      handoff: Boolean(parsed?.handoff),
      repair: false,
      progressive: false,
      shortQuery: false,
      security: false,
      gibberish: false,
      disclosureLevel: 0,
      questionFocus: "general_service",
    },
  };
}
