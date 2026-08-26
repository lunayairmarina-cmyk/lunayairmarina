import { collection, doc, getDoc, setDoc, type Firestore } from "firebase/firestore";
import type { CustomerContext } from "@/lib/agent/context";
import type { AgentIntent } from "@/lib/agent/query";
import {
  AI_CONVERSATIONS_COLLECTION,
  AI_MESSAGES_SUBCOLLECTION,
  type AgentLanguage,
  type AiConversationRecord,
  type AiMessageRecord,
} from "@/lib/agent/types";

function conversationRef(db: Firestore, sessionId: string) {
  return doc(db, AI_CONVERSATIONS_COLLECTION, sessionId);
}

export async function loadConversation(
  db: Firestore,
  sessionId: string,
): Promise<AiConversationRecord | null> {
  try {
    const snap = await getDoc(conversationRef(db, sessionId));
    if (!snap.exists()) return null;
    return snap.data() as AiConversationRecord;
  } catch {
    return null;
  }
}

export async function saveConversation(db: Firestore, record: AiConversationRecord): Promise<void> {
  await setDoc(conversationRef(db, record.sessionId), record, { merge: true });
}

export async function appendConversationMessage(
  db: Firestore,
  sessionId: string,
  message: AiMessageRecord,
): Promise<void> {
  await setDoc(
    doc(db, AI_CONVERSATIONS_COLLECTION, sessionId, AI_MESSAGES_SUBCOLLECTION, message.id),
    message,
    { merge: true },
  );
}

export function buildConversationRecord(input: {
  sessionId: string;
  language: AgentLanguage;
  summary?: string;
  customerContext?: CustomerContext;
  lastIntent?: AgentIntent;
}): AiConversationRecord {
  const now = new Date().toISOString();
  const ctx = input.customerContext ?? { interests: [] };
  const record: AiConversationRecord = {
    conversationId: input.sessionId,
    sessionId: input.sessionId,
    language: input.language,
    startedAt: now,
    lastMessageAt: now,
    summary: input.summary ?? "",
    customerContext: ctx as unknown as Record<string, unknown>,
    lastIntent: input.lastIntent,
    status: "active",
    leadStatus: "none",
  };
  // Only set denormalized visitor fields when present (avoids undefined in Firestore writes).
  if (ctx.name?.trim()) record.visitorName = ctx.name.trim();
  if (ctx.phone?.trim()) record.visitorPhone = ctx.phone.trim();
  if (ctx.email?.trim()) record.visitorEmail = ctx.email.trim();
  return record;
}

export function makeMessageId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
