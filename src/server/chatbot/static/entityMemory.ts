import type { ConversationContextStack } from "./contextStack";
import { intentToTopic } from "./contextStack";
import type { ExtractedEntitySet } from "./extractEntities";
import { detectEntities } from "./entities";
import type { MatchResult } from "./matcher";
import { normalizeMessage } from "./normalize";

export interface EntityMemory {
  concepts: string[];
  locations: string[];
  locationCanonical: string[];
  services: string[];
  hasYacht: boolean;
  hasOwnership: boolean;
  yachtType?: string;
  yachtLength?: { value: number; unit: string; raw: string };
  customerGoal?: string;
  urgency: "HIGH" | "MEDIUM" | "LOW";
  lastTopic?: string;
  pricingInterest: boolean;
  contactIntent: boolean;
  phone?: string;
  email?: string;
  name?: string;
}

export function buildEntityMemory(
  message: string,
  match: MatchResult,
  stack?: ConversationContextStack,
  extracted?: ExtractedEntitySet,
  priorMemory?: Partial<EntityMemory>,
): EntityMemory {
  const detected = detectEntities(message);
  const concepts = new Set(match.matchedConcepts);
  for (const c of match.signals?.concepts ?? []) concepts.add(c);

  const ex =
    extracted ??
    ({
      yacht: false,
      locations: [],
      locationCanonical: [],
      services: [],
      hasOwnership: false,
      pricingInterest: false,
      contactIntent: false,
      urgency: "LOW",
    } as ExtractedEntitySet);

  const mergedLocations = [
    ...new Set([...(priorMemory?.locations ?? []), ...detected.locations, ...ex.locations]),
  ];
  const mergedCanonicalLocations = [
    ...new Set([...(priorMemory?.locationCanonical ?? []), ...ex.locationCanonical]),
  ];
  const mergedServices = [
    ...new Set([...(priorMemory?.services ?? []), ...ex.services]),
  ];

  const memory: EntityMemory = {
    concepts: [...new Set([...(priorMemory?.concepts ?? []), ...concepts])],
    locations: mergedLocations,
    locationCanonical: mergedCanonicalLocations,
    services: mergedServices,
    hasYacht: priorMemory?.hasYacht || concepts.has("yacht") || ex.yacht || detected.hasOwnershipSignal,
    hasOwnership: priorMemory?.hasOwnership || ex.hasOwnership || detected.hasOwnershipSignal,
    yachtType: ex.yachtType ?? priorMemory?.yachtType,
    yachtLength: ex.yachtLength ?? priorMemory?.yachtLength,
    customerGoal: ex.customerGoal ?? priorMemory?.customerGoal,
    urgency: ex.urgency === "HIGH" ? "HIGH" : (priorMemory?.urgency ?? "LOW"),
    lastTopic: stack?.lastTopic ?? priorMemory?.lastTopic,
    pricingInterest: ex.pricingInterest || Boolean(priorMemory?.pricingInterest),
    contactIntent: ex.contactIntent || Boolean(priorMemory?.contactIntent),
    phone: ex.phone ?? priorMemory?.phone,
    email: ex.email ?? priorMemory?.email,
    name: ex.name ?? priorMemory?.name,
  };

  if (stack?.recentIntents?.length) {
    for (const intent of stack.recentIntents) {
      const topic = intentToTopic(intent);
      if (topic === "yacht") memory.hasYacht = true;
      if (topic) memory.lastTopic = topic;
      if (intent.startsWith("YACHT")) concepts.add("yacht");
      if (intent.startsWith("CREW")) concepts.add("crew");
      if (intent.startsWith("MARINA")) concepts.add("marina");
      if (intent.startsWith("VISITING")) concepts.add("agency");
    }
    memory.concepts = [...new Set([...memory.concepts, ...concepts])];
  }

  const n = normalizeMessage(message);
  if (n.includes("جده") || n.includes("jeddah") || n.includes("جدة")) {
    if (!memory.locations.includes("jeddah")) memory.locations.push("jeddah");
    if (!memory.locationCanonical.includes("JEDDAH")) memory.locationCanonical.push("JEDDAH");
  }

  return memory;
}

export function memorySupportsIntent(memory: EntityMemory, intentPrefix: string): boolean {
  if (memory.lastTopic && intentPrefix.toLowerCase().includes(memory.lastTopic)) return true;
  return memory.concepts.some((c) => intentPrefix.toLowerCase().includes(c));
}

