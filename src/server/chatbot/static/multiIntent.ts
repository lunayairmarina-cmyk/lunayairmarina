import type { MatchResult } from "./matcher";
import type { ExtractedEntitySet } from "./extractEntities";
import conceptGraph from "@/data/chatbot/concept-graph.json";

export interface MultiIntentAnalysis {
  primaryIntent: string;
  secondaryIntents: string[];
  detectedConcepts: string[];
  compoundSignals: string[];
}

const graph = conceptGraph as {
  compoundBoosts: Array<{
    when: string[];
    intent?: string;
    primary?: string;
    secondary?: string[];
    priority?: number;
  }>;
};

function conceptSetFromMatch(
  match: MatchResult,
  entities: ExtractedEntitySet,
  normalizedMessage: string,
): Set<string> {
  const set = new Set<string>();
  for (const c of match.matchedConcepts) set.add(c.toUpperCase());
  for (const c of match.signals?.concepts ?? []) set.add(c.toUpperCase());
  if (entities.yacht) set.add("YACHT");
  if (entities.services.includes("management")) set.add("MANAGEMENT");
  if (entities.services.includes("crew")) set.add("CREW");
  if (entities.services.includes("marina")) set.add("MARINA");
  if (entities.pricingInterest) set.add("PRICE");
  if (entities.locationCanonical.length) set.add("LOCATION");
  if (normalizedMessage.includes("360")) set.add("360");
  return set;
}

export function analyzeMultiIntent(
  match: MatchResult,
  entities: ExtractedEntitySet,
  resolvedIntent: string,
  normalizedMessage: string,
): MultiIntentAnalysis {
  const concepts = conceptSetFromMatch(match, entities, normalizedMessage);
  const detectedConcepts = [...concepts];
  const compoundSignals: string[] = [];
  let primaryIntent = resolvedIntent;
  const secondaryIntents: string[] = [];

  if (normalizedMessage.includes("360") || concepts.has("360")) {
    compoundSignals.push("360");
  }
  if (entities.yachtLength) compoundSignals.push(`YACHT_LENGTH=${entities.yachtLength.value}${entities.yachtLength.unit}`);
  for (const loc of entities.locationCanonical) compoundSignals.push(loc);

  for (const rule of graph.compoundBoosts) {
    const all = rule.when.every((w) => concepts.has(w));
    if (!all) continue;
    if (rule.intent && rule.priority) {
      if (rule.intent !== primaryIntent && !secondaryIntents.includes(rule.intent)) {
        if (primaryIntent === "PRICING" || primaryIntent === "YACHT_MANAGEMENT") {
          primaryIntent = rule.intent;
        }
      }
    }
    if (rule.primary) {
      if (resolvedIntent === rule.primary || concepts.has("PRICE")) {
        primaryIntent = rule.intent ?? rule.primary;
        for (const sec of rule.secondary ?? []) {
          if (!secondaryIntents.includes(sec)) secondaryIntents.push(sec);
        }
      }
    }
  }

  if (entities.pricingInterest && primaryIntent === "CREW_MANAGEMENT") {
    primaryIntent = "CREW_PRICING";
  }

  if (concepts.has("PRICE") && concepts.has("YACHT") && concepts.has("MANAGEMENT")) {
    primaryIntent = "YACHT_MANAGEMENT_PRICING";
  } else if (entities.pricingInterest && concepts.has("YACHT") && concepts.has("MANAGEMENT")) {
    primaryIntent = "YACHT_MANAGEMENT_PRICING";
  } else if (normalizedMessage.includes("360") && concepts.has("YACHT") && concepts.has("MANAGEMENT")) {
    primaryIntent = "YACHT_MANAGEMENT_360";
  }

  if (entities.services.includes("crew") && primaryIntent.startsWith("YACHT") && !secondaryIntents.includes("CREW_MANAGEMENT")) {
    secondaryIntents.push("CREW_MANAGEMENT");
  }

  return { primaryIntent, secondaryIntents, detectedConcepts, compoundSignals };
}
