import agentRules from "@/data/chatbot/agent-rules.json";
import { normalizeMessage } from "./normalize";

const blocks = agentRules.falsePositiveBlocks as Array<{ pattern: string; reason: string }>;

export interface FalsePositiveResult {
  blocked: boolean;
  reason?: string;
}

export function checkFalsePositive(message: string): FalsePositiveResult {
  const n = normalizeMessage(message);
  for (const b of blocks) {
    if (n.includes(normalizeMessage(b.pattern))) {
      return { blocked: true, reason: b.reason };
    }
  }
  if (/طاق[مm]\s*كر[هe]/.test(n) || /football\s*crew/.test(n)) {
    return { blocked: true, reason: "football_crew" };
  }
  return { blocked: false };
}
