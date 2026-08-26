/**
 * Server-only knowledge sync (Firebase Admin SDK).
 * Do not import this module from client/admin UI bundles.
 */
import type { Firestore as AdminFirestore } from "firebase-admin/firestore";
import {
  KNOWLEDGE_SYNC_COLLECTION,
  KNOWLEDGE_SYNC_STATUS_ID,
  type KnowledgeSyncStatus,
} from "@/lib/agent/types";
import { tryGetAdminFirestore } from "./firebaseAdmin";
import { runKnowledgeIngestionAdmin } from "./ingestAdmin";
import { resetKnowledgeCacheForTests } from "./retrieve";

const DEBOUNCE_MS = 45_000;
let lastIngestAttemptAt = 0;
let ingestInFlight = false;

export async function readKnowledgeSyncStatusAdmin(
  db: AdminFirestore,
): Promise<KnowledgeSyncStatus | null> {
  try {
    const snap = await db.collection(KNOWLEDGE_SYNC_COLLECTION).doc(KNOWLEDGE_SYNC_STATUS_ID).get();
    return snap.exists ? (snap.data() as KnowledgeSyncStatus) : null;
  } catch {
    return null;
  }
}

/**
 * If CMS marked knowledge stale and Admin SDK is available, re-ingest once (debounced).
 * Never runs on every chat — only when needsReingest is true.
 */
export async function maybeRunPendingKnowledgeSync(): Promise<{
  ran: boolean;
  total?: number;
  error?: string;
}> {
  if (ingestInFlight) return { ran: false };
  if (Date.now() - lastIngestAttemptAt < DEBOUNCE_MS) return { ran: false };

  const adminDb = tryGetAdminFirestore();
  if (!adminDb) return { ran: false };

  const status = await readKnowledgeSyncStatusAdmin(adminDb);
  if (!status?.needsReingest) return { ran: false };

  ingestInFlight = true;
  lastIngestAttemptAt = Date.now();
  try {
    const report = await runKnowledgeIngestionAdmin(adminDb);
    resetKnowledgeCacheForTests();
    await adminDb.collection(KNOWLEDGE_SYNC_COLLECTION).doc(KNOWLEDGE_SYNC_STATUS_ID).set(
      {
        needsReingest: false,
        lastIngestAt: new Date().toISOString(),
        lastIngestTotal: report.totalDocuments,
        lastError: "",
      },
      { merge: true },
    );
    return { ran: true, total: report.totalDocuments };
  } catch (error) {
    const message = error instanceof Error ? error.message : "ingest failed";
    try {
      await adminDb
        .collection(KNOWLEDGE_SYNC_COLLECTION)
        .doc(KNOWLEDGE_SYNC_STATUS_ID)
        .set({ lastError: message.slice(0, 300) }, { merge: true });
    } catch {
      // ignore
    }
    return { ran: false, error: message };
  } finally {
    ingestInFlight = false;
  }
}

/** Admin-triggered sync (dashboard button / server fn). */
export async function runKnowledgeSyncNow(reason = "manual_admin"): Promise<{
  ok: boolean;
  total?: number;
  error?: string;
}> {
  const adminDb = tryGetAdminFirestore();
  if (!adminDb) {
    return {
      ok: false,
      error: "Firebase Admin credentials not configured on the server.",
    };
  }
  try {
    await adminDb.collection(KNOWLEDGE_SYNC_COLLECTION).doc(KNOWLEDGE_SYNC_STATUS_ID).set(
      {
        needsReingest: true,
        reason,
        requestedAt: new Date().toISOString(),
      },
      { merge: true },
    );
    lastIngestAttemptAt = 0;
    const result = await maybeRunPendingKnowledgeSync();
    if (result.ran) return { ok: true, total: result.total };
    return { ok: false, error: result.error ?? "Sync did not run." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Sync failed",
    };
  }
}
