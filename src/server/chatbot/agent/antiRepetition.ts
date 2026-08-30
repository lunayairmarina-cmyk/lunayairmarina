import type { CustomerContext } from "@/lib/agent/context";
import type { ChatLanguage } from "@/lib/chatbot/types";
import { buildDisclosureFacts } from "./progressiveDisclosure";

export function recordDisclosedLevel(
  context: CustomerContext,
  topicKey: string,
  level: number,
  language: ChatLanguage,
): CustomerContext {
  if (level <= 0 || topicKey === "general") return context;
  const disclosedByTopic = { ...(context.disclosedSnippetsByTopic ?? {}) };
  const existing = new Set(disclosedByTopic[topicKey] ?? []);
  for (let i = 1; i <= level; i += 1) {
    const facts = buildDisclosureFacts(topicKey, i, language);
    if (facts) existing.add(`L${i}:${facts.slice(0, 120)}`);
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

  const prior = context.disclosedSnippetsByTopic?.[topicKey] ?? [];
  if (prior.length) {
    lines.push("previouslyDisclosed (do NOT repeat verbatim):");
    prior.forEach((item) => lines.push(`- ${item.slice(0, 140)}`));
  }

  if (currentLevel > 1 && topicKey !== "general") {
    const forbidden: string[] = [];
    for (let i = 1; i < currentLevel; i += 1) {
      const facts = buildDisclosureFacts(topicKey, i, language);
      if (facts) forbidden.push(`L${i}: ${facts.slice(0, 100)}`);
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

export function blockWhatsAppForTurns(context: CustomerContext, turns = 2): CustomerContext {
  return { ...context, whatsappBlockedTurns: turns, requestedContactMethod: "email" };
}
