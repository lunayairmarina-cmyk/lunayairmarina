import { normalizeMessage, tokenize } from "./normalize";

export type DialectHint = "formal_ar" | "gulf" | "egyptian" | "english" | "arabizi" | "mixed";

const GULF = new Set(["ابغى", "ابي", "ابغ", "ودي", "وش", "ايش", "وين", "تقدرون", "ابغى"]);
const EGYPT = new Set(["عايز", "عاوز", "محتاج", "فين", "ازاي", "كام", "عامل"]);
const ARABIZI = new Set([
  "3ayez",
  "3ayz",
  "7ad",
  "el",
  "se3r",
  "se3er",
  "bkam",
  "bkm",
  "kam",
  "wen",
  "fen",
  "edara",
  "edaret",
  "yacht",
  "marina",
]);

export function detectDialect(message: string): DialectHint {
  const raw = message.trim();
  const n = normalizeMessage(message);
  const tokens = tokenize(n);

  const hasArabic = /[\u0600-\u06FF]/.test(raw);
  const hasLatin = /[a-z]/i.test(raw);
  const arabiziHits = tokens.filter((t) => ARABIZI.has(t) || /\d/.test(t)).length;

  if (arabiziHits >= 2 || (hasLatin && /[a-z]*\d[a-z\d]*/i.test(raw))) return "arabizi";
  if (!hasArabic && hasLatin) return "english";
  if (hasLatin && hasArabic && arabiziHits >= 1) return "arabizi";
  if (hasArabic && hasLatin) return "mixed";

  let gulf = 0;
  let egypt = 0;
  for (const t of tokens) {
    if (GULF.has(t)) gulf += 1;
    if (EGYPT.has(t)) egypt += 1;
  }
  if (egypt > gulf && egypt > 0) return "egyptian";
  if (gulf > 0) return "gulf";
  return "formal_ar";
}
