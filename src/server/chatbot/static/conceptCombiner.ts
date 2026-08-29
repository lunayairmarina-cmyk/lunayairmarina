import type { StaticKnowledgeBundle } from "@/data/chatbot/loadKnowledge";
import { getStaticKnowledgeBundle } from "@/data/chatbot/loadKnowledge";
import { normalizeMessage } from "./normalize";

export interface ConceptRule {
  id: string;
  when: string[];
  intent: string;
  priority: number;
  requiresContextPrefix?: string;
  requiresOwnership?: boolean;
  requiresKeyword?: string;
  skipWhen?: string[];
}

export function resolveConceptCombination(
  concepts: Set<string> | string[],
  opts?: {
    lastIntent?: string;
    recentIntents?: string[];
    hasOwnership?: boolean;
    normalizedMessage?: string;
    bundle?: StaticKnowledgeBundle;
  },
): string | null {
  const bundle = opts?.bundle ?? getStaticKnowledgeBundle();
  const rules = bundle.conceptRules?.rules;
  if (!rules?.length) return null;

  const conceptSet = concepts instanceof Set ? concepts : new Set(concepts);
  const normalized = opts?.normalizedMessage ?? "";
  const anchor = opts?.lastIntent ?? opts?.recentIntents?.[opts.recentIntents.length - 1];
  const hasPrefix = (prefix: string) =>
    Boolean(anchor?.startsWith(prefix)) ||
    Boolean(opts?.recentIntents?.some((i) => i.startsWith(prefix)));

  let best: { intent: string; priority: number } | null = null;

  for (const rule of rules) {
    const allPresent = rule.when.every((c) => conceptSet.has(c));
    if (!allPresent) continue;
    if (rule.requiresContextPrefix && !hasPrefix(rule.requiresContextPrefix)) continue;
    if (rule.requiresOwnership && !opts?.hasOwnership) continue;
    if (rule.requiresKeyword && !normalized.includes(normalizeMessage(rule.requiresKeyword))) continue;
    if (rule.skipWhen?.some((c) => conceptSet.has(c))) continue;
    if (rule.id === "visiting_agency" && (conceptSet.has("clearance") || conceptSet.has("provisioning") || conceptSet.has("permits"))) {
      continue;
    }
    if (
      rule.id === "location_only" &&
      (conceptSet.has("yacht") || conceptSet.has("management") || conceptSet.has("crew") || conceptSet.has("marina"))
    ) {
      continue;
    }
    if (!best || rule.priority > best.priority) {
      best = { intent: rule.intent, priority: rule.priority };
    }
  }

  return best?.intent ?? null;
}
