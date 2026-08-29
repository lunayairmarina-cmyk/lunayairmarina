import type { AiMessageRecord } from "@/lib/agent/types";

export interface ConversationContextStack {
  lastIntent?: string;
  recentIntents: string[];
  lastTopic?: string;
}

const TOPIC_PREFIXES: Record<string, string> = {
  YACHT: "yacht",
  VISITING: "visiting",
  MARINA: "marina",
  CREW: "crew",
  PHONE: "contact",
  WHATSAPP: "contact",
  EMAIL: "contact",
  ADDRESS: "contact",
  CONTACT: "contact",
  GREETING: "general",
  HOW_ARE_YOU: "general",
};

export function intentToTopic(intent: string): string | undefined {
  for (const [prefix, topic] of Object.entries(TOPIC_PREFIXES)) {
    if (intent === prefix || intent.startsWith(`${prefix}_`)) return topic;
  }
  if (intent.includes("YACHT")) return "yacht";
  if (intent.includes("CREW")) return "crew";
  if (intent.includes("MARINA")) return "marina";
  if (intent.includes("VISITING")) return "visiting";
  if (intent.includes("CONTACT") || intent === "PHONE" || intent === "WHATSAPP" || intent === "EMAIL" || intent === "ADDRESS")
    return "contact";
  return undefined;
}

/** Build recent intent stack from persisted user turns (newest last). */
export function extractRecentIntents(
  messages: AiMessageRecord[],
  lastIntent?: string,
  maxDepth = 5,
): string[] {
  const fromMessages = messages
    .filter((m) => m.role === "user" && m.intent && m.intent !== "CLARIFY" && m.intent !== "UNKNOWN")
    .map((m) => m.intent!)
    .slice(-maxDepth);

  if (fromMessages.length > 0) return fromMessages;

  return lastIntent ? [lastIntent] : [];
}

export function buildContextStack(input: {
  messages?: AiMessageRecord[];
  lastIntent?: string;
  maxDepth?: number;
}): ConversationContextStack {
  const recentIntents = extractRecentIntents(
    input.messages ?? [],
    input.lastIntent,
    input.maxDepth ?? 5,
  );
  const lastIntent = recentIntents[recentIntents.length - 1] ?? input.lastIntent;
  const lastTopic = lastIntent ? intentToTopic(lastIntent) : undefined;

  return { lastIntent, recentIntents, lastTopic };
}

/** True if any recent intent matches prefix or exact id. */
export function stackMatches(
  stack: ConversationContextStack,
  opts: { prefix?: string; intent?: string; topic?: string },
): boolean {
  if (opts.intent && stack.recentIntents.includes(opts.intent)) return true;
  if (opts.prefix) {
    return stack.recentIntents.some((i) => i.startsWith(opts.prefix!));
  }
  if (opts.topic && stack.lastTopic === opts.topic) return true;
  return false;
}
