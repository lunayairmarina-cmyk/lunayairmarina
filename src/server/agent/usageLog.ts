/**
 * Best-effort AI usage / error telemetry (Admin SDK only).
 * Never blocks chat. Never logs secrets or full prompts.
 */
import type { Firestore as AdminFirestore } from "firebase-admin/firestore";
import { AI_USAGE_LOGS_COLLECTION } from "@/lib/agent/types";
import { tryGetAdminFirestore } from "./firebaseAdmin";

export type AiUsageEvent =
  | "chat_ok"
  | "chat_error"
  | "retrieval_fallback"
  | "website_search"
  | "lead_created"
  | "candidate_created"
  | "sync_ok"
  | "sync_error";

export interface AiUsageLogInput {
  event: AiUsageEvent;
  sessionId?: string;
  language?: "ar" | "en";
  intent?: string;
  fromFallback?: boolean;
  knowledgeSource?: string;
  documentCount?: number;
  confidence?: "high" | "medium" | "low";
  errorCode?: string;
  latencyMs?: number;
}

function sanitize(input: AiUsageLogInput): Record<string, unknown> {
  return {
    event: input.event,
    sessionId: input.sessionId?.slice(0, 80) ?? "",
    language: input.language ?? "",
    intent: input.intent?.slice(0, 64) ?? "",
    fromFallback: Boolean(input.fromFallback),
    knowledgeSource: input.knowledgeSource?.slice(0, 40) ?? "",
    documentCount: typeof input.documentCount === "number" ? input.documentCount : 0,
    confidence: input.confidence ?? "",
    errorCode: input.errorCode?.slice(0, 40) ?? "",
    latencyMs: typeof input.latencyMs === "number" ? Math.max(0, Math.round(input.latencyMs)) : 0,
    createdAt: new Date().toISOString(),
  };
}

export async function writeAiUsageLogAdmin(
  db: AdminFirestore,
  input: AiUsageLogInput,
): Promise<void> {
  const id = `ulog-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await db.collection(AI_USAGE_LOGS_COLLECTION).doc(id).set(sanitize(input));
}

/** Fire-and-forget usage log when Admin credentials exist. */
export function logAiUsage(input: AiUsageLogInput): void {
  void (async () => {
    const adminDb = await tryGetAdminFirestore();
    if (!adminDb) return;
    await writeAiUsageLogAdmin(adminDb, input);
  })().catch(() => {
    // Telemetry must never break chat.
  });
}
