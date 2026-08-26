import { collection, deleteDoc, doc, getDocs, setDoc, type Firestore } from "firebase/firestore";
import { KNOWLEDGE_COLLECTION, type KnowledgeDocument } from "@/lib/agent/types";
import { isProtectedKnowledgeDocumentId } from "./knowledgeProtect";

export async function upsertKnowledgeDocuments(
  db: Firestore,
  documents: KnowledgeDocument[],
): Promise<void> {
  for (const document of documents) {
    await setDoc(doc(db, KNOWLEDGE_COLLECTION, document.id), document, { merge: true });
  }
}

export async function deleteStaleKnowledgeDocuments(
  db: Firestore,
  activeIds: Set<string>,
): Promise<number> {
  const snap = await getDocs(collection(db, KNOWLEDGE_COLLECTION));
  let removed = 0;
  for (const item of snap.docs) {
    if (activeIds.has(item.id)) continue;
    if (isProtectedKnowledgeDocumentId(item.id)) continue;
    await deleteDoc(item.ref);
    removed += 1;
  }
  return removed;
}

export async function loadAllKnowledgeDocuments(db: Firestore): Promise<KnowledgeDocument[]> {
  const snap = await getDocs(collection(db, KNOWLEDGE_COLLECTION));
  return snap.docs.map((item) => item.data() as KnowledgeDocument);
}

export async function countKnowledgeDocuments(db: Firestore): Promise<number> {
  const snap = await getDocs(collection(db, KNOWLEDGE_COLLECTION));
  return snap.size;
}
