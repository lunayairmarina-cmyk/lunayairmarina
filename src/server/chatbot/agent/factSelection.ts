import type { ChatLanguage } from "@/lib/chatbot/types";
import servicesFile from "@/data/chatbot/services.json";
import contact from "@/data/chatbot/contact.json";
import limitations from "@/data/chatbot/limitations.json";

type Localized = { en: string; ar: string };

export type QuestionFocus =
  | "scope_overview"
  | "operational"
  | "pricing"
  | "comparison"
  | "owner_value"
  | "crew_detail"
  | "progressive_expand"
  | "general_service";

export type AllowedFactKind = "theme" | "fact" | "summary" | "pricing" | "consultation";

export interface AllowedFact {
  id: string;
  text: string;
  kind: AllowedFactKind;
}

export interface FactSelectionResult {
  allowedFacts: AllowedFact[];
  allowedFactIds: string[];
  hiddenFactIds: string[];
  angleHint: string;
  reason: string;
  serviceId?: string;
  secondaryServiceIds?: string[];
}

const YM360_ORDER = [
  "ym360_technical_maintenance",
  "ym360_refit",
  "ym360_crew_payroll",
  "ym360_insurance_compliance",
  "ym360_operational_opex",
  "ym360_dedicated_manager",
] as const;

const SERVICE_FACT_ORDER: Record<string, readonly string[]> = {
  "yacht-management-360": YM360_ORDER,
  "crew-management": [
    "cm_vetted_placement",
    "cm_contracts_payroll",
    "cm_training_certification",
    "cm_performance_followup",
  ],
  "marina-management": [
    "mm_berth_bookings",
    "mm_facility_operations",
    "mm_safety_security",
    "mm_member_events",
  ],
  "visiting-yacht-agency": [
    "vya_clearance",
    "vya_berth_pilotage",
    "vya_provisioning",
    "vya_concierge",
  ],
};

const FOCUS_FACT_GROUPS: Record<string, Partial<Record<QuestionFocus, readonly string[]>>> = {
  "yacht-management-360": {
    operational: ["ym360_operational_opex", "ym360_technical_maintenance", "ym360_dedicated_manager"],
    owner_value: ["ym360_dedicated_manager", "ym360_operational_opex", "ym360_insurance_compliance"],
    crew_detail: ["ym360_crew_payroll"],
    scope_overview: [],
  },
};

const L1_THEMES: Record<ChatLanguage, Array<{ id: string; text: string }>> = {
  ar: [
    { id: "theme_operational", text: "إدارة تشغيلية شاملة" },
    { id: "theme_technical", text: "إشراف فني وصيانة مخططة" },
    { id: "theme_financial", text: "متابعة مالية وتقارير تكاليف" },
    { id: "theme_compliance", text: "امتثال بحري وتنسيق الطاقم" },
  ],
  en: [
    { id: "theme_operational", text: "Integrated operational oversight" },
    { id: "theme_technical", text: "Technical supervision and planned maintenance" },
    { id: "theme_financial", text: "Financial oversight and OPEX reporting" },
    { id: "theme_compliance", text: "Maritime compliance and crew coordination" },
  ],
};

function loc(value: Localized, language: ChatLanguage): string {
  return language === "ar" ? value.ar : value.en;
}

function findService(serviceId: string) {
  return servicesFile.services.find((s) => s.id === serviceId);
}

function buildFactTextMap(serviceId: string, language: ChatLanguage): Map<string, string> {
  const service = findService(serviceId);
  const map = new Map<string, string>();
  if (!service) return map;
  const order = SERVICE_FACT_ORDER[serviceId];
  const lang = language === "ar" ? "ar" : "en";
  if (order) {
    order.forEach((id, index) => {
      const text = service.includes[lang][index];
      if (text) map.set(id, text);
    });
  }
  return map;
}

function allFactIdsForService(serviceId: string): string[] {
  return [...(SERVICE_FACT_ORDER[serviceId] ?? [])];
}

function normalize(text: string): string {
  return text.normalize("NFKC").toLowerCase();
}

/** Deterministic question focus — takes precedence over stale disclosure level for content plane. */
export function resolveQuestionFocus(message: string, intent?: string): QuestionFocus {
  const text = normalize(message);

  if (/ناحية التشغيل|من ناحية التشغيل|تشغيلي|day-to-day|operational|daily operations/.test(text)) {
    return "operational";
  }
  if (/بكم|السعر|التكلفة|price|how much|cost\b|pricing/.test(text)) return "pricing";
  if (/الفرق|مقارنة|compare|\bvs\b|versus|difference between/.test(text)) return "comparison";
  if (/كيف تساعدون|كيف تفيدون|help yacht owners|help owners|owner benefits/.test(text)) {
    return "owner_value";
  }
  if (/طاقم|crew\b|crew management/.test(text) && !/إدارة اليخت|yacht management 360|yacht-management/.test(text)) {
    return "crew_detail";
  }
  if (/وش بعد|وايش بعد|تفاصيل أكثر|تفاصيل اكتر|show more|more details|what else|tell me more|وبعدين/.test(text)) {
    return "progressive_expand";
  }
  if (/وش تشمل|وش تتضمن|ماذا تشمل|what includes|what does .* include|includes\b|scope of|نطاق/.test(text)) {
    return "scope_overview";
  }
  if (intent === "SERVICES" || /خدمات|what services|what do you offer/.test(text)) return "general_service";
  return "general_service";
}

function pickUndisclosed(
  orderedIds: readonly string[],
  disclosed: Set<string>,
  limit: number,
  prefer?: readonly string[],
): string[] {
  const picked: string[] = [];
  if (prefer?.length) {
    for (const id of prefer) {
      if (picked.length >= limit) break;
      if (!disclosed.has(id) && orderedIds.includes(id)) picked.push(id);
    }
  }
  for (const id of orderedIds) {
    if (picked.length >= limit) break;
    if (!disclosed.has(id) && !picked.includes(id)) picked.push(id);
  }
  return picked.slice(0, limit);
}

function factEntries(ids: string[], textMap: Map<string, string>): AllowedFact[] {
  return ids
    .filter((id) => textMap.has(id))
    .map((id) => ({ id, text: textMap.get(id)!, kind: "fact" as const }));
}

function levelBudget(level: number, focus: QuestionFocus): number {
  if (level <= 1) return focus === "scope_overview" ? 4 : 3;
  if (level === 2) return 3;
  if (level === 3) return 3;
  return 2;
}

export interface SelectAllowedFactsInput {
  serviceId: string;
  disclosureLevel: number;
  questionFocus: QuestionFocus;
  intent: string;
  disclosedFactIds: string[];
  language: ChatLanguage;
  message: string;
  secondaryServiceIds?: string[];
}

export function selectAllowedFacts(input: SelectAllowedFactsInput): FactSelectionResult {
  const {
    serviceId,
    disclosureLevel,
    questionFocus,
    intent,
    disclosedFactIds,
    language,
    secondaryServiceIds = [],
  } = input;

  const level = Math.max(0, Math.min(4, disclosureLevel));
  const disclosed = new Set(disclosedFactIds);
  const service = findService(serviceId);
  const textMap = buildFactTextMap(serviceId, language);
  const allIds = allFactIdsForService(serviceId);
  const budget = levelBudget(level, questionFocus);
  const focusGroup = FOCUS_FACT_GROUPS[serviceId]?.[questionFocus];

  // Comparison — two service summaries only
  if (questionFocus === "comparison") {
    const services = [serviceId, ...secondaryServiceIds].filter(Boolean).slice(0, 2);
    const allowedFacts: AllowedFact[] = [];
    for (const sid of services) {
      const svc = findService(sid);
      if (!svc) continue;
      allowedFacts.push({
        id: `summary_${sid}`,
        text: loc(svc.summary, language),
        kind: "summary",
      });
    }
    return {
      allowedFacts,
      allowedFactIds: allowedFacts.map((f) => f.id),
      hiddenFactIds: allIds,
      angleHint: "Contrast the two services by purpose and scope in your own words.",
      reason: "comparison_focus",
      serviceId,
      secondaryServiceIds: services.slice(1),
    };
  }

  // Multi-service overview
  if (questionFocus === "general_service" && (intent === "SERVICES" || level <= 1)) {
    const allowedFacts: AllowedFact[] = servicesFile.services.map((svc) => ({
      id: `summary_${svc.id}`,
      text: `${loc(svc.title, language)}: ${loc(svc.summary, language)}`,
      kind: "summary",
    }));
    return {
      allowedFacts,
      allowedFactIds: allowedFacts.map((f) => f.id),
      hiddenFactIds: Object.values(SERVICE_FACT_ORDER).flat(),
      angleHint: "Give a concise overview of published services; do not list every bullet.",
      reason: "services_overview",
    };
  }

  // Crew detail on crew service
  if (questionFocus === "crew_detail" || serviceId === "crew-management") {
    const ids = pickUndisclosed(SERVICE_FACT_ORDER["crew-management"] ?? [], disclosed, budget);
    const allowedFacts = factEntries(ids, buildFactTextMap("crew-management", language));
    if (service && allowedFacts.length === 0) {
      allowedFacts.push({ id: `summary_${serviceId}`, text: loc(service.summary, language), kind: "summary" });
    }
    return {
      allowedFacts,
      allowedFactIds: allowedFacts.map((f) => f.id),
      hiddenFactIds: (SERVICE_FACT_ORDER["crew-management"] ?? []).filter((id) => !ids.includes(id)),
      angleHint: "Explain crew services naturally using only allowed facts.",
      reason: "crew_detail",
      serviceId: "crew-management",
    };
  }

  // Pricing focus — overrides stale L3 pricing plane
  if (questionFocus === "pricing" || intent.includes("PRICING")) {
    const allowedFacts: AllowedFact[] = [
      {
        id: "price_not_published",
        text: loc(limitations.priceNotPublished, language),
        kind: "pricing",
      },
    ];
    if (service) {
      allowedFacts.unshift({
        id: `pricing_model_${serviceId}`,
        text: loc(service.pricingLabel, language),
        kind: "pricing",
      });
    }
    return {
      allowedFacts,
      allowedFactIds: allowedFacts.map((f) => f.id),
      hiddenFactIds: allIds,
      angleHint: "Explain pricing context without inventing numbers.",
      reason: "pricing_focus",
      serviceId,
    };
  }

  // Operational focus — overrides accumulated level
  if (questionFocus === "operational") {
    const prefer = FOCUS_FACT_GROUPS[serviceId]?.operational ?? [];
    const ids = pickUndisclosed(allIds, disclosed, budget, prefer);
    const allowedFacts = factEntries(ids, textMap);
    return {
      allowedFacts,
      allowedFactIds: allowedFacts.map((f) => f.id),
      hiddenFactIds: allIds.filter((id) => !ids.includes(id)),
      angleHint: "Focus on operational/day-to-day aspects only.",
      reason: "operational_focus",
      serviceId,
    };
  }

  // Owner value angle
  if (questionFocus === "owner_value") {
    const prefer = FOCUS_FACT_GROUPS[serviceId]?.owner_value ?? [];
    const ids = pickUndisclosed(allIds, disclosed, budget, prefer);
    const themes = L1_THEMES[language].slice(0, 2);
    const allowedFacts: AllowedFact[] = [
      ...(service
        ? [{ id: `summary_${serviceId}`, text: loc(service.summary, language), kind: "summary" as const }]
        : []),
      ...themes.map((t) => ({ ...t, kind: "theme" as const })),
      ...factEntries(ids, textMap),
    ].slice(0, budget + 1);
    return {
      allowedFacts,
      allowedFactIds: allowedFacts.map((f) => f.id),
      hiddenFactIds: allIds.filter((id) => !ids.includes(id)),
      angleHint: "Explain owner benefits and peace of mind; not a full checklist.",
      reason: "owner_value",
      serviceId,
    };
  }

  // L4 consultation
  if (level >= 4) {
    const allowedFacts: AllowedFact[] = [
      {
        id: "price_not_published",
        text: loc(limitations.priceNotPublished, language),
        kind: "pricing",
      },
      {
        id: "consultation_paths",
        text:
          language === "ar"
            ? `للاستشارة: ${contact.urls.application} أو ${contact.email}`
            : `For consultation: ${contact.urls.application} or ${contact.email}`,
        kind: "consultation",
      },
    ];
    return {
      allowedFacts,
      allowedFactIds: allowedFacts.map((f) => f.id),
      hiddenFactIds: allIds,
      angleHint: "Offer consultation/handoff naturally without pressure.",
      reason: "L4_consultation",
      serviceId,
    };
  }

  // L1 scope overview — themes only, NO includes[] and NO dense summary sentence
  if (level <= 1 && questionFocus === "scope_overview") {
    const themes = L1_THEMES[language].slice(0, 4);
    const allowedFacts: AllowedFact[] = [
      ...(service
        ? [{ id: `title_${serviceId}`, text: loc(service.title, language), kind: "summary" as const }]
        : []),
      ...themes.map((t) => ({ ...t, kind: "theme" as const })),
    ];
    return {
      allowedFacts,
      allowedFactIds: allowedFacts.map((f) => f.id),
      hiddenFactIds: allIds,
      angleHint:
        language === "ar"
          ? "أجب بنظرة عامة طبيعية — لا تسرد قائمة كاملة بكل البنود."
          : "Answer with a natural overview — do not enumerate the full checklist.",
      reason: "L1_scope_overview",
      serviceId,
    };
  }

  // L2 / progressive_expand — next undisclosed facts
  if (level === 2 || questionFocus === "progressive_expand") {
    const ids = pickUndisclosed(allIds, disclosed, budget, focusGroup);
    const allowedFacts = factEntries(ids, textMap);
    if (allowedFacts.length === 0 && service) {
      allowedFacts.push({
        id: `summary_${serviceId}`,
        text: loc(service.summary, language),
        kind: "summary",
      });
    }
    return {
      allowedFacts,
      allowedFactIds: allowedFacts.map((f) => f.id),
      hiddenFactIds: allIds.filter((id) => !ids.includes(id)),
      angleHint: "Introduce only the new allowed facts; do not repeat prior themes.",
      reason: "L2_progressive",
      serviceId,
    };
  }

  // L3 — next facts OR pricing only if pricing intent (handled above)
  if (level === 3) {
    const ids = pickUndisclosed(allIds, disclosed, budget, focusGroup);
    const allowedFacts = factEntries(ids, textMap);
    return {
      allowedFacts,
      allowedFactIds: allowedFacts.map((f) => f.id),
      hiddenFactIds: allIds.filter((id) => !ids.includes(id)),
      angleHint: "Add deeper detail from allowed facts only.",
      reason: "L3_detail",
      serviceId,
    };
  }

  // Default L1 general
  const themes = L1_THEMES[language].slice(0, 3);
  const allowedFacts: AllowedFact[] = [
    ...(service
      ? [{ id: `summary_${serviceId}`, text: loc(service.summary, language), kind: "summary" as const }]
      : []),
    ...themes.map((t) => ({ ...t, kind: "theme" as const })),
  ];
  return {
    allowedFacts,
    allowedFactIds: allowedFacts.map((f) => f.id),
    hiddenFactIds: allIds,
    angleHint: "Keep the answer concise and conversational.",
    reason: "L1_default",
    serviceId,
  };
}

/** IDs exposed this turn that should be remembered (excludes hidden-only markers). */
export function factIdsToRecord(selection: FactSelectionResult): string[] {
  return selection.allowedFactIds.filter((id) => !id.startsWith("title_"));
}

export function getAllServiceFactTexts(serviceId: string, language: ChatLanguage): string[] {
  const map = buildFactTextMap(serviceId, language);
  return [...map.values()];
}

/** Published KB prose for facts that must not appear in Gemini payload this turn. */
export function getHiddenFactProse(
  selection: FactSelectionResult,
  language: ChatLanguage,
): string[] {
  const texts = new Set<string>();
  for (const id of selection.hiddenFactIds) {
    for (const sid of Object.keys(SERVICE_FACT_ORDER)) {
      const text = buildFactTextMap(sid, language).get(id);
      if (text && text.length >= 12) texts.add(text);
    }
  }
  return [...texts];
}
