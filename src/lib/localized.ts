import type { LocalizedString } from "@/types/content";

const ARABIC_RE = /[\u0600-\u06FF]/;

export function hasArabicScript(value: string): boolean {
  return ARABIC_RE.test(value);
}

export function asLocalized(
  value: LocalizedString | string | undefined | null,
  fallback = "",
): LocalizedString {
  if (!value) return { en: fallback, ar: fallback };
  if (typeof value === "string") return { en: value, ar: value };
  return {
    en: value.en?.trim() || fallback,
    // Never silently copy English into Arabic — empty AR stays empty.
    ar: value.ar?.trim() || fallback,
  };
}

/** Build a localized pair without cross-filling languages. */
export function pairLocalized(en: string, ar: string): LocalizedString {
  return {
    en: en.trim(),
    ar: ar.trim(),
  };
}

/**
 * Admin table display: prefer the active UI language, then the other side.
 * Does not mutate stored values.
 */
export function adminDisplayLocalized(
  value: LocalizedString | string | undefined | null,
  language: "en" | "ar",
): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  const preferred = value[language]?.trim();
  if (preferred) return preferred;
  return (language === "ar" ? value.en : value.ar)?.trim() || "";
}
