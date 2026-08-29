import type { ExtractedEntitySet } from "./extractEntities";
import type { SessionConversationState } from "./conversationState";
import type { CommercialLevel } from "./commercialScore";
import { isFrustrated } from "./frustration";
import { isAcknowledgement } from "./acknowledgement";
import { getIntentRepeatCount } from "./repeatedQuestion";

export type ResponseStrategy =
  | "DIRECT_ANSWER"
  | "DIRECT_ANSWER_WITH_CTA"
  | "CLARIFICATION"
  | "FOLLOW_UP"
  | "PROGRESSIVE_DISCOVERY"
  | "SALES_JOURNEY"
  | "HANDOFF"
  | "OUT_OF_SCOPE"
  | "UNKNOWN"
  | "GIBBERISH"
  | "SECURITY"
  | "FRUSTRATION_REPAIR"
  | "REPEAT_CONDENSED"
  | "ACKNOWLEDGEMENT";

export function selectResponseStrategy(input: {
  intentId: string;
  confidence: "high" | "medium" | "low";
  clarified: boolean;
  commercialLevel: CommercialLevel;
  session: Partial<SessionConversationState>;
  message: string;
  isGibberish: boolean;
  isSecurity: boolean;
  isOutOfScope: boolean;
  isAck: boolean;
}): ResponseStrategy {
  if (input.isGibberish) return "GIBBERISH";
  if (input.isSecurity) return "SECURITY";
  if (input.isOutOfScope) return "OUT_OF_SCOPE";
  if (input.isAck) return "ACKNOWLEDGEMENT";
  if (isFrustrated(input.message)) return "FRUSTRATION_REPAIR";

  const repeat = getIntentRepeatCount(input.intentId, input.session.intentRepeatCounts ?? {});
  if (repeat >= 2 && input.intentId !== "CLARIFY") return "REPEAT_CONDENSED";

  if (input.clarified || input.intentId === "CLARIFY") return "CLARIFICATION";
  if (input.intentId === "UNKNOWN") return "UNKNOWN";

  if (
    input.commercialLevel === "HIGH" &&
    input.session.entities?.hasOwnership &&
    input.intentId.startsWith("YACHT")
  ) {
    return "SALES_JOURNEY";
  }

  if (input.commercialLevel !== "NONE" && input.confidence !== "low") {
    return "DIRECT_ANSWER_WITH_CTA";
  }

  if (input.confidence === "low") return "CLARIFICATION";

  if (input.session.stage === "DISCOVERY" && input.intentId === "SERVICES_LIST") {
    return "PROGRESSIVE_DISCOVERY";
  }

  if (input.intentId === "CONSULTATION" || input.session.entities?.contactIntent) {
    return "HANDOFF";
  }

  return "DIRECT_ANSWER";
}

export function needsSmartQuestion(intentId: string, entities: ExtractedEntitySet): boolean {
  if (intentId === "YACHT_MANAGEMENT" && entities.yacht && entities.locationCanonical.length === 0) {
    return true;
  }
  if (intentId === "CREW_MANAGEMENT" && entities.services.includes("crew") && !entities.yacht) {
    return true;
  }
  return false;
}
