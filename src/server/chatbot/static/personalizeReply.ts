import type { ChatbotLanguage } from "@/data/chatbot/loadKnowledge";

const NAME_INTENTS = new Set([
  "YACHT_MANAGEMENT",
  "YACHT_MANAGEMENT_360",
  "YACHT_MANAGEMENT_PRICING",
  "PRICING",
  "CREW_MANAGEMENT",
  "CREW_PRICING",
  "CONSULTATION",
  "CONTACT",
  "PHONE",
  "WHATSAPP",
  "SERVICES_LIST",
]);

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName.trim();
}

function replyAlreadyUsesName(reply: string, name: string): boolean {
  const n = name.trim();
  if (!n) return true;
  return reply.toLowerCase().includes(n.toLowerCase()) || reply.includes(firstName(n));
}

function shouldUseName(turnIndex: number, intentId: string, sessionId: string): boolean {
  if (turnIndex === 0) return true;
  if (NAME_INTENTS.has(intentId)) return true;
  if (turnIndex > 0 && turnIndex % 4 === 0) return true;
  const hash = sessionId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return hash % 5 === turnIndex % 5 && turnIndex % 3 === 0;
}

export function applyVisitorName(input: {
  reply: string;
  visitorName?: string;
  language: ChatbotLanguage;
  turnIndex: number;
  intentId: string;
  sessionId: string;
}): string {
  const { reply, visitorName, language, turnIndex, intentId, sessionId } = input;
  const name = visitorName?.trim();
  if (!name || replyAlreadyUsesName(reply, name)) return reply;
  if (!shouldUseName(turnIndex, intentId, sessionId)) return reply;

  const short = firstName(name);
  if (language === "ar") {
    if (turnIndex === 0) return `أهلًا ${short} 👋\n${reply}`;
    return `${short}، ${reply}`;
  }
  if (turnIndex === 0) return `Hi ${short} 👋\n${reply}`;
  return `${short}, ${reply}`;
}
