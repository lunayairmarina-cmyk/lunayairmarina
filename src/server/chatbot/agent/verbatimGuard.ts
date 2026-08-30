/**
 * Detect when Gemini copied KB prose verbatim (quality control — not a static fallback).
 */
function normalizeForMatch(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function longestCommonSubstringRatio(a: string, b: string): number {
  const sa = normalizeForMatch(a);
  const sb = normalizeForMatch(b);
  if (!sa || !sb) return 0;
  const short = sa.length <= sb.length ? sa : sb;
  const long = sa.length <= sb.length ? sb : sa;
  if (short.length < 24) return 0;

  let best = 0;
  for (let i = 0; i < short.length; i += 1) {
    for (let len = Math.min(short.length - i, long.length); len >= 24; len -= 1) {
      const slice = short.slice(i, i + len);
      if (long.includes(slice)) {
        best = Math.max(best, len);
        break;
      }
    }
  }
  return best / short.length;
}

/** True when reply closely mirrors a published KB snippet (likely copy-paste). */
export function isNearVerbatimKnowledgeMatch(reply: string, sources: string[]): boolean {
  const trimmed = reply.trim();
  if (trimmed.length < 30) return false;

  for (const source of sources) {
    const s = source.trim();
    if (s.length < 30) continue;
    const ratio = longestCommonSubstringRatio(trimmed, s);
    if (ratio >= 0.72) return true;
    // Full summary contained in reply
    if (normalizeForMatch(trimmed).includes(normalizeForMatch(s)) && s.length >= 40) return true;
  }
  return false;
}

/** Collect verbatim-check sources from verified service summaries and disclosure prose. */
export function collectVerbatimSources(sources: string[]): string[] {
  return sources.filter((s) => s.trim().length >= 30);
}

export const PARAPHRASE_RETRY_HINT = {
  en: "REPHRASE REQUIRED: Your prior draft copied published source text too closely. Keep the same verified facts but rewrite in fresh, natural conversational wording. Do not reuse the source summary sentence structure.",
  ar: "إعادة صياغة مطلوبة: المسودة السابقة قريبة جداً من النص المنشور. احتفظ بنفس الحقائق الموثّقة لكن أعد الصياغة بأسلوب محادثة طبيعي جديد دون نسخ جملة الملخص.",
} as const;
