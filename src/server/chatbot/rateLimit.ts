import type { ChatbotConfig } from "./config";

interface SessionBucket {
  windowStart: number;
  requestCount: number;
}

/**
 * In-memory per-session abuse limiter (per serverless instance).
 * Not a conversation message cap — only blocks rapid automated abuse.
 * On Vercel, each instance has its own map; limits are approximate but sufficient for abuse.
 */
const sessionBuckets = new Map<string, SessionBucket>();

const MAX_TRACKED_SESSIONS = 10_000;

function pruneIfNeeded() {
  if (sessionBuckets.size <= MAX_TRACKED_SESSIONS) return;
  const oldest = [...sessionBuckets.entries()]
    .sort((a, b) => a[1].windowStart - b[1].windowStart)
    .slice(0, Math.floor(MAX_TRACKED_SESSIONS / 4));
  for (const [key] of oldest) sessionBuckets.delete(key);
}

export type RateLimitResult = { allowed: true } | { allowed: false; reason: "frequency" };

export function checkRateLimit(sessionId: string, config: ChatbotConfig): RateLimitResult {
  const now = Date.now();
  const bucket = sessionBuckets.get(sessionId) ?? {
    windowStart: now,
    requestCount: 0,
  };

  if (now - bucket.windowStart >= config.rateLimitWindowMs) {
    bucket.windowStart = now;
    bucket.requestCount = 0;
  }

  bucket.requestCount += 1;
  sessionBuckets.set(sessionId, bucket);
  pruneIfNeeded();

  if (bucket.requestCount > config.rateLimitMaxRequests) {
    return { allowed: false, reason: "frequency" };
  }

  return { allowed: true };
}

/** Test-only reset helper. */
export function resetRateLimitStoreForTests() {
  sessionBuckets.clear();
}
