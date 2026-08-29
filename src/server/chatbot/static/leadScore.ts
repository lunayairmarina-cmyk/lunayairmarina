import type { CustomerContext } from "@/lib/agent/context";
import type { LeadQualification } from "./leadQualification";
import type { ExtractedEntitySet } from "./extractEntities";

const SERVICE_PREFIXES = [
  "YACHT_MANAGEMENT",
  "CREW",
  "MARINA",
  "VISITING",
  "MAINTENANCE",
  "INSURANCE",
  "CONSULTATION",
  "BERTHING",
  "REFIT",
];

const GENERAL_INTENTS = new Set([
  "GREETING",
  "THANKS",
  "GOODBYE",
  "HOW_ARE_YOU",
  "ABOUT_COMPANY",
  "WHY_US",
  "FOUNDED",
  "UNKNOWN",
  "CLARIFY",
  "GIBBERISH",
]);

export function computeLeadScoreDelta(intentId: string, entities: ExtractedEntitySet): number {
  let delta = 0;

  if (GENERAL_INTENTS.has(intentId)) delta += 1;
  else if (SERVICE_PREFIXES.some((p) => intentId.startsWith(p))) delta += 2;

  if (intentId.includes("PRICING") || intentId === "PRICING") delta += 3;
  if (intentId === "CONSULTATION") delta += 5;
  if (intentId === "WHATSAPP" || intentId === "CONTACT" || intentId === "PHONE") delta += 5;

  if (entities.hasOwnership || entities.yacht) delta += 3;
  if (entities.locationCanonical.length > 0) delta += 2;
  if (entities.pricingInterest) delta += 2;
  if (entities.contactIntent) delta += 2;

  return delta;
}

export function mergeLeadContext(
  context: CustomerContext,
  qualification: LeadQualification,
  scoreDelta: number,
  intentId: string,
  recentIntents: string[],
  lastTopic?: string,
): CustomerContext {
  const interests = [...new Set([...(context.interests ?? []), intentId])];
  if (qualification.service) interests.push(qualification.service);

  const leadScore = Math.min(100, (context.leadScore ?? 0) + scoreDelta);
  const yachtMentioned = Boolean(context.yachtMentioned || qualification.yacht || qualification.yachtLength);

  return {
    ...context,
    interests: [...new Set(interests)].slice(0, 20),
    leadScore,
    yachtMentioned,
    lastServiceMentioned: qualification.service ?? context.lastServiceMentioned,
    location: qualification.location
      ? qualification.location === "JEDDAH"
        ? "Jeddah"
        : qualification.location
      : context.location,
    yachtLength: qualification.yachtLength
      ? `${qualification.yachtLength}m`
      : context.yachtLength,
    recentIntents: recentIntents.slice(-5),
    lastTopic: lastTopic ?? context.lastTopic,
    messageCount: (context.messageCount ?? 0) + 1,
  };
}

export function leadPatchFromContext(
  context: CustomerContext,
  intentId: string,
): Record<string, unknown> {
  return {
    name: (context.name ?? "").slice(0, 120),
    phone: (context.phone ?? "").slice(0, 40),
    normalizedPhone: (context.normalizedPhone ?? "").slice(0, 40),
    email: (context.email ?? "").slice(0, 200),
    yachtType: (context.yachtType ?? context.customerType ?? "").slice(0, 80),
    yachtLength: (context.yachtLength ?? "").slice(0, 40),
    location: (context.location ?? "").slice(0, 80),
    serviceInterest: (context.interests ?? []).slice(0, 12),
    leadScore: context.leadScore ?? 0,
    lastIntent: intentId,
    messageCount: context.messageCount ?? 0,
    yachtMentioned: Boolean(context.yachtMentioned),
    detectedLanguage: context.detectedLanguage,
    lastSeenAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
