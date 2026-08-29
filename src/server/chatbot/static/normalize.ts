/**
 * Arabic / English / Arabizi normalization for static intent matching.
 */

const ARABIC_DIACRITICS = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const TATWEEL = /\u0640/g;

/** Common Arabizi digit → letter (partial, high-confidence only). */
const ARABIZI_MAP: Record<string, string> = {
  "2": "ا",
  "3": "ع",
  "5": "خ",
  "6": "ط",
  "7": "ح",
  "8": "ق",
  "9": "ص",
};

export function normalizeArabic(text: string): string {
  let s = text.toLowerCase();
  s = s.replace(ARABIC_DIACRITICS, "").replace(TATWEEL, "");
  s = s.replace(/[؟?!.,،؛:]/g, " ");
  s = s.replace(/[أإآٱ]/g, "ا");
  s = s.replace(/ى/g, "ي");
  s = s.replace(/ة/g, "ه");
  s = s.replace(/ؤ/g, "و");
  s = s.replace(/ئ/g, "ي");
  s = s.replace(/[^\u0600-\u06FFa-z0-9\s]/g, " ");
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

export function normalizeEnglish(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\u0600-\u06FFa-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Light Arabizi: expand isolated digits in latin words only. */
export function normalizeArabizi(text: string): string {
  let s = normalizeEnglish(text);
  // whole-word arabizi tokens
  const tokens = s.split(" ");
  const out = tokens.map((t) => {
    if (/^[2356789]+$/.test(t) && t.length <= 2) {
      return ARABIZI_MAP[t] ?? t;
    }
    if (t === "3ayez" || t === "3ayz" || t === "3ayez") return "عايز";
    if (t === "ydeer" || t === "ddeer") return "يدير";
    if (t === "el") return "";
    if (t === "edaret" || t === "edara") return "اداره";
    if (t === "abeg" || t === "abg" || t === "abghi") return "ابغى";
    if (t === "bkam" || t === "bkm") return "بكام";
    if (t === "kam") return "كم";
    if (t === "raqam" || t === "raqamkom") return "رقم";
    if (t === "wsh" || t === "esh") return "وش";
    if (t === "wen" || t === "wenkom") return "وين";
    if (t === "fen") return "فين";
    if (t === "se3r") return "سعر";
    if (t === "a3raf" || t === "3araf") return "اعرف";
    if (t === "7ad") return "حد";
    if (t === "yemsek" || t === "ymskon") return "يمسك";
    return t;
  });
  return out.join(" ");
}

export function normalizeMessage(text: string): string {
  const combined = normalizeArabizi(text);
  const normalized = normalizeArabic(combined);
  return normalized
    .split(" ")
    .map((token) => {
      let t = token;
      for (let i = 0; i < 2; i += 1) {
        if (t.startsWith("وال") && t.length > 4) {
          t = t.slice(3);
          continue;
        }
        if (t.startsWith("ال") && t.length > 3) {
          t = t.slice(2);
          continue;
        }
        if (t.startsWith("و") && t.length > 2) {
          t = t.slice(1);
          continue;
        }
        break;
      }
      return t;
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(normalized: string): string[] {
  if (!normalized) return [];
  return normalized.split(" ").filter((t) => t.length > 0);
}

export function isShortMessage(text: string, maxWords = 4): boolean {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.length <= maxWords;
}
