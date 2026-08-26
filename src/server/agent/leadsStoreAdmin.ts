import type { Firestore as AdminFirestore } from "firebase-admin/firestore";
import { AI_LEADS_COLLECTION, type AiLeadRecord } from "@/lib/agent/types";

export async function createAiLeadAdmin(
  db: AdminFirestore,
  record: AiLeadRecord,
): Promise<AiLeadRecord> {
  await db.collection(AI_LEADS_COLLECTION).doc(record.id).set(record);
  return record;
}

export async function updateAiLeadAdmin(
  db: AdminFirestore,
  id: string,
  patch: Partial<AiLeadRecord>,
): Promise<void> {
  await db.collection(AI_LEADS_COLLECTION).doc(id).set(patch, { merge: true });
}
