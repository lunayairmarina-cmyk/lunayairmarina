import agentRules from "@/data/chatbot/agent-rules.json";
import type { DialectHint } from "./languageDetect";
import type { ExtractedEntitySet } from "./extractEntities";
import type { ConversationContextStack } from "./contextStack";
import { intentToTopic } from "./contextStack";

export type ConversationStage =
  | "GREETING"
  | "DISCOVERY"
  | "SERVICE_IDENTIFICATION"
  | "QUALIFICATION"
  | "CONSIDERATION"
  | "OBJECTION"
  | "HIGH_INTENT"
  | "HANDOFF";

export interface SessionConversationState {
  lastIntent?: string;
  recentIntents: string[];
  lastTopic?: string;
  stage: ConversationStage;
  entities: ExtractedEntitySet;
  commercialScore: number;
  intentRepeatCounts: Record<string, number>;
  recentResponseIds: string[];
  language?: "ar" | "en";
  dialect?: DialectHint;
  disclosureLevel?: number;
}

export function inferStage(
  intentId: string,
  entities?: ExtractedEntitySet,
  commercialScore = 0,
  objectionPresent = false,
): ConversationStage {
  if (intentId === "GREETING" || intentId === "HOW_ARE_YOU") return "GREETING";
  if (objectionPresent || intentId.includes("OBJECTION")) return "OBJECTION";
  if (intentId === "PHONE" || intentId === "WHATSAPP" || intentId === "HANDOFF" || entities?.phone || entities?.email) {
    return "HANDOFF";
  }
  if (commercialScore >= 60 || intentId === "BOOK_CONSULTATION") return "HIGH_INTENT";
  if (intentId.includes("PRICING") || intentId === "PRICING") return "CONSIDERATION";

  if (entities?.yachtLength || entities?.locations?.length || entities?.yachtType) {
    return "QUALIFICATION";
  }

  if (
    intentId.startsWith("YACHT") ||
    intentId.startsWith("CREW") ||
    intentId.startsWith("MARINA") ||
    intentId.startsWith("VISITING") ||
    intentId.startsWith("MAINTENANCE") ||
    intentId.startsWith("INSURANCE")
  ) {
    return "SERVICE_IDENTIFICATION";
  }

  return "DISCOVERY";
}

export function mergeSessionState(input: {
  intentId: string;
  entities: ExtractedEntitySet;
  stack: ConversationContextStack;
  commercialScore: number;
  prior?: Partial<SessionConversationState>;
  language: "ar" | "en";
  dialect?: DialectHint;
  objectionPresent?: boolean;
}): SessionConversationState {
  const repeatCounts = { ...(input.prior?.intentRepeatCounts ?? {}) };
  repeatCounts[input.intentId] = (repeatCounts[input.intentId] ?? 0) + 1;

  const mergedEntities: ExtractedEntitySet = {
    yacht: input.entities.yacht || input.prior?.entities?.yacht || false,
    yachtType: input.entities.yachtType ?? input.prior?.entities?.yachtType,
    locations: [...new Set([...(input.prior?.entities?.locations ?? []), ...input.entities.locations])],
    locationCanonical: [
      ...new Set([...(input.prior?.entities?.locationCanonical ?? []), ...input.entities.locationCanonical]),
    ],
    services: [...new Set([...(input.prior?.entities?.services ?? []), ...input.entities.services])],
    yachtLength: input.entities.yachtLength ?? input.prior?.entities?.yachtLength,
    hasOwnership: input.entities.hasOwnership || input.prior?.entities?.hasOwnership || false,
    pricingInterest: input.entities.pricingInterest || input.prior?.entities?.pricingInterest || false,
    contactIntent: input.entities.contactIntent || input.prior?.entities?.contactIntent || false,
    customerGoal: input.entities.customerGoal ?? input.prior?.entities?.customerGoal,
    urgency: input.entities.urgency === "HIGH" ? "HIGH" : (input.prior?.entities?.urgency ?? "LOW"),
    objectionType: input.entities.objectionType ?? input.prior?.entities?.objectionType,
    phone: input.entities.phone ?? input.prior?.entities?.phone,
    email: input.entities.email ?? input.prior?.entities?.email,
    name: input.entities.name ?? input.prior?.entities?.name,
  };

  const recentIntents = [...(input.stack.recentIntents ?? [])];
  if (input.intentId && input.intentId !== "CLARIFY" && input.intentId !== "UNKNOWN") {
    recentIntents.push(input.intentId);
  }

  const calculatedScore = Math.max(input.prior?.commercialScore ?? 0, input.commercialScore);
  const nextStage = inferStage(
    input.intentId,
    mergedEntities,
    calculatedScore,
    input.objectionPresent || Boolean(mergedEntities.objectionType),
  );

  return {
    lastIntent: input.intentId,
    recentIntents: recentIntents.slice(-5),
    lastTopic: intentToTopic(input.intentId) ?? input.stack.lastTopic,
    stage: nextStage,
    entities: mergedEntities,
    commercialScore: calculatedScore,
    intentRepeatCounts: repeatCounts,
    recentResponseIds: input.prior?.recentResponseIds ?? [],
    language: input.language,
    dialect: input.dialect,
    disclosureLevel: input.prior?.disclosureLevel ?? 1,
  };
}

