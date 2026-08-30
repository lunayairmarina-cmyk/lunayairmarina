import type { CustomerContext } from "@/lib/agent/context";
import type { ChatLanguage } from "@/lib/chatbot/types";
import { detectProgressiveRequest, detectScopeQuestion, buildDisclosureFacts } from "./progressiveDisclosure";

/** Detect when the visitor shifts to a new informational topic (clears stale objection state). */
export function detectTopicShift(message: string): boolean {
  const text = message.normalize("NFKC").toLowerCase();
  if (detectScopeQuestion(message) || detectProgressiveRequest(message)) return true;
  if (/^(what services|what do you offer|what can you help|tell me about your services)/i.test(text)) {
    return true;
  }
  if (/^(وش خدمات|ممكن أعرف خدمات|ايش خدمات|what services)/i.test(text)) return true;
  if (/^(what is marina|marina services|خدمات المارينا|وش خدمات المارينا)/i.test(text)) return true;
  if (/^(hello|hi\b|مرحبا|السلام)/i.test(text) && text.length < 40) return true;
  return false;
}

const PERSISTENT_OBJECTIONS = new Set(["no_whatsapp", "no_contact_now"]);

/**
 * Active objections apply only to the current turn context.
 * Persistent preferences (no_whatsapp) survive topic shifts and new transient objections.
 */
export function resolveActiveObjections(
  prior: string[],
  message: string,
  detectedThisTurn: string[],
): string[] {
  const persistent = prior.filter((item) => PERSISTENT_OBJECTIONS.has(item));

  if (detectedThisTurn.length) {
    return [...new Set([...persistent, ...detectedThisTurn])];
  }

  if (detectTopicShift(message)) return persistent;
  return persistent;
}

/** Remove WhatsApp links in any common format (with/without scheme). */
export function stripWhatsAppLinks(text: string): string {
  return text
    .replace(/\n?\s*(?:https?:\/\/)?(?:www\.)?wa\.me\/[^\s]+/gi, "")
    .replace(/\n?\s*(?:https?:\/\/)?(?:api\.)?whatsapp\.com\/[^\s]+/gi, "")
    .trim();
}

/** True when reply assumes visitor-specific facts not present in context. */
export function detectPersonalizedContextBleed(reply: string, context: CustomerContext): boolean {
  const text = reply.normalize("NFKC");
  if (context.yachtLength && !text.includes(context.yachtLength.replace(/m$/i, ""))) {
    // context has length but reply doesn't reference it — not bleed
  }
  const lengthBleed =
    !context.yachtLength &&
    /(?:your|لك|يختك).*(?:45|٤٥)\s*(?:m|meter|متر)|(?:45|٤٥)\s*(?:m|meter|متر).*(?:yacht|يخت)/i.test(text);
  const locationBleed =
    !context.location && /(?:your|لك|يختك).*(?:jeddah|جدة)|(?:yacht|يخت).*(?:in jeddah|في جدة)/i.test(text);
  const serviceBleed =
    !context.lastServiceMentioned &&
    /(?:your|لك).*(?:management|إدارة).*(?:yacht|يخت)/i.test(text);
  return lengthBleed || locationBleed || serviceBleed;
}

/** Strip sensitive fields before sending context to Gemini. */
export function sanitizeContextForGemini(context: CustomerContext): CustomerContext {
  const { phone, email, normalizedPhone, ...safe } = context;
  void phone;
  void email;
  void normalizedPhone;
  return {
    ...safe,
    interests: Array.isArray(safe.interests) ? safe.interests : [],
  };
}

/** Safe session-language reply when Gemini returns the wrong language. */
export function repairLanguageMismatchReply(
  language: ChatLanguage,
  analysis?: { disclosureLevel?: number; disclosureTopic?: string },
): string {
  if (analysis?.disclosureLevel && analysis.disclosureLevel > 0 && analysis.disclosureTopic) {
    const facts = buildDisclosureFacts(analysis.disclosureTopic, analysis.disclosureLevel, language);
    if (facts) {
      const prefix = language === "ar" ? "باختصار:" : "In brief:";
      return `${prefix}\n${facts}`;
    }
  }
  return language === "ar"
    ? "كيف أقدر أساعدك في خدمات Lunayair Marina؟"
    : "How can I help with Lunayair Marina services?";
}

/** True when reply language mismatches session language. */
export function detectReplyLanguageMismatch(reply: string, language: "ar" | "en"): boolean {
  const text = reply.normalize("NFKC");
  const latin = (text.match(/[a-zA-Z]/g) ?? []).length;
  const arabic = (text.match(/[\u0600-\u06FF]/g) ?? []).length;
  if (language === "en" && arabic > 12 && latin < 8) return true;
  if (language === "ar" && latin > 20 && arabic < 6) return true;
  return false;
}

/** Detect raw JSON leaked into user-facing reply. */
export function looksLikeLeakedJson(reply: string): boolean {
  const trimmed = reply.trim();
  if (trimmed.startsWith("{") && trimmed.includes('"reply"')) return true;
  if (/^\s*\{\s*"intent"/.test(trimmed)) return true;
  return false;
}
