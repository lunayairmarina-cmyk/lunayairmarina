import agentRules from "@/data/chatbot/agent-rules.json";
import { normalizeMessage } from "./normalize";

const patterns = agentRules.frustrationPatterns as string[];

export function isFrustrated(message: string): boolean {
  const n = normalizeMessage(message);
  return patterns.some((p) => n.includes(normalizeMessage(p)));
}

export function frustrationOpener(language: "ar" | "en"): string {
  const openers = agentRules.frustrationOpeners as { ar: string[]; en: string[] };
  const list = openers[language] ?? openers.en ?? [];
  return list[0] ?? "";
}
