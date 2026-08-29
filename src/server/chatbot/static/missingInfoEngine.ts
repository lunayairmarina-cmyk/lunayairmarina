import type { EntityMemory } from "./entityMemory";

export type RequiredField =
  | "location"
  | "yacht_length"
  | "yacht_type"
  | "customer_goal"
  | "service_scope"
  | "urgency"
  | "contact_info";

export interface IntentRequirement {
  intent: string;
  requiredFields: RequiredField[];
}

const REQUIREMENT_MATRIX: Record<string, RequiredField[]> = {
  YACHT_MANAGEMENT: ["location", "yacht_length", "customer_goal", "contact_info"],
  YACHT_MANAGEMENT_360: ["location", "yacht_length", "contact_info"],
  CREW_MANAGEMENT: ["location", "service_scope", "contact_info"],
  MARINA_MANAGEMENT: ["location", "yacht_length", "contact_info"],
  VISITING_YACHT_AGENCY: ["location", "yacht_length", "urgency", "contact_info"],
  MAINTENANCE: ["location", "yacht_length", "service_scope", "contact_info"],
  INSURANCE: ["yacht_length", "location", "contact_info"],
};

const FIELD_QUESTIONS: Record<RequiredField, { ar: string; en: string }> = {
  location: {
    ar: "وين مكان اليخت حالياً؟ (مثلاً: جدة، البحر الأحمر، دبي...)",
    en: "Where is the yacht currently located? (e.g. Jeddah, Red Sea, Dubai...)",
  },
  yacht_length: {
    ar: "كم طول اليخت تقريباً؟ (بالأمتار أو الأقدام)",
    en: "What is the approximate length of the yacht? (in meters or feet)",
  },
  yacht_type: {
    ar: "وش نوع اليخت؟ (يخت محرك، شراعي، كتماران، سوبر يخت)",
    en: "What type of yacht is it? (motor yacht, sailing, catamaran, superyacht)",
  },
  customer_goal: {
    ar: "وش الهدف الرئيسي من الإدارة؟ (إدارة كاملة، تخفيض تكاليف، صيانة، طاقم...)",
    en: "What is your primary management goal? (turnkey management, OPEX optimization, crew...)",
  },
  service_scope: {
    ar: "وش النطاق المطلوب تحديداً؟",
    en: "What specific service scope do you require?",
  },
  urgency: {
    ar: "متى تخطط للبدء بهذه الخدمة؟",
    en: "When are you planning to begin this service?",
  },
  contact_info: {
    ar: "إذا حاب، تقدر تشاركنا رقم التواصل لمتابعة التفاصيل بشكل مخصص.",
    en: "If you like, feel free to share your contact number for a tailored follow-up.",
  },
};

export interface MissingInfoAnalysis {
  collected: RequiredField[];
  missing: RequiredField[];
  nextBestQuestion?: string;
  nextField?: RequiredField;
}

export function analyzeMissingInformation(
  intent: string,
  memory: EntityMemory,
  language: "ar" | "en",
): MissingInfoAnalysis {
  const required = REQUIREMENT_MATRIX[intent] ?? [];
  const collected: RequiredField[] = [];

  if (memory.locations.length > 0 || memory.locationCanonical.length > 0) {
    collected.push("location");
  }
  if (memory.yachtLength) {
    collected.push("yacht_length");
  }
  if (memory.yachtType) {
    collected.push("yacht_type");
  }
  if (memory.customerGoal) {
    collected.push("customer_goal");
  }
  if (memory.services.length > 1) {
    collected.push("service_scope");
  }
  if (memory.urgency === "HIGH") {
    collected.push("urgency");
  }
  if (memory.phone || memory.email || memory.contactIntent) {
    collected.push("contact_info");
  }

  const missing = required.filter((f) => !collected.includes(f));
  const nextField = missing[0];
  const nextBestQuestion = nextField ? FIELD_QUESTIONS[nextField]?.[language] : undefined;

  return {
    collected,
    missing,
    nextBestQuestion,
    nextField,
  };
}
