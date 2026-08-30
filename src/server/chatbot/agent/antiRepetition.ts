import type { CustomerContext } from "@/lib/agent/context";
import type { ChatLanguage } from "@/lib/chatbot/types";

const LEVEL_LABELS = {
  en: ["overview themes", "includes/responsibilities", "pricing context", "consultation/handoff"],
  ar: ["نظرة عامة", "يشمل/مسؤوليات", "سياق التسعير", "استشارة/تسليم"],
} as const;

export function recordDisclosedFactIds(
  context: CustomerContext,
  topicKey: string,
  factIds: string[],
): CustomerContext {
  if (!factIds.length || topicKey === "general") return context;
  const disclosedFactIdsByTopic = { ...(context.disclosedFactIdsByTopic ?? {}) };
  const existing = new Set(disclosedFactIdsByTopic[topicKey] ?? []);
  for (const id of factIds) existing.add(id);
  disclosedFactIdsByTopic[topicKey] = [...existing].slice(-24);
  return { ...context, disclosedFactIdsByTopic };
}

export function recordDisclosedLevel(
  context: CustomerContext,
  topicKey: string,
  level: number,
  language: ChatLanguage,
): CustomerContext {
  if (level <= 0 || topicKey === "general") return context;
  const disclosedByTopic = { ...(context.disclosedSnippetsByTopic ?? {}) };
  const existing = new Set(disclosedByTopic[topicKey] ?? []);
  const labels = LEVEL_LABELS[language === "ar" ? "ar" : "en"];
  for (let i = 1; i <= level; i += 1) {
    existing.add(`L${i}:${labels[i - 1] ?? "detail"}`);
  }
  disclosedByTopic[topicKey] = [...existing].slice(-12);
  return { ...context, disclosedSnippetsByTopic: disclosedByTopic };
}

export function buildAntiRepetitionBlock(
  context: CustomerContext,
  topicKey: string,
  currentLevel: number,
  language: ChatLanguage,
): string {
  const lines: string[] = [];
  const asked = context.askedMissingFields ?? [];
  if (asked.length) {
    lines.push(`alreadyAskedFields=${asked.join(",")} (do NOT re-ask)`);
  }
  if (context.yachtLength) lines.push(`knownYachtLength=${context.yachtLength}`);
  if (context.location) lines.push(`knownLocation=${context.location}`);
  if (context.customerGoal) lines.push(`knownGoal=${context.customerGoal}`);
  if (context.yachtType) lines.push(`knownYachtType=${context.yachtType}`);

  const priorFactIds = context.disclosedFactIdsByTopic?.[topicKey] ?? [];
  if (priorFactIds.length) {
    lines.push(`previouslyDisclosedFactIds=${priorFactIds.join(",")} (avoid repeating these facts)`);
  }

  const prior = context.disclosedSnippetsByTopic?.[topicKey] ?? [];
  if (prior.length && !priorFactIds.length) {
    lines.push("previouslyDisclosedLevels:");
    prior.forEach((item) => lines.push(`- ${item.slice(0, 80)}`));
  }

  if (currentLevel > 1 && topicKey !== "general") {
    const labels = LEVEL_LABELS[language === "ar" ? "ar" : "en"];
    const forbidden: string[] = [];
    for (let i = 1; i < currentLevel; i += 1) {
      forbidden.push(`L${i}: ${labels[i - 1] ?? "detail"} (already covered — advance with new detail)`);
    }
    if (forbidden.length) {
      lines.push("forbiddenRepeatLevels:");
      forbidden.forEach((item) => lines.push(`- ${item}`));
    }
  }

  if ((context.whatsappBlockedTurns ?? 0) > 0) {
    lines.push("whatsappBlocked=true (do NOT include WhatsApp link this turn)");
  }
  if (context.lastCtaType) lines.push(`lastCta=${context.lastCtaType} (vary approach)`);
  if (context.lastCasualReply?.trim()) {
    lines.push(
      `lastCasualGreetingReply="${context.lastCasualReply.replace(/"/g, "'").slice(0, 160)}" (vary wording naturally — do NOT repeat verbatim)`,
    );
  }

  if (!lines.length) return "";
  return `ANTI-REPETITION (internal):\n${lines.join("\n")}`;
}

export function noteAssistantQuestion(context: CustomerContext, reply: string): CustomerContext {
  const questions = [...(context.askedQuestions ?? [])];
  if (/[?؟]/.test(reply)) {
    const snippet = reply.replace(/\s+/g, " ").trim().slice(0, 120);
    questions.push(snippet);
  }
  return { ...context, askedQuestions: questions.slice(-8) };
}

export function decrementWhatsAppBlock(context: CustomerContext): CustomerContext {
  const left = context.whatsappBlockedTurns ?? 0;
  if (left <= 0) return context;
  return { ...context, whatsappBlockedTurns: left - 1 };
}

export function recordCasualReply(context: CustomerContext, reply: string): CustomerContext {
  const snippet = reply.replace(/\s+/g, " ").trim().slice(0, 200);
  if (!snippet) return context;
  return { ...context, lastCasualReply: snippet };
}

export function blockWhatsAppForTurns(context: CustomerContext, turns = 2): CustomerContext {
  return { ...context, whatsappBlockedTurns: turns, requestedContactMethod: "email" };
}
