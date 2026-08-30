import type { DocumentReference, Firestore as AdminFirestore, Query } from "firebase-admin/firestore";
import { stripUndefinedDeep } from "@/lib/agent/firestoreSanitize";
import {
  AI_CONVERSATIONS_COLLECTION,
  AI_LEADS_COLLECTION,
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

export async function listConversationMessagesAdmin(
  db: AdminFirestore,
  sessionId: string,
  max = 1000,
): Promise<AiMessageRecord[]> {
  try {
    const snap = await db
      .collection(AI_CONVERSATIONS_COLLECTION)
      .doc(sessionId)
      .collection(AI_MESSAGES_SUBCOLLECTION)
      .orderBy("timestamp", "asc")
      .limit(max)
      .get();
    return snap.docs.map((item) => item.data() as AiMessageRecord);
  } catch {
    return [];
  }
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

async function deleteQueryBatch(
  db: AdminFirestore,
  query: Query,
): Promise<number> {
  const snap = await query.get();
  if (snap.empty) return 0;
  const batch = db.batch();
  snap.docs.forEach((item) => batch.delete(item.ref));
  await batch.commit();
  return snap.size;
}

async function deleteSubcollection(
  db: AdminFirestore,
  parentRef: DocumentReference,
  subcollection: string,
): Promise<number> {
  let deleted = 0;
  const collectionRef = parentRef.collection(subcollection);
  while (true) {
    const count = await deleteQueryBatch(db, collectionRef.limit(400));
    if (count === 0) break;
    deleted += count;
  }
  return deleted;
}

export async function deleteConversationAdmin(
  db: AdminFirestore,
  sessionId: string,
  leadId?: string,
): Promise<void> {
  const convRef = db.collection(AI_CONVERSATIONS_COLLECTION).doc(sessionId);
  await deleteSubcollection(db, convRef, AI_MESSAGES_SUBCOLLECTION);
  await convRef.delete();
  if (leadId?.trim()) {
    try {
      await db.collection(AI_LEADS_COLLECTION).doc(leadId).delete();
    } catch {
      // Lead may already be removed.
    }
  }
}

export async function deleteAllConversationsAdmin(db: AdminFirestore): Promise<number> {
  const snap = await db.collection(AI_CONVERSATIONS_COLLECTION).get();
  let deleted = 0;
  for (const item of snap.docs) {
    const record = item.data() as AiConversationRecord;
    await deleteConversationAdmin(db, item.id, record.leadId);
    deleted += 1;
  }
  return deleted;
}
