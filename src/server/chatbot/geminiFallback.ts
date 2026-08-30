import type { ChatLanguage } from "@/lib/chatbot/types";

export const GEMINI_FALLBACK_REPLY = {
  ar: "أعتذر، أواجه مشكلة مؤقتة في معالجة رسالتك. يمكنك التواصل معنا مباشرة عبر واتساب.",
  en: "Sorry, I'm having a temporary issue processing your message. You can reach us directly on WhatsApp.",
} as const;

export const GEMINI_UNCLEAR_REPLY = {
  ar: "ما قدرت أحدد طلبك بشكل دقيق. أقدر أساعدك في خدمات Lunayair Marina، أو يمكنك التواصل معنا مباشرة عبر واتساب.",
  en: "I couldn't identify your request clearly. I can help with Lunayair Marina services, or you can reach us directly on WhatsApp.",
} as const;

export function getGeminiFallbackReply(language: ChatLanguage): string {
  return language === "ar" ? GEMINI_FALLBACK_REPLY.ar : GEMINI_FALLBACK_REPLY.en;
}

export function getGeminiUnclearReply(language: ChatLanguage): string {
  return language === "ar" ? GEMINI_UNCLEAR_REPLY.ar : GEMINI_UNCLEAR_REPLY.en;
}

export function isUsableAssistantReply(reply: unknown): reply is string {
  return typeof reply === "string" && reply.trim().length > 0;
}

/** Never return an empty assistant message to the user. */
export function ensureAssistantReply(
  reply: unknown,
  language: ChatLanguage,
  reason: "empty" | "error" = "empty",
): string {
  if (isUsableAssistantReply(reply)) return reply.trim();
  return reason === "error" ? getGeminiFallbackReply(language) : getGeminiUnclearReply(language);
}
