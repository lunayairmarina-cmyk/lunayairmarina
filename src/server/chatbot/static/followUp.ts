import type { StaticKnowledgeBundle } from "@/data/chatbot/loadKnowledge";
import { getStaticKnowledgeBundle } from "@/data/chatbot/loadKnowledge";
import type { ConversationContextStack } from "./contextStack";
import { normalizeMessage, tokenize } from "./normalize";

const FILLER_ONLY = new Set(["طيب", "ok", "okay", "ممكن", "تمام"]);

export function isFollowUpToken(message: string, bundle = getStaticKnowledgeBundle()): boolean {
  const n = normalizeMessage(message);
  const tokens = tokenize(n);
  if (tokens.length > 4) return false;

  const rules = bundle.conceptRules?.followUpTokens;
  if (!rules) return false;

  const all = [...rules.ar, ...rules.en].map((t) => normalizeMessage(t));
  if (tokens.length === 1 && all.includes(tokens[0]!)) return true;
  return all.some((phrase) => {
    if (phrase.includes(" ")) {
      return n === phrase || n.endsWith(phrase) || n.includes(phrase);
    }
    return tokens.includes(phrase);
  });
}

export function resolveFollowUpIntent(
  message: string,
  stack: ConversationContextStack,
  bundle = getStaticKnowledgeBundle(),
): string | null {
  if (!isFollowUpToken(message, bundle)) return null;
  const n = normalizeMessage(message);
  const tokens = tokenize(n);
  const last = stack.lastIntent;
  const recent = stack.recentIntents ?? [];
  if (!last && recent.length === 0) return null;

  const hasPrefix = (prefix: string) =>
    recent.some((i) => i.startsWith(prefix)) || (last?.startsWith(prefix) ?? false);

  if (tokens.length === 1 && FILLER_ONLY.has(tokens[0]!)) {
    return "CLARIFY";
  }
  if (tokens.length > 1 && tokens.every((t) => FILLER_ONLY.has(t))) {
    return "CLARIFY";
  }

  if (n.includes("سعر") || n.includes("بكم") || n.includes("بكام") || n.includes("كم") || n.includes("price")) {
    if (hasPrefix("YACHT")) return "YACHT_MANAGEMENT_PRICING";
    if (hasPrefix("CREW")) return "CREW_PRICING";
    if (hasPrefix("VISITING")) return "VISITING_YACHT_AGENCY";
    if (hasPrefix("MARINA")) return "MARINA_MANAGEMENT";
    return "PRICING";
  }
  if (n.includes("رقم") || n.includes("phone")) return "PHONE";
  if (n.includes("واتس") || n.includes("whatsapp")) return "WHATSAPP";
  if (n.includes("عنوان") || n.includes("address")) return "ADDRESS";
  if (n.includes("موقع") || n.includes("مكان") || n.includes("location")) return "LOCATION";
  if (n.includes("وين") || n.includes("فين")) return hasPrefix("MARINA") ? "LOCATION" : "ADDRESS";
  if (n.includes("وش") || n.includes("تشمل") || n.includes("details") || n.includes("more")) {
    if (n.includes("360")) return "YACHT_MANAGEMENT_360";
    if (n.includes("اداره") || n.includes("الإدارة")) {
      return hasPrefix("YACHT") ? "YACHT_MANAGEMENT" : (last ?? null);
    }
    if (hasPrefix("YACHT")) return "YACHT_MANAGEMENT_360";
    return last ?? null;
  }
  if (n.includes("كيف") || n.includes("how")) {
    if (/كيف\s+حال/.test(n) || n.includes("how are you")) return "HOW_ARE_YOU";
    if (n.includes("اتواصل") || n.includes("تواصل") || n.includes("contact") || n.includes("reach")) {
      return "CONTACT";
    }
    if (hasPrefix("YACHT")) return "YACHT_MANAGEMENT";
    return "CONTACT";
  }

  return last ?? null;
}
