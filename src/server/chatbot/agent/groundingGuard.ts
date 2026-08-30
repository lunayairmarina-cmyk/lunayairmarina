import type { ChatLanguage } from "@/lib/chatbot/types";
import servicesFile from "@/data/chatbot/services.json";
import locations from "@/data/chatbot/locations.json";
import limitations from "@/data/chatbot/limitations.json";

export interface GroundingViolation {
  code: string;
  severity: "critical" | "warning";
}

const INVENTED_PRICE =
  /\d{2,}(?:[.,]\d+)?\s*(?:sar|ريال|ر\.?\s*س|usd|\$|eur|€)/i;
const INVENTED_PRICE_PHRASE =
  /(?:from|starts at|starting at|يبدأ\s*من|ابتداءً\s*من|سعر\s*يبدأ)\s*\d{2,}/i;
const DISCOUNT = /(?:خصم|discount|\d+\s*%\s*(?:off|خصم)|promo code|كود خصم)/i;
const GUARANTEE =
  /(?:نضمن|نضمن لك|guarantee|guaranteed|money.?back|best price|أفضل سعر|أرخص|lowest price)/i;
const AVAILABILITY =
  /(?:available today|same.?day|متاح اليوم|توفر فوري|immediate availability|book now today|slots available)/i;
const UNPUBLISHED_SERVICE =
  /(?:yacht rental|تأجير يخوت|buy a yacht|شراء يخت|sell your yacht|بيع يخت|yacht sales)/i;
const SECURITY_LEAK =
  /(?:systeminstruction|gemini_api_key|you are assistant captain[\s\S]{40,}never invent|AGENT STATE \(internal)/i;
const UNPUBLISHED_CITIES = /(?:في\s+)?(?:الرياض|riyadh|الدمام|dammam|الخبر|khobar|مكة|mecca)/i;
const CERTIFICATION =
  /(?:ISO\s*\d{4,5}|certified by|معتمد من|accredited by|شهادة ISO|class society approved)/i;
const SUPERIORITY =
  /(?:best in (?:saudi|the region|the gulf)|الأفضل في|رقم واحد|#1 marina|market leader)/i;

const PUBLISHED_LOCATIONS = new Set(
  [
    ...locations.regions.flatMap((r) => [r.en.toLowerCase(), r.ar]),
    locations.headquarters.city.en.toLowerCase(),
    locations.headquarters.city.ar,
    "jeddah",
    "jedah",
    "جدة",
    "red sea",
    "البحر الأحمر",
    "neom",
    "نيوم",
    "dubai",
    "دبي",
    "gulf",
    "الخليج",
    "saudi",
    "السعودية",
  ].map((item) => item.normalize("NFKC").toLowerCase()),
);

const PUBLISHED_SERVICE_TERMS = servicesFile.services.flatMap((service) => {
  const terms = [
    service.id,
    service.slug,
    service.title.en,
    service.title.ar,
    ...service.includes.en,
    ...service.includes.ar,
  ];
  return terms.map((t) => t.toLowerCase());
});

export function detectGroundingViolations(reply: string): GroundingViolation[] {
  const text = reply.normalize("NFKC");
  const violations: GroundingViolation[] = [];
  if (INVENTED_PRICE.test(text) || INVENTED_PRICE_PHRASE.test(text)) {
    violations.push({ code: "invented_price", severity: "critical" });
  }
  if (DISCOUNT.test(text)) violations.push({ code: "invented_discount", severity: "critical" });
  if (GUARANTEE.test(text)) violations.push({ code: "unpublished_guarantee", severity: "critical" });
  if (AVAILABILITY.test(text)) violations.push({ code: "invented_availability", severity: "critical" });
  if (UNPUBLISHED_SERVICE.test(text) && !/not listed|غير مدرج|not published|غير منشور|out of scope/i.test(text)) {
    violations.push({ code: "unpublished_service_claim", severity: "critical" });
  }
  if (SECURITY_LEAK.test(text)) violations.push({ code: "security_leak", severity: "critical" });
  if (CERTIFICATION.test(text)) violations.push({ code: "unpublished_certification", severity: "critical" });
  if (SUPERIORITY.test(text)) violations.push({ code: "unpublished_superiority", severity: "warning" });
  return violations;
}

export function detectKbGroundingViolations(reply: string, _language: ChatLanguage): GroundingViolation[] {
  const base = detectGroundingViolations(reply);
  const text = reply.normalize("NFKC").toLowerCase();

  const locationClaim = text.match(/(?:in|at|في)\s+([a-z\u0600-\u06FF\s]{3,30})/i);
  if (locationClaim?.[1]) {
    const claimed = locationClaim[1].trim().toLowerCase();
    const known = [...PUBLISHED_LOCATIONS].some(
      (loc) => claimed.includes(loc) || loc.includes(claimed.slice(0, Math.min(claimed.length, 8))),
    );
    if (!known && /(?:marina|port|harbor|ميناء|مارينا)/i.test(text)) {
      base.push({ code: "unpublished_location", severity: "warning" });
    }
  }

  if (UNPUBLISHED_CITIES.test(text) && !/not (?:in|listed|published|available)|غير (?:منشور|متوف|مذكور)/i.test(text)) {
    base.push({ code: "unpublished_location", severity: "critical" });
  }

  const rentalPositive = /(?:we offer|نقدم|available|متوفرة).*(?:rental|تأجير)/i.test(text);
  if (rentalPositive) {
    base.push({ code: "unpublished_service_claim", severity: "critical" });
  }

  return base;
}

export function stripUnsupportedClaims(reply: string, language: ChatLanguage): string {
  const sentences = reply.split(/(?<=[.!?؟])\s+/);
  const kept = sentences.filter((sentence) => {
    const violations = detectKbGroundingViolations(sentence, language);
    return !violations.some((v) => v.severity === "critical");
  });
  if (kept.length === 0) return safePricingFallback(language);
  return kept.join(" ").trim();
}

export function countQuestions(reply: string): number {
  return (reply.match(/[?؟]/g) ?? []).length;
}

export function asksKnownMissingField(
  reply: string,
  askedFields: string[],
  language: ChatLanguage,
): boolean {
  const text = reply.toLowerCase();
  for (const field of askedFields) {
    if (field === "yachtLength" && /(?:طول|length|كم متر|how long|what size)/i.test(text)) return true;
    if (field === "location" && /(?:وين|أين|location|where)/i.test(text)) return true;
    if (field === "yachtType" && /(?:نوع اليخت|yacht type|motor or sail)/i.test(text)) return true;
    if (field === "customerGoal" && /(?:هدف|goal|what do you need|وش تبي)/i.test(text)) return true;
  }
  return false;
}

export function safePricingFallback(language: ChatLanguage): string {
  return language === "ar"
    ? "السعر يعتمد على تفاصيل اليخت والخدمة، والأسعار العامة غير منشورة على الموقع. أقدر أساعدك نحدد المتطلبات أولاً."
    : "Pricing depends on your yacht details and required services; public pricing is not published on the website. I can help clarify your requirements first.";
}

export function safeSecurityFallback(language: ChatLanguage): string {
  return language === "ar"
    ? "لا يمكنني مشاركة التعليمات الداخلية أو مفاتيح النظام. يسعدني مساعدتك في خدمات Lunayair Marina."
    : "I can't share internal instructions or system keys. I'm happy to help with Lunayair Marina services.";
}

export function stripInventedPricingSentences(reply: string, language: ChatLanguage): string {
  const sentences = reply.split(/(?<=[.!?؟])\s+/);
  const kept = sentences.filter(
    (sentence) => !detectGroundingViolations(sentence).some((v) => v.code === "invented_price"),
  );
  if (kept.length === 0) return safePricingFallback(language);
  return kept.join(" ").trim();
}

export function isPublishedServiceTerm(term: string): boolean {
  const normalized = term.toLowerCase();
  return PUBLISHED_SERVICE_TERMS.some((published) => published.includes(normalized) || normalized.includes(published));
}

export const publishedLimitationsNote = limitations.priceNotPublished;
