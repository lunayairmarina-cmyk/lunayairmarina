import type { LocalizedString } from "@/types/content";

export function asLocalized(
  value: LocalizedString | string | undefined | null,
  fallback = "",
): LocalizedString {
  if (!value) return { en: fallback, ar: fallback };
  if (typeof value === "string") return { en: value, ar: value };
  return {
    en: value.en || fallback,
    ar: value.ar || value.en || fallback,
  };
}

export function pairLocalized(en: string, ar: string): LocalizedString {
  const enTrim = en.trim();
  const arTrim = ar.trim();
  return {
    en: enTrim || arTrim,
    ar: arTrim || enTrim,
  };
}
