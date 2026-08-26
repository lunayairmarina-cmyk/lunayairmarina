import type { Firestore as AdminFirestore } from "firebase-admin/firestore";
import { stripUndefinedDeep } from "@/lib/agent/firestoreSanitize";
import {
  AI_CONVERSATIONS_COLLECTION,
  AI_MESSAGES_SUBCOLLECTION,
  type AiConversationRecord,
  type AiMessageRecord,
} from "@/lib/agent/types";

export async function loadConversationAdmin(
  db: AdminFirestore,
  sessionId: string,
): Promise<AiConversationRecord | null> {
  try {
    const snap = await db.collection(AI_CONVERSATIONS_COLLECTION).doc(sessionId).get();
    if (!snap.exists) return null;
    return snap.data() as AiConversationRecord;
  } catch {
    return null;
  }
}

export async function saveConversationAdmin(
  db: AdminFirestore,
  record: AiConversationRecord,
): Promise<void> {
  await db
    .collection(AI_CONVERSATIONS_COLLECTION)
    .doc(record.sessionId)
    .set(stripUndefinedDeep(record), { merge: true });
}

export async function appendConversationMessageAdmin(
  db: AdminFirestore,
  sessionId: string,
  message: AiMessageRecord,
): Promise<void> {
  await db
    .collection(AI_CONVERSATIONS_COLLECTION)
    .doc(sessionId)
    .collection(AI_MESSAGES_SUBCOLLECTION)
    .doc(message.id)
    .set(stripUndefinedDeep(message), { merge: true });
}

export async function listRecentConversationsAdmin(
  db: AdminFirestore,
  max = 40,
): Promise<AiConversationRecord[]> {
  try {
    const snap = await db
      .collection(AI_CONVERSATIONS_COLLECTION)
      .orderBy("lastMessageAt", "desc")
      .limit(max)
      .get();
    return snap.docs.map((item) => item.data() as AiConversationRecord);
  } catch {
    const snap = await db.collection(AI_CONVERSATIONS_COLLECTION).limit(max).get();
    return snap.docs
      .map((item) => item.data() as AiConversationRecord)
      .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
  }
}
