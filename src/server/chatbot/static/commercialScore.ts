import agentRules from "@/data/chatbot/agent-rules.json";
import { normalizeMessage } from "./normalize";

const rules = agentRules.commercialSignals as {
  strong: Array<{ pattern: string; score: number }>;
  medium: Array<{ pattern: string; score: number }>;
};

export type CommercialLevel = "NONE" | "LOW" | "MEDIUM" | "HIGH";

export function scoreCommercialIntent(message: string, intentId: string, priorScore = 0): number {
  const n = normalizeMessage(message);
  let score = priorScore * 0.85;

  for (const s of rules.strong) {
    if (n.includes(normalizeMessage(s.pattern))) score += s.score;
  }
  for (const m of rules.medium) {
    if (n.includes(normalizeMessage(m.pattern))) score += m.score;
  }

  const commercialIntents = [
    "YACHT_MANAGEMENT",
    "YACHT_MANAGEMENT_360",
    "YACHT_MANAGEMENT_PRICING",
    "CONSULTATION",
    "CONTACT",
    "PRICING",
  ];
  if (commercialIntents.includes(intentId)) score += 8;

  return Math.min(100, Math.round(score));
}

export function commercialLevel(score: number): CommercialLevel {
  if (score >= 55) return "HIGH";
  if (score >= 30) return "MEDIUM";
  if (score >= 12) return "LOW";
  return "NONE";
}

export function shouldAppendCommercialCta(score: number, turnIndex?: number): boolean {
  if (score < 30) return false;
  const t = turnIndex ?? 0;
  if (score >= 55) return t % 2 === 0;
  return t % 3 === 0;
}
