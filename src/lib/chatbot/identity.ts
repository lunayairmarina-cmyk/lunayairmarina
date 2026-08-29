import { normalizeSaudiPhone } from "./phone";

export interface ChatbotIdentity {
  sessionId: string;
  name: string;
  phone: string;
  normalizedPhone: string;
  registeredAt: string;
  lastSeenAt: string;
  language?: "ar" | "en";
}

const IDENTITY_KEY = "lunayair.chatbot.identity";
const LEGACY_CONTACT_KEY = "lunayair.chatbot.contactSaved";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function loadChatbotIdentity(): ChatbotIdentity | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(IDENTITY_KEY);
    if (!raw) return migrateLegacyContactFlag();
    const parsed = JSON.parse(raw) as Partial<ChatbotIdentity>;
    if (
      !parsed.sessionId ||
      !parsed.name ||
      !parsed.phone ||
      typeof parsed.sessionId !== "string" ||
      !/^[a-zA-Z0-9_-]{8,64}$/.test(parsed.sessionId)
    ) {
      return null;
    }
    return {
      sessionId: parsed.sessionId,
      name: parsed.name.trim(),
      phone: parsed.phone.trim(),
      normalizedPhone: parsed.normalizedPhone ?? normalizeSaudiPhone(parsed.phone).normalized,
      registeredAt: parsed.registeredAt ?? new Date().toISOString(),
      lastSeenAt: parsed.lastSeenAt ?? new Date().toISOString(),
      language: parsed.language,
    };
  } catch {
    return null;
  }
}

/** Legacy sessionStorage flag had no name — treat as unregistered. */
function migrateLegacyContactFlag(): null {
  if (!isBrowser()) return null;
  try {
    if (window.sessionStorage.getItem(LEGACY_CONTACT_KEY) === "1") {
      window.sessionStorage.removeItem(LEGACY_CONTACT_KEY);
    }
  } catch {
    // ignore
  }
  return null;
}

export function saveChatbotIdentity(identity: ChatbotIdentity): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity));
  } catch {
    // ignore quota errors
  }
}

export function touchChatbotIdentity(): void {
  const existing = loadChatbotIdentity();
  if (!existing) return;
  saveChatbotIdentity({ ...existing, lastSeenAt: new Date().toISOString() });
}

export function isChatbotRegistered(): boolean {
  return loadChatbotIdentity() !== null;
}

export function buildIdentity(input: {
  sessionId: string;
  name: string;
  phone: string;
  language?: "ar" | "en";
}): ChatbotIdentity {
  const normalized = normalizeSaudiPhone(input.phone);
  const now = new Date().toISOString();
  return {
    sessionId: input.sessionId,
    name: input.name.trim(),
    phone: input.phone.trim(),
    normalizedPhone: normalized.normalized,
    registeredAt: now,
    lastSeenAt: now,
    language: input.language,
  };
}
