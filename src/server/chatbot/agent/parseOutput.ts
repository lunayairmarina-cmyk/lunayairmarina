import {
  geminiAgentOutputSchema,
  type GeminiAgentOutput,
} from "./types";

export type GeminiParseStatus = "valid" | "salvaged" | "failed";

export interface GeminiParseResult {
  status: GeminiParseStatus;
  output: GeminiAgentOutput | null;
  reply: string | null;
  errors: string[];
  salvageMethod?: string;
}

function normalizeRawInput(raw: unknown): string {
  if (raw == null) return "";
  if (typeof raw === "string") return raw;
  if (typeof raw === "object" && raw !== null && "reply" in raw) {
    const value = (raw as { reply: unknown }).reply;
    if (typeof value === "string") return value;
  }
  return String(raw);
}

function tryParseJson(text: string): unknown | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function extractFromMarkdownFence(raw: string): string | null {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return fenced?.[1]?.trim() ?? null;
}

function extractJsonSlice(raw: string): string | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  return raw.slice(start, end + 1);
}

function repairTruncatedJson(raw: string): string | null {
  const slice = extractJsonSlice(raw);
  if (!slice) return null;
  let open = 0;
  for (const ch of slice) {
    if (ch === "{") open += 1;
    if (ch === "}") open -= 1;
  }
  if (open <= 0) return slice;
  let repaired = slice;
  while (open > 0) {
    repaired += "}";
    open -= 1;
  }
  return repaired;
}

function salvageReplyText(raw: string, parsed: unknown | null): string | null {
  if (parsed && typeof parsed === "object" && parsed !== null && "reply" in parsed) {
    const value = (parsed as { reply: unknown }).reply;
    if (typeof value === "string" && value.trim()) return value.trim();
    if (value != null && typeof value !== "object") {
      const coerced = String(value).trim();
      if (coerced) return coerced;
    }
  }

  const patterns = [
    /"reply"\s*:\s*"((?:\\.|[^"\\])*)"/,
    /"reply"\s*:\s*'((?:\\.|[^'\\])*)'/,
    /reply\s*:\s*"((?:\\.|[^"\\])*)"/i,
  ];
  for (const pattern of patterns) {
    const match = raw.match(pattern);
    if (!match?.[1]) continue;
    try {
      const decoded = JSON.parse(`"${match[1]}"`);
      if (typeof decoded === "string" && decoded.trim()) return decoded.trim();
    } catch {
      const fallback = match[1].replace(/\\n/g, "\n").replace(/\\"/g, '"').trim();
      if (fallback) return fallback;
    }
  }
  return null;
}

function coerceParsedObject(parsed: unknown): Record<string, unknown> | null {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  return parsed as Record<string, unknown>;
}

function validateOutput(data: unknown): { ok: true; value: GeminiAgentOutput } | { ok: false; errors: string[] } {
  const result = geminiAgentOutputSchema.safeParse(data);
  if (result.success) {
    const reply = result.data.reply.trim();
    if (!reply) return { ok: false, errors: ["empty_reply"] };
    return { ok: true, value: { ...result.data, reply } };
  }
  return {
    ok: false,
    errors: result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
  };
}

export function parseGeminiAgentOutputDetailed(raw: unknown): GeminiParseResult {
  const text = normalizeRawInput(raw).trim();
  if (!text) {
    return { status: "failed", output: null, reply: null, errors: ["empty_input"] };
  }

  const attempts: Array<{ method: string; candidate: unknown | null }> = [];

  attempts.push({ method: "direct", candidate: tryParseJson(text) });

  const fenced = extractFromMarkdownFence(text);
  if (fenced) attempts.push({ method: "markdown_fence", candidate: tryParseJson(fenced) });

  const slice = extractJsonSlice(text);
  if (slice) attempts.push({ method: "json_slice", candidate: tryParseJson(slice) });

  const repaired = repairTruncatedJson(text);
  if (repaired && repaired !== slice) {
    attempts.push({ method: "truncated_repair", candidate: tryParseJson(repaired) });
  }

  for (const attempt of attempts) {
    const obj = coerceParsedObject(attempt.candidate);
    if (!obj) continue;
    const validated = validateOutput(obj);
    if (validated.ok) {
      return {
        status: attempt.method === "direct" ? "valid" : "salvaged",
        output: validated.value,
        reply: validated.value.reply,
        errors: [],
        salvageMethod: attempt.method === "direct" ? undefined : attempt.method,
      };
    }
  }

  for (const attempt of attempts) {
    const salvagedReply = salvageReplyText(text, attempt.candidate);
    if (!salvagedReply) continue;
    const base = coerceParsedObject(attempt.candidate) ?? {};
    const relaxed = validateOutput({ ...base, reply: salvagedReply });
    if (relaxed.ok) {
      return {
        status: "salvaged",
        output: relaxed.value,
        reply: relaxed.value.reply,
        errors: [],
        salvageMethod: `${attempt.method}_reply_only`,
      };
    }
  }

  const replyOnly = salvageReplyText(text, null);
  if (replyOnly && !text.trimStart().startsWith("{")) {
    const minimal = validateOutput({ reply: replyOnly });
    if (minimal.ok) {
      return {
        status: "salvaged",
        output: minimal.value,
        reply: minimal.value.reply,
        errors: ["partial_schema"],
        salvageMethod: "plain_text_reply",
      };
    }
  }

  if (replyOnly) {
    const minimal = validateOutput({ reply: replyOnly });
    if (minimal.ok) {
      return {
        status: "salvaged",
        output: minimal.value,
        reply: minimal.value.reply,
        errors: ["schema_relaxed"],
        salvageMethod: "reply_field_regex",
      };
    }
  }

  return {
    status: "failed",
    output: null,
    reply: null,
    errors: ["json_parse_failed"],
  };
}

/** Back-compat wrapper — returns null on failed parse (never fakes valid JSON). */
export function parseGeminiAgentOutput(raw: unknown): GeminiAgentOutput | null {
  const result = parseGeminiAgentOutputDetailed(raw);
  return result.output;
}

export function extractUserFacingReply(raw: unknown): string | null {
  const parsed = parseGeminiAgentOutputDetailed(raw);
  if (parsed.reply) return parsed.reply;
  const text = normalizeRawInput(raw).trim();
  if (!text || text.startsWith("{")) return null;
  return text.length > 0 ? text : null;
}
