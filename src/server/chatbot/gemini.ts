import type { ChatHistoryItem, ChatLanguage } from "@/lib/chatbot/types";
import type { CustomerContext } from "@/lib/agent/context";
import type { ChatbotConfig } from "./config";
import { buildSystemPrompt } from "./prompt";
import { shrinkGeminiHistoryForRetry } from "./contextManagement";

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

  constructor(message: string, options: { retryable: boolean; status?: number }) {
    super(message);
    this.name = "GeminiServiceError";
    this.retryable = options.retryable;
    this.status = options.status;
  }
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
  agentContext?: {
    conversationSummary?: string;
    customerContext?: CustomerContext;
    offerHandoff?: boolean;
    needsContactCapture?: boolean;
    contactAlreadyAsked?: boolean;
  },
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
          }),
        },
      ],
    },
    contents: [...toGeminiHistory(history), { role: "user", parts: [{ text: message }] }],
    generationConfig: {
      maxOutputTokens: config.maxOutputTokens,
      temperature: 0.4,
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

    const payload = (await response.json()) as GeminiResponse;

    if (!response.ok) {
      const message = payload.error?.message ?? `Gemini request failed (${response.status})`;
      const contextOverflow =
        response.status === 400 &&
        /context|token|length|too large|exceed/i.test(message);
      const retryable =
        response.status === 429 || response.status >= 500 || contextOverflow;
      throw new GeminiServiceError(message, { retryable, status: response.status });
    }

    const text = payload.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim();

    if (!text) {
      throw new GeminiServiceError("Empty Gemini response", { retryable: true });
    }

    return text;
  } catch (error) {
    if (error instanceof GeminiServiceError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new GeminiServiceError("Gemini request timed out", { retryable: true });
    }
    throw new GeminiServiceError("Gemini network error", { retryable: true });
  } finally {
    clearTimeout(timeout);
  }
}

export async function generateChatReply(
  config: ChatbotConfig,
  language: ChatLanguage,
  message: string,
  history: ChatHistoryItem[],
  retrievedKnowledge: string,
  agentContext?: {
    conversationSummary?: string;
    customerContext?: CustomerContext;
    offerHandoff?: boolean;
    needsContactCapture?: boolean;
    contactAlreadyAsked?: boolean;
  },
): Promise<string> {
  try {
    return await callGeminiOnce(
      config,
      language,
      message,
      history,
      retrievedKnowledge,
      agentContext,
    );
  } catch (error) {
    if (error instanceof GeminiServiceError && error.retryable) {
      const trimmedHistory =
        error.status === 400 ? shrinkGeminiHistoryForRetry(history) : history;
      return callGeminiOnce(
        config,
        language,
        message,
        trimmedHistory,
        retrievedKnowledge,
        agentContext,
      );
    }
    throw error;
  }
}
