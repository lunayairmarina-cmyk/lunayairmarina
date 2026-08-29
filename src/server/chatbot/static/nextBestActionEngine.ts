import type { EntityMemory } from "./entityMemory";
import type { MissingInfoAnalysis } from "./missingInfoEngine";
import type { ObjectionType } from "./objectionEngine";

export type NextBestAction =
  | "ANSWER"
  | "ASK_MISSING_INFO"
  | "CLARIFY"
  | "SHOW_MORE"
  | "QUALIFY"
  | "CTA_WHATSAPP"
  | "CTA_CONSULTATION"
  | "HANDOFF";

export interface ActionContext {
  intent: string;
  confidence: "high" | "medium" | "low";
  stage: string;
  commercialLevel: "HIGH" | "MEDIUM" | "LOW" | "NONE";
  urgency: "HIGH" | "MEDIUM" | "LOW";
  missingInfo: MissingInfoAnalysis;
  objectionType?: ObjectionType;
  isProgressive: boolean;
  isRepair: boolean;
  contactProvided: boolean;
}

export function determineNextBestAction(ctx: ActionContext): NextBestAction {
  // Objections are handled via objection engine
  if (ctx.objectionType) {
    if (ctx.objectionType === "NO_CONTACT_OBJECTION") return "ANSWER";
    return "QUALIFY";
  }

  // High urgency + commercial intent → direct WhatsApp or Handoff
  if (ctx.urgency === "HIGH" && (ctx.commercialLevel === "HIGH" || ctx.commercialLevel === "MEDIUM")) {
    return ctx.contactProvided ? "HANDOFF" : "CTA_WHATSAPP";
  }

  // Low confidence or explicit clarification intent
  if (ctx.confidence === "low" || ctx.intent === "CLARIFY") {
    return "CLARIFY";
  }

  // Progressive disclosure request
  if (ctx.isProgressive) {
    return "SHOW_MORE";
  }

  // If user provided contact info (phone/email), trigger handoff
  if (ctx.contactProvided || ctx.intent === "PHONE" || ctx.intent === "WHATSAPP") {
    return "HANDOFF";
  }

  // High commercial intent without contact -> CTA_WHATSAPP or CTA_CONSULTATION
  if (ctx.commercialLevel === "HIGH" || ctx.stage === "HIGH_INTENT") {
    return "CTA_WHATSAPP";
  }

  // Qualification stage with missing important fields
  if (ctx.missingInfo.missing.length > 0 && ctx.missingInfo.nextBestQuestion) {
    // Only ask if stage is DISCOVERY / QUALIFICATION / SERVICE_IDENTIFICATION
    if (["DISCOVERY", "SERVICE_IDENTIFICATION", "QUALIFICATION"].includes(ctx.stage)) {
      return "ASK_MISSING_INFO";
    }
  }

  if (ctx.commercialLevel === "MEDIUM" || ctx.stage === "CONSIDERATION") {
    return "CTA_CONSULTATION";
  }

  return "ANSWER";
}
