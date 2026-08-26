import type { Firestore } from "firebase-admin/firestore";
import { KNOWLEDGE_COLLECTION, type KnowledgeDocument } from "@/lib/agent/types";
import { isProtectedKnowledgeDocumentId } from "./knowledgeProtect";

export async function upsertKnowledgeDocumentsAdmin(
  db: Firestore,
  documents: KnowledgeDocument[],
): Promise<void> {
  for (const document of documents) {
    await db.collection(KNOWLEDGE_COLLECTION).doc(document.id).set(document, { merge: true });
  }
}

export async function deleteStaleKnowledgeDocumentsAdmin(
  db: Firestore,
  activeIds: Set<string>,
): Promise<number> {
  const snap = await db.collection(KNOWLEDGE_COLLECTION).get();
  let removed = 0;
  for (const item of snap.docs) {
    if (activeIds.has(item.id)) continue;
    if (isProtectedKnowledgeDocumentId(item.id)) continue;
    await item.ref.delete();
    removed += 1;
  }
  return removed;
}

export async function loadAllKnowledgeDocumentsAdmin(db: Firestore): Promise<KnowledgeDocument[]> {
  const snap = await db.collection(KNOWLEDGE_COLLECTION).get();
  return snap.docs.map((item) => item.data() as KnowledgeDocument);
}

export async function countKnowledgeDocumentsAdmin(db: Firestore): Promise<number> {
  const snap = await db.collection(KNOWLEDGE_COLLECTION).get();
  return snap.size;
}
