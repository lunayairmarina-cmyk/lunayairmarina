import agentRules from "@/data/chatbot/agent-rules.json";
import type { ChatbotLanguage } from "@/data/chatbot/loadKnowledge";
import { getStaticKnowledgeBundle } from "@/data/chatbot/loadKnowledge";
import type { ExtractedEntitySet } from "./extractEntities";
import type { ResponseStrategy } from "./responseStrategy";
import { frustrationOpener } from "./frustration";
import { repeatPrefix } from "./repeatedQuestion";

function locationHint(entities: ExtractedEntitySet, language: ChatbotLanguage): string {
  if (entities.locationCanonical.includes("JEDDAH")) return language === "ar" ? "جدة" : "Jeddah";
  if (entities.locationCanonical.length) return entities.locationCanonical[0]!;
  return language === "ar" ? "منطقتك" : "your area";
}

function applyPlaceholders(text: string, extra: Record<string, string>): string {
  const bundle = getStaticKnowledgeBundle();
  const merged = { ...bundle.knowledge.placeholders, ...extra };
  return text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => merged[key as keyof typeof merged] ?? "");
}

export function composeReplyEnhancement(input: {
  baseReply: string;
  strategy: ResponseStrategy;
  language: ChatbotLanguage;
  entities: ExtractedEntitySet;
  intentId: string;
  repeatCount: number;
}): string {
  const { baseReply, strategy, language, entities, intentId, repeatCount } = input;

  if (strategy === "FRUSTRATION_REPAIR") {
    const opener = frustrationOpener(language);
    return opener ? `${opener}\n\n${baseReply}` : baseReply;
  }

  if (strategy === "REPEAT_CONDENSED") {
    const prefix = repeatPrefix(language, repeatCount);
    if (prefix) return `${prefix} ${baseReply}`;
  }

  if (strategy === "SALES_JOURNEY" && intentId.startsWith("YACHT")) {
    const journey = agentRules.salesJourney as Record<
      string,
      { ar: { ack: string; cta: string }; en: { ack: string; cta: string } }
    >;
    const pack = journey.YACHT_MANAGEMENT?.[language];
    if (pack) {
      const hint = locationHint(entities, language);
      const cta = applyPlaceholders(pack.cta.replace("{{locationHint}}", hint), { locationHint: hint });
      return `${pack.ack}\n\n${cta}`;
    }
  }

  if (strategy === "PROGRESSIVE_DISCOVERY") {
    return baseReply;
  }

  return baseReply;
}

export function smartQuestionForIntent(intentId: string, language: ChatbotLanguage): string | null {
  const qs = agentRules.smartQuestions as Record<string, { ar: string; en: string }>;
  const q = qs[intentId];
  if (!q) return null;
  return q[language] ?? q.en ?? null;
}
