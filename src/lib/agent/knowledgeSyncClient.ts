import { doc, getDoc, setDoc, type Firestore } from "firebase/firestore";
import {
  KNOWLEDGE_SYNC_COLLECTION,
  KNOWLEDGE_SYNC_STATUS_ID,
  type KnowledgeSyncStatus,
} from "@/lib/agent/types";

/** Client-safe: mark CMS knowledge stale (admin auth required by rules). */
export async function markKnowledgeNeedsReingest(db: Firestore, reason: string): Promise<void> {
  const payload: KnowledgeSyncStatus = {
    needsReingest: true,
    reason: reason.slice(0, 200),
    requestedAt: new Date().toISOString(),
  };
  await setDoc(doc(db, KNOWLEDGE_SYNC_COLLECTION, KNOWLEDGE_SYNC_STATUS_ID), payload, {
    merge: true,
  });
}

/** Client-safe sync status read for admin dashboard. */
export async function readKnowledgeSyncStatusClient(
  db: Firestore,
): Promise<KnowledgeSyncStatus | null> {
  try {
    const snap = await getDoc(doc(db, KNOWLEDGE_SYNC_COLLECTION, KNOWLEDGE_SYNC_STATUS_ID));
    return snap.exists() ? (snap.data() as KnowledgeSyncStatus) : null;
  } catch {
    return null;
  }
}
