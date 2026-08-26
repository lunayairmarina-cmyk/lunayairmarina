import type { AgentLanguage } from "@/lib/agent/types";
import type { SiteSettings } from "@/types/content";

type LocalizedValue = { en?: string; ar?: string } | string | null | undefined;

const SOCIAL_LABELS: Record<string, { en: string; ar: string }> = {
  instagram: { en: "Instagram", ar: "إنستجرام" },
  linkedin: { en: "LinkedIn", ar: "لينكدإن" },
  facebook: { en: "Facebook", ar: "فيسبوك" },
  youtube: { en: "YouTube", ar: "يوتيوب" },
  tiktok: { en: "TikTok", ar: "تيك توك" },
  x: { en: "X (Twitter)", ar: "X (تويتر)" },
  whatsapp: { en: "WhatsApp", ar: "واتساب" },
};

export function formatSocialLinks(
  socialLinks: SiteSettings["socialLinks"],
  language: AgentLanguage,
): string {
  return Object.entries(socialLinks)
    .filter(([, url]) => typeof url === "string" && url.trim())
    .map(([key, url]) => {
      const label = SOCIAL_LABELS[key]?.[language] ?? humanizeKey(key);
      return `${label}: ${url.trim()}`;
    })
    .join("\n");
}

export function socialKeywords(): string[] {
  return [
    "instagram",
    "insta",
    "linkedin",
    "facebook",
    "youtube",
    "tiktok",
    "twitter",
    "whatsapp",
    "social",
    "انستجرام",
    "انستا",
    "لينكد",
    "فيسبوك",
    "يوتيوب",
    "واتساب",
    "تواصل",
    "social media",
  ];
}

export function slugifyId(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function buildKnowledgeDocId(type: string, key: string, language: AgentLanguage): string {
  return `${type}-${slugifyId(key)}-${language}`;
}

export function pickLocalized(value: LocalizedValue, language: AgentLanguage): string {
  if (!value) return "";
  if (typeof value === "string") return stripHtml(value).trim();
  const primary = value[language]?.trim();
  if (primary) return stripHtml(primary).trim();
  const fallback = language === "ar" ? value.en : value.ar;
  return stripHtml(fallback ?? "").trim();
}

export function stripHtml(input: string): string {
  return input
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

export function joinSections(sections: Array<string | undefined | null>): string {
  return normalizeWhitespace(
    sections
      .map((section) => section?.trim())
      .filter(Boolean)
      .join("\n\n"),
  );
}

export function bulletLines(items: string[], prefix = "- "): string {
  return items
    .filter(Boolean)
    .map((item) => `${prefix}${item.trim()}`)
    .join("\n");
}

export function extractKeywords(...parts: Array<string | undefined>): string[] {
  const tokens = parts
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2);

  return [...new Set(tokens)].slice(0, 40);
}

export function isPlaceholderTrustCopy(text: string): boolean {
  return /will appear|coming soon|once verified|prepared for|profiles coming|will be listed|placeholder/i.test(
    text,
  );
}

export function isPlaceholderTeamBio(text: string): boolean {
  return /placeholder|مكان جاهز|coming soon|profile placeholder|ملف قائد.*أول/i.test(text);
}

export function isUnpublishedPriceClaim(text: string): boolean {
  return /\b(price|pricing|cost|\$|sar|ريال|سعر)\b/i.test(text);
}

export function flattenUnknown(value: unknown, language: AgentLanguage, depth = 0): string {
  if (value == null || depth > 4) return "";
  if (typeof value === "string") return stripHtml(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return value
      .map((item) => flattenUnknown(item, language, depth + 1))
      .filter(Boolean)
      .join("\n");
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if ("en" in record || "ar" in record) {
      return pickLocalized(record as LocalizedValue, language);
    }
    return Object.entries(record)
      .map(([key, nested]) => {
        const text = flattenUnknown(nested, language, depth + 1);
        if (!text) return "";
        return `${humanizeKey(key)}:\n${text}`;
      })
      .filter(Boolean)
      .join("\n\n");
  }
  return "";
}

function humanizeKey(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function truncateToTokenBudget(text: string, maxTokens: number): string {
  const maxChars = maxTokens * 4;
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars).trim()}\n…`;
}
