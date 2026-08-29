import { loadChatbotIdentity, saveChatbotIdentity } from "./identity";
import { normalizeSaudiPhone } from "./phone";

const SESSION_KEY = "lunayair.chatbot.sessionId";

function createSessionId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID().replace(/-/g, "")
    : `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getOrCreateChatSessionId(): string {
  if (typeof window === "undefined") return "ssr-session";

  const identity = loadChatbotIdentity();
  if (identity?.sessionId && /^[a-zA-Z0-9_-]{8,64}$/.test(identity.sessionId)) {
    return identity.sessionId;
  }

  try {
    const fromLocal = window.localStorage.getItem(SESSION_KEY);
    if (fromLocal && /^[a-zA-Z0-9_-]{8,64}$/.test(fromLocal)) return fromLocal;

    const fromSession = window.sessionStorage.getItem(SESSION_KEY);
    if (fromSession && /^[a-zA-Z0-9_-]{8,64}$/.test(fromSession)) {
      window.localStorage.setItem(SESSION_KEY, fromSession);
      return fromSession;
    }

    const next = createSessionId();
    window.localStorage.setItem(SESSION_KEY, next);
    window.sessionStorage.setItem(SESSION_KEY, next);
    return next;
  } catch {
    return createSessionId();
  }
}

export function persistSessionId(sessionId: string, name?: string, phone?: string, language?: "ar" | "en"): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SESSION_KEY, sessionId);
    window.sessionStorage.setItem(SESSION_KEY, sessionId);
    if (name && phone) {
      const existing = loadChatbotIdentity();
      const now = new Date().toISOString();
      const normalized = normalizeSaudiPhone(phone);
      saveChatbotIdentity({
        sessionId,
        name,
        phone,
        normalizedPhone: normalized.normalized,
        registeredAt: existing?.registeredAt ?? now,
        lastSeenAt: now,
        language: language ?? existing?.language,
      });
    }
  } catch {
    // ignore
  }
}

export const CHATBOT_MAX_MESSAGE_LENGTH = 1000;
