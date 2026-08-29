import type { CustomerContext } from "@/lib/agent/context";
import type { SessionConversationState } from "./conversationState";
import type { ExtractedEntitySet } from "./extractEntities";
import { emptyExtractedEntities } from "./extractEntities";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function restoreEntities(raw: unknown): ExtractedEntitySet {
  const base = emptyExtractedEntities();
  if (!isRecord(raw)) return base;
  const lengthRaw = raw.yachtLength;
  const yachtLength =
    isRecord(lengthRaw) && typeof lengthRaw.value === "number"
      ? {
          entity: "YACHT_LENGTH" as const,
          value: lengthRaw.value,
          unit: lengthRaw.unit === "ft" ? ("ft" as const) : ("m" as const),
          raw: typeof lengthRaw.raw === "string" ? lengthRaw.raw : String(lengthRaw.value),
        }
      : undefined;
  return {
    ...base,
    yacht: Boolean(raw.yacht),
    yachtType: typeof raw.yachtType === "string" ? raw.yachtType : undefined,
    locations: Array.isArray(raw.locations) ? raw.locations.filter((x) => typeof x === "string") : [],
    locationCanonical: Array.isArray(raw.locationCanonical)
      ? raw.locationCanonical.filter((x) => typeof x === "string")
      : [],
    services: Array.isArray(raw.services) ? raw.services.filter((x) => typeof x === "string") : [],
    yachtLength,
    hasOwnership: Boolean(raw.hasOwnership),
    pricingInterest: Boolean(raw.pricingInterest),
    contactIntent: Boolean(raw.contactIntent),
    customerGoal: typeof raw.customerGoal === "string" ? raw.customerGoal : undefined,
    urgency: raw.urgency === "HIGH" || raw.urgency === "MEDIUM" ? raw.urgency : "LOW",
    objectionType: undefined,
    phone: typeof raw.phone === "string" ? raw.phone : undefined,
    email: typeof raw.email === "string" ? raw.email : undefined,
    name: typeof raw.name === "string" ? raw.name : undefined,
  };
}

export function sessionFromCustomerContext(
  context: CustomerContext,
): Partial<SessionConversationState> | undefined {
  const stored = context.assistantState;
  if (!isRecord(stored) && !context.conversationStage && !context.yachtLength) {
    return undefined;
  }
  const entities = restoreEntities(isRecord(stored) ? stored.entities : undefined);
  if (context.location && !entities.locationCanonical.length) {
    const loc = context.location.toLowerCase();
    if (loc.includes("jeddah") || loc.includes("جدة")) {
      entities.locationCanonical.push("JEDDAH");
      entities.locations.push("jeddah");
    }
  }
  if (context.yachtLength && !entities.yachtLength) {
    const m = context.yachtLength.match(/(\d+)/);
    if (m) {
      const unit = /ft|feet|قدم/i.test(context.yachtLength) ? "ft" : "m";
      entities.yachtLength = {
        entity: "YACHT_LENGTH",
        value: parseInt(m[1]!, 10),
        unit,
        raw: context.yachtLength,
      };
      entities.yacht = true;
    }
  }
  if (context.yachtType) entities.yachtType = context.yachtType;
  if (context.customerGoal) entities.customerGoal = context.customerGoal;
  if (context.urgency === "high") entities.urgency = "HIGH";
  if (context.name) entities.name = context.name;
  if (context.phone) entities.phone = context.phone;
  if (context.email) entities.email = context.email;

  const stage = context.conversationStage;
  return {
    lastIntent: Array.isArray(context.recentIntents)
      ? context.recentIntents[context.recentIntents.length - 1]
      : undefined,
    recentIntents: Array.isArray(context.recentIntents) ? context.recentIntents : [],
    lastTopic: context.lastTopic,
    stage: stage ?? "DISCOVERY",
    entities,
    commercialScore: typeof stored?.commercialScore === "number" ? stored.commercialScore : (context.leadScore ?? 0),
    intentRepeatCounts:
      isRecord(stored?.intentRepeatCounts) && stored.intentRepeatCounts
        ? (stored.intentRepeatCounts as Record<string, number>)
        : {},
    recentResponseIds: Array.isArray(stored?.recentResponseIds)
      ? stored.recentResponseIds.filter((x): x is string => typeof x === "string")
      : [],
    language: context.detectedLanguage,
    disclosureLevel: typeof context.disclosureLevel === "number" ? context.disclosureLevel : 1,
    askedMissingFields: Array.isArray(context.askedMissingFields)
      ? context.askedMissingFields.filter((x): x is string => typeof x === "string")
      : [],
  };
}

export function applySessionToCustomerContext(
  context: CustomerContext,
  session: SessionConversationState,
): CustomerContext {
  const length = session.entities.yachtLength;
  const locCanon = session.entities.locationCanonical[0];
  const location =
    locCanon === "JEDDAH"
      ? context.detectedLanguage === "en"
        ? "Jeddah"
        : "جدة"
      : locCanon
        ? locCanon
        : context.location;
  return {
    ...context,
    conversationStage: session.stage,
    lastTopic: session.lastTopic ?? context.lastTopic,
    recentIntents: session.recentIntents,
    disclosureLevel: session.disclosureLevel ?? 1,
    askedMissingFields: session.askedMissingFields ?? [],
    customerGoal: session.entities.customerGoal ?? context.customerGoal,
    yachtType: session.entities.yachtType ?? context.yachtType,
    yachtLength: length
      ? length.unit === "ft"
        ? `${length.value} feet`
        : `${length.value}m`
      : context.yachtLength,
    location: location ?? context.location,
    urgency:
      session.entities.urgency === "HIGH"
        ? "high"
        : session.entities.urgency === "MEDIUM"
          ? "medium"
          : context.urgency,
    yachtMentioned: context.yachtMentioned || session.entities.yacht,
    assistantState: {
      stage: session.stage,
      disclosureLevel: session.disclosureLevel ?? 1,
      askedMissingFields: session.askedMissingFields ?? [],
      intentRepeatCounts: session.intentRepeatCounts,
      commercialScore: session.commercialScore,
      lastTopic: session.lastTopic,
      entities: session.entities,
    },
  };
}
