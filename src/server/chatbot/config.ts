/** Server-only chatbot configuration. Never import from client components. */

export const CHATBOT_DEFAULTS = {
  maxMessageLength: 1000,
  maxHistoryItems: 8,
  maxMessagesPerSession: 50,
  rateLimitWindowMs: 60_000,
  rateLimitMaxRequests: 10,
  maxOutputTokens: 512,
  requestTimeoutMs: 30_000,
  geminiModel: "gemini-3.5-flash-lite",
} as const;

function readInt(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

export function getChatbotConfig() {
  return {
    geminiApiKey: process.env.GEMINI_API_KEY?.trim() ?? "",
    geminiModel: process.env.GEMINI_MODEL?.trim() || CHATBOT_DEFAULTS.geminiModel,
    maxMessageLength: readInt(
      "CHATBOT_MAX_MESSAGE_LENGTH",
      CHATBOT_DEFAULTS.maxMessageLength,
      100,
      4000,
    ),
    maxHistoryItems: readInt("CHATBOT_MAX_HISTORY", CHATBOT_DEFAULTS.maxHistoryItems, 2, 10),
    maxMessagesPerSession: readInt(
      "CHATBOT_MAX_MESSAGES_PER_SESSION",
      CHATBOT_DEFAULTS.maxMessagesPerSession,
      5,
      200,
    ),
    rateLimitWindowMs: readInt(
      "CHATBOT_RATE_LIMIT_WINDOW_MS",
      CHATBOT_DEFAULTS.rateLimitWindowMs,
      10_000,
      300_000,
    ),
    rateLimitMaxRequests: readInt(
      "CHATBOT_RATE_LIMIT_PER_MINUTE",
      CHATBOT_DEFAULTS.rateLimitMaxRequests,
      3,
      60,
    ),
    maxOutputTokens: readInt(
      "CHATBOT_MAX_OUTPUT_TOKENS",
      CHATBOT_DEFAULTS.maxOutputTokens,
      128,
      2048,
    ),
    requestTimeoutMs: readInt(
      "CHATBOT_REQUEST_TIMEOUT_MS",
      CHATBOT_DEFAULTS.requestTimeoutMs,
      5_000,
      120_000,
    ),
  };
}

export type ChatbotConfig = ReturnType<typeof getChatbotConfig>;
