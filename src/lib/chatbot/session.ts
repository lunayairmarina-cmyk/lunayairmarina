const SESSION_KEY = "lunayair.chatbot.sessionId";

export function getOrCreateChatSessionId(): string {
  if (typeof window === "undefined") return "ssr-session";
  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY);
    if (existing && /^[a-zA-Z0-9_-]{8,64}$/.test(existing)) return existing;
    const next =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID().replace(/-/g, "")
        : `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    window.sessionStorage.setItem(SESSION_KEY, next);
    return next;
  } catch {
    return `sess_${Date.now()}`;
  }
}

export const CHATBOT_MAX_MESSAGE_LENGTH = 1000;
