import type { KnowledgeDocumentType } from "@/lib/agent/types";

export type AgentIntent =
  | "general_company"
  | "services"
  | "service_details"
  | "service_comparison"
  | "yacht_recommendation"
  | "contact"
  | "social_media"
  | "location"
  | "pricing"
  | "availability"
  | "blog"
  | "application"
  | "advertising"
  | "fleet"
  | "team"
  | "trust"
  | "testimonials"
  | "gallery"
  | "human_handoff"
  | "general_question"
  | "unknown";

export interface QueryAnalysis {
  original: string;
  normalized: string;
  tokens: string[];
  intent: AgentIntent;
  preferredTypes: KnowledgeDocumentType[];
  entities: string[];
}

const ARABIC_VARIANTS: Array<[RegExp, string]> = [
  [/إ|أ|آ/g, "ا"],
  [/ى/g, "ي"],
  [/ة/g, "ه"],
  [/ؤ/g, "و"],
  [/ئ/g, "ي"],
];

/** General normalization — not a giant synonym list. */
export function normalizeQueryText(query: string): string {
  let text = query.normalize("NFKC").trim();
  text = text.replace(/[\u064B-\u065F\u0670]/g, "");
  for (const [pattern, replacement] of ARABIC_VARIANTS) {
    text = text.replace(pattern, replacement);
  }
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s@./-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenizeNormalizedQuery(normalized: string): string[] {
  return normalized.split(/\s+/).filter((token) => token.length > 1 || /^\d+$/.test(token));
}

/** Lightweight entity hints detected in the query (non-sensitive). */
export function extractQueryEntities(normalized: string): string[] {
  const entities: string[] = [];
  const patterns: Array<[RegExp, string]> = [
    [/instagram|insta|انستجرام|انستا|انست/i, "instagram"],
    [/whatsapp|واتساب|واتس/i, "whatsapp"],
    [/linkedin|لينكد/i, "linkedin"],
    [/\btwitter\b|\bx\.com\b|تويتر/i, "x"],
    [/facebook|فيسبوك/i, "facebook"],
    [/youtube|يوتيوب/i, "youtube"],
    [/tiktok|تيك\s*توك/i, "tiktok"],
    [/yacht management|إدارة\s*اليخوت|إدارة\s*يخت|360/i, "yacht-management-360"],
    [/crew management|إدارة\s*ال?طاق|طاقم/i, "crew-management"],
    [/visiting yacht|يخت\s*زائر|الوكاله?\s*لليخوت|agency/i, "visiting-yacht-agency"],
    [/marina management|إدارة\s*المار/i, "marina-management"],
    [/(\d+)\s*(?:ft|feet|foot|قدم|متر|m\b)/i, "yacht-size"],
    [/عائله|عيله|افراد|family|guests?|persons?|people/i, "family-guests"],
    [/جدة|jeddah/i, "jeddah"],
    [/red sea|البحر\s*الاحمر/i, "red-sea"],
    [/saudi|السعود/i, "saudi-arabia"],
  ];
  for (const [pattern, entity] of patterns) {
    if (pattern.test(normalized)) entities.push(entity);
  }
  return [...new Set(entities)];
}

const INTENT_RULES: Array<{
  intent: AgentIntent;
  pattern: RegExp;
  types: KnowledgeDocumentType[];
}> = [
  {
    intent: "social_media",
    pattern:
      /instagram|insta|انست|انستا|انستجرام|social|سوش|حسابكم|حسابات|linkedin|لينكد|facebook|فيسبوك|twitter|تويتر|youtube|يوتيوب|tiktok|تيك\s*توك/i,
    types: ["company", "contact", "homepage"],
  },
  {
    intent: "service_comparison",
    pattern: /فرق|اختلاف|مقارن|versus|vs\b|difference|compare|بين\s+.+\s+و|الفرق\s*بين/i,
    types: ["service", "faq", "why", "about"],
  },
  {
    intent: "yacht_recommendation",
    pattern:
      /مناسب|انسب|تنصح|توصي|suitable|recommend|ليختي|لليخت|يخت\s*\d+|محتاج\s*(اداره|تشغيل|صيان|طاقم)|عايز\s*(اداره|تشغيل|صيان|طاقم)|مش عايز\s*(ادير|ادخل)|كل حاجه|full management|يتولى|انسب\s*خدم|ايه الحل|الحل اللي|عائله|عيله|افراد|family|guests?|احسن\s*يخت|best\s*yacht|يشيل\s*عني|شيل\s*عني|تديرو|تديروا|اداره\s*كامله|إدارة\s*كاملة|تشغيل\s*(اليخت|الكله|كله)|take\s*care\s*of|handle\s*(everything|ops|operations)|run\s*(the\s*)?yacht|end[\s-]?to[\s-]?end|hands[\s-]?off|مشغول.*(يخت|اداره|تشغيل)|busy.*(yacht|manage|ops)/i,
    types: ["service", "fleet", "faq", "location", "why", "contact", "about"],
  },
  {
    intent: "contact",
    pattern:
      /contact|تواصل|اتصل|phone|هاتف|رقم\s*(الهاتف|الجوال|التواصل)|email|ايميل|بريد|whatsapp|واتس|واتساب|كيف\s*اتواصل|ازاي\s*(اتواصل|اوصل)|طرق\s*التواصل|reach\s*(you|us)/i,
    types: ["contact", "company", "faq", "location"],
  },
  {
    intent: "location",
    pattern:
      /location|موقعكم|موقعنا|مقر|address|عنوان|فين\s*(موقع|مكتب|المار)|اين\s*(موقع|مكتب)|بتشتغلو|تغط|regions?\s*you\s*cover|where\s*(are\s*you|is\s*your)/i,
    types: ["location", "company", "about", "contact"],
  },
  {
    intent: "pricing",
    pattern: /price|pricing|cost|سعر|تكلف|كم\s*سعر|بكام|تكلفه/i,
    types: ["service", "faq", "company", "contact"],
  },
  {
    intent: "availability",
    pattern:
      /availability|berth|مرسى|حجز|book(?:ing)?|بكره|غدا|tomorrow|available\s+(?:next|this|for)|متاح(?:ة)?\s*(?:للحجز|للرسو|الآن|الان|هذا|هالأسبوع)|هل\s*(?:في|فيه)\s*متاح/i,
    types: ["fleet", "faq", "contact", "service"],
  },
  {
    intent: "general_company",
    pattern:
      /who are you|about (the )?company|about lunay|احكيلي عن (ال)?شركه|احكي عن (ال)?شركه|عن الشركه|من انتم|مين انتم|company|شركه|lunayair|lunay|عنكم/i,
    types: ["about", "company", "homepage", "why"],
  },
  {
    intent: "advertising",
    pattern:
      /advert|advertis|اعلان|إعلان|اعلانات|إعلانات|شراك|شراكات|partners?(?:hip)?|branding partner|خدمات إعلانية|خدمات اعلانية|advertising services/i,
    types: ["advertisement"],
  },
  {
    intent: "team",
    pattern:
      /team|فريق|طاقم الشركه|طاقم الشركة|staff|موظفين|المسؤول|مسؤول عن|who (?:runs|manages|is on)|operations lead|مين\s*(?:الفريق|المسؤول)/i,
    types: ["team", "about"],
  },
  {
    intent: "testimonials",
    pattern:
      /testimonial|testimonials|آراء|اراء|تجارب|مراجعات|reviews?|client (?:feedback|stories)|آراء العملاء|تجارب العملاء|شهادات العملاء|رأي العملاء/i,
    types: ["testimonial"],
  },
  {
    intent: "trust",
    pattern: /trust|شهاده|شهادات|اعتماد|certif|accreditation|ضمانه|سمعه|reputation|موثوق/i,
    types: ["trust", "about", "why"],
  },
  {
    intent: "gallery",
    pattern: /gallery|معرض|صور المعرض|photo gallery|صور اليخوت/i,
    types: ["gallery"],
  },
  {
    intent: "fleet",
    pattern:
      /fleet|أسطول|اسطول|محفظه|محفظة|يختات|أنواع الأسطول|انواع الاسطول|أنواع اليخوت|انواع اليخوت|إيه اليخوت|ايه اليخوت|yachts under|portfolio yacht|motor yacht|explorer yacht|yachts (?:do you|under|or)/i,
    types: ["fleet", "service", "location"],
  },
  {
    intent: "service_details",
    pattern:
      /detail|تفاصيل|يشمل|تشمل|اشرح|شرح|explain|360|اداره\s*اليخوت|crew management|visiting/i,
    types: ["service", "faq", "why"],
  },
  {
    intent: "services",
    pattern: /service|خدم|services|خدمات|offer|provide|تقدم|بتقدم|ايه الخدمات|ما هي خدمات/i,
    types: ["service", "faq", "why", "homepage"],
  },
  {
    intent: "blog",
    pattern: /blog|article|مقال|مقالات|guide|دليل/i,
    types: ["blog"],
  },
  {
    intent: "application",
    pattern: /app|application|تطبيق|mobile/i,
    types: ["application"],
  },
  {
    intent: "human_handoff",
    pattern: /human|agent|موظف|مدير|call me|اتصل بي|speak to|كلمني|تواصلوا/i,
    types: ["contact", "company"],
  },
  {
    intent: "general_question",
    pattern: /هل\s|ما\s|ماذا|ليه|لماذا|how\s|what\s|why\s|can\s+you|هل\s*ممكن/i,
    types: ["company", "service", "faq", "about", "contact", "why"],
  },
];

export function detectQueryIntent(normalized: string): AgentIntent {
  for (const rule of INTENT_RULES) {
    if (rule.pattern.test(normalized)) return rule.intent;
  }
  return "unknown";
}

export function preferredTypesForIntent(intent: AgentIntent): KnowledgeDocumentType[] {
  const rule = INTENT_RULES.find((item) => item.intent === intent);
  if (rule) return rule.types;
  return ["company", "contact", "service", "faq", "about", "location"];
}

export function analyzeQuery(query: string): QueryAnalysis {
  const normalized = normalizeQueryText(query);
  let intent = detectQueryIntent(normalized);
  if (
    (intent === "unknown" || intent === "general_question") &&
    isConceptualYachtOpsNeed(normalized)
  ) {
    intent = "yacht_recommendation";
  }
  const baseTokens = tokenizeNormalizedQuery(normalized);
  return {
    original: query,
    normalized,
    tokens: expandQueryTokens(normalized, baseTokens),
    intent,
    preferredTypes: preferredTypesForIntent(intent),
    entities: extractQueryEntities(normalized),
  };
}

/** Cross-script / alias matching for retrieval scoring. */
export const ENTITY_SEARCH_TERMS: Record<string, string[]> = {
  instagram: ["instagram", "insta", "انستجرام", "انستا", "انست"],
  whatsapp: ["whatsapp", "واتساب", "واتس"],
  linkedin: ["linkedin", "لينكد"],
  x: ["twitter", "x.com", "تويتر"],
  facebook: ["facebook", "فيسبوك"],
  youtube: ["youtube", "يوتيوب"],
  tiktok: ["tiktok", "تيك توك"],
  "yacht-management-360": [
    "yacht-management",
    "yacht management",
    "360",
    "إدارة اليخوت",
    "تشغيل",
    "صيانة",
    "اداره كامله",
    "full management",
    "operations",
  ],
  "crew-management": ["crew", "طاقم", "إدارة الطاقم", "متابعة الطاقم", "توظيف"],
  "visiting-yacht-agency": ["visiting", "agency", "يخت زائر", "وكالة", "قادمه", "قادمة"],
  "marina-management": ["marina", "مارينا", "تشغيل المارينا"],
  jeddah: ["jeddah", "جدة"],
  "red-sea": ["red sea", "البحر الأحمر", "البحر الاحمر"],
  "saudi-arabia": ["saudi", "السعودية", "السعوديه"],
  "yacht-size": ["ft", "feet", "قدم"],
  "family-guests": ["family", "guest", "عائله", "عيله", "افراد", "guests"],
};

/**
 * Expand colloquial / synonym tokens for retrieval (primary + website passes).
 * Small curated set — not a giant thesaurus.
 */
export function expandQueryTokens(normalized: string, tokens: string[]): string[] {
  const extra: string[] = [];
  const rules: Array<[RegExp, string[]]> = [
    [/عائله|عيله|افراد|family|guests?|persons?/i, ["fleet", "yacht", "service", "عائله", "family"]],
    [/طاقم|crew|متابعة الطاقم/i, ["crew-management", "طاقم", "crew"]],
    [
      /صيان|maintenance|تشغيل|operations|يشيل عني|اداره كامله|إدارة كاملة|full management|hands.?off|end.?to.?end/i,
      ["yacht-management-360", "صيانة", "maintenance", "تشغيل", "إدارة"],
    ],
    [/جدة|jeddah/i, ["جدة", "jeddah", "location", "موقع"]],
    [/مارينا|marina/i, ["marina-management", "مارينا"]],
    [/زائر|visiting|agency|وكال|قادمه|قادمة/i, ["visiting-yacht-agency", "agency"]],
    [/سعر|price|بكام|cost/i, ["pricing", "سعر", "contact"]],
    [/تواصل|contact|واتس|phone/i, ["contact", "تواصل"]],
    [/إعلان|اعلان|شراك|advert|partner/i, ["advertising", "إعلان", "شراكة", "partner"]],
    [/أسطول|اسطول|fleet|محفظ/i, ["fleet", "أسطول", "yacht"]],
    [/رأي|آراء|تجرب|testimonial|review/i, ["testimonial", "رأي", "تجربة"]],
    [/معرض|gallery/i, ["gallery", "معرض", "caption"]],
    [/مشغول|busy owner|hands.?off|يتولى|تديرو/i, ["yacht-management-360", "why", "خدمة"]],
  ];
  for (const [pattern, terms] of rules) {
    if (pattern.test(normalized)) extra.push(...terms);
  }
  return [...new Set([...tokens, ...extra.map((t) => normalizeQueryText(t)).filter(Boolean)])];
}

/** True when the visitor describes full yacht ops / hands-off ownership needs. */
export function isConceptualYachtOpsNeed(normalized: string): boolean {
  return /يشيل\s*عني|شيل\s*عني|تشغيل\s*(اليخت|الكله|كله)|اداره\s*كامله|إدارة\s*كاملة|كل حاجه|full management|hands[\s-]?off|end[\s-]?to[\s-]?end|يتولى|تديرو|تديروا|مش عايز\s*(ادير|ادخل)|صيان.*طاقم|طاقم.*صيان|تشغيل.*صيان|صيان.*تشغيل|take\s*care\s*of\s*(the\s*)?yacht|run\s*(the\s*)?yacht|handle\s*(everything|ops|operations)/i.test(
    normalized,
  );
}

export function needsMultiDocumentReasoning(analysis: QueryAnalysis): boolean {
  const entityCount = analysis.entities.length;
  if (entityCount >= 2) return true;
  if (
    analysis.intent === "yacht_recommendation" ||
    analysis.intent === "service_comparison" ||
    analysis.intent === "fleet"
  ) {
    return true;
  }
  if (isConceptualYachtOpsNeed(analysis.normalized)) return true;
  return (
    analysis.entities.includes("yacht-size") ||
    analysis.entities.includes("family-guests") ||
    analysis.entities.includes("jeddah")
  );
}

export function queryMentionsEntity(normalized: string, entityKey: string): boolean {
  const terms = ENTITY_SEARCH_TERMS[entityKey] ?? [entityKey];
  return terms.some((term) => normalized.includes(normalizeQueryText(term)));
}
