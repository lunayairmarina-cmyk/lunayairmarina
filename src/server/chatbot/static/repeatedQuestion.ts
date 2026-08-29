import agentRules from "@/data/chatbot/agent-rules.json";
import type { ChatbotLanguage } from "@/data/chatbot/loadKnowledge";

export function getIntentRepeatCount(intentId: string, counts: Record<string, number>): number {
  return counts[intentId] ?? 0;
}

export function repeatPrefix(language: ChatbotLanguage, repeatCount: number): string | null {
  if (repeatCount < 2) return null;
  const prefixes = agentRules.repeatPrefixes as { ar: string[]; en: string[] };
  const list = prefixes[language] ?? prefixes.en ?? [];
  const idx = Math.min(repeatCount - 2, list.length - 1);
  return list[idx] ?? list[0] ?? null;
}
