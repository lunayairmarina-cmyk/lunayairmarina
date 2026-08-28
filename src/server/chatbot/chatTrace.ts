/** Structured chat pipeline logging — never logs secrets or full message bodies. */

const SENSITIVE_KEY =
  /api[_-]?key|secret|password|private[_-]?key|credential|service[_-]?account|authorization/i;

function sanitizeValue(key: string, value: unknown): unknown {
  if (SENSITIVE_KEY.test(key)) return "[redacted]";
  if (typeof value === "string") {
    if (value.length > 240) return `${value.slice(0, 240)}…`;
    return value;
  }
  if (Array.isArray(value)) return value.map((item) => sanitizeValue(key, item));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = sanitizeValue(k, v);
    }
    return out;
  }
  return value;
}

export function createChatRequestId(): string {
  return `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function logChatTrace(
  stage: string,
  data?: Record<string, unknown>,
  requestId?: string,
): void {
  const payload: Record<string, unknown> = requestId ? { requestId, ...data } : { ...data };
  const safe = payload
    ? Object.fromEntries(
        Object.entries(payload).map(([key, value]) => [key, sanitizeValue(key, value)]),
      )
    : {};
  console.info(`CHAT_${stage}`, JSON.stringify(safe));
}
