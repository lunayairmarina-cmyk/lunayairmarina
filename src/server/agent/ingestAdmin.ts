import type { Firestore } from "firebase-admin/firestore";
import type { IngestionReport } from "@/lib/agent/types";
import { buildKnowledgeDocuments, summarizeIngestion } from "./buildDocuments";
import {
  countKnowledgeDocumentsAdmin,
  deleteStaleKnowledgeDocumentsAdmin,
  upsertKnowledgeDocumentsAdmin,
} from "./knowledgeStoreAdmin";
import { loadKnowledgeSourceBundleAdmin } from "./loadSourceAdmin";

export async function runKnowledgeIngestionAdmin(
  db: Firestore,
): Promise<IngestionReport & { removed: number }> {
  const bundle = await loadKnowledgeSourceBundleAdmin(db);
  const { documents, skipped } = buildKnowledgeDocuments(bundle);
  const activeIds = new Set(documents.map((doc) => doc.id));

  await upsertKnowledgeDocumentsAdmin(db, documents);
  const removed = await deleteStaleKnowledgeDocumentsAdmin(db, activeIds);
  const report = summarizeIngestion(documents, skipped);

  return { ...report, removed };
}

export { countKnowledgeDocumentsAdmin };
