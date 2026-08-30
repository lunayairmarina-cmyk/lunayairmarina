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
  | "chat_message"
  | "intent_detected"
  | "retrieval_fallback"
  | "website_search"
  | "lead_created"
  | "lead_score_changed"
  | "stage_changed"
  | "cta_shown"
  | "handoff_triggered"
  | "objection_detected"
  | "missing_info_asked"
  | "conversion_signal"
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
  stage?: string;
  nba?: string;
  score?: number;
  urgency?: string;
  disclosureLevel?: number;
  disclosureTopic?: string;
  objectionTypes?: string;
  missingField?: string;
  ctaType?: string;
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
    stage: input.stage?.slice(0, 40) ?? "",
    nba: input.nba?.slice(0, 40) ?? "",
    score: typeof input.score === "number" ? Math.max(0, Math.min(100, Math.round(input.score))) : 0,
    urgency: input.urgency?.slice(0, 12) ?? "",
    disclosureLevel:
      typeof input.disclosureLevel === "number"
        ? Math.max(0, Math.min(4, Math.round(input.disclosureLevel)))
        : 0,
    disclosureTopic: input.disclosureTopic?.slice(0, 48) ?? "",
    objectionTypes: input.objectionTypes?.slice(0, 80) ?? "",
    missingField: input.missingField?.slice(0, 32) ?? "",
    ctaType: input.ctaType?.slice(0, 24) ?? "",
    createdAt: new Date().toISOString(),
  };
}

/** Test-only export for certification suites. */
export function sanitizeAiUsageLogInput(input: AiUsageLogInput): Record<string, unknown> {
  return sanitize(input);
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
