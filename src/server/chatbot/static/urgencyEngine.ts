import { normalizeMessage } from "./normalize";

const URGENCY_TRIGGERS = [
  "عاجل",
  "ضروري اليوم",
  "اليوم",
  "الآن",
  "الان",
  "بأسرع وقت",
  "مستعجل",
  "urgent",
  "asap",
  "today",
  "immediately",
  "هذا الأسبوع",
  "هذا الاسبوع",
  "right now",
];

export function detectUrgency(message: string): "HIGH" | "MEDIUM" | "LOW" {
  const norm = normalizeMessage(message);
  for (const trigger of URGENCY_TRIGGERS) {
    if (norm.includes(normalizeMessage(trigger))) {
      return "HIGH";
    }
  }
  return "LOW";
}

export function shouldDirectHandoffForUrgency(
  urgency: "HIGH" | "MEDIUM" | "LOW",
  commercialLevel: "HIGH" | "MEDIUM" | "LOW" | "NONE",
): boolean {
  return urgency === "HIGH" && (commercialLevel === "HIGH" || commercialLevel === "MEDIUM");
}
