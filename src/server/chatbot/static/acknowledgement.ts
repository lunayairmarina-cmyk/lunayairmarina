import agentRules from "@/data/chatbot/agent-rules.json";
import { normalizeMessage, tokenize } from "./normalize";

const ackTokens = new Set(
  [...(agentRules.acknowledgementTokens.ar as string[]), ...(agentRules.acknowledgementTokens.en as string[])].map(
    (t) => normalizeMessage(t),
  ),
);

export function isAcknowledgement(message: string): boolean {
  const tokens = tokenize(normalizeMessage(message));
  if (tokens.length === 0) return false;
  if (tokens.length <= 3 && tokens.every((t) => ackTokens.has(t))) return true;
  return tokens.length === 1 && ackTokens.has(tokens[0]!);
}

export function resolveAcknowledgement(lastIntent?: string): string | null {
  if (!lastIntent || lastIntent === "UNKNOWN" || lastIntent === "CLARIFY") return null;
  return lastIntent;
}
