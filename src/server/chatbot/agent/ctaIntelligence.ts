import type { CustomerContext } from "@/lib/agent/context";
import type { AgentAnalysis, CtaType, NextBestAction } from "./types";
import { blocksWhatsAppCta } from "./objectionGuidance";

export function resolveCtaType(analysis: AgentAnalysis, context: CustomerContext): CtaType {
  const blockedWa = blocksWhatsAppCta(analysis.objections, context);

  if (analysis.nextBestAction === "ASK_MISSING_INFO") return "ASK_MISSING_INFO";
  if (analysis.nextBestAction === "HANDOFF") return blockedWa ? "SOFT_CONTACT" : "HANDOFF";
  if (analysis.nextBestAction === "CTA_CONSULTATION") {
    return blockedWa ? "SOFT_CONTACT" : "CONSULTATION";
  }
  if (analysis.nextBestAction === "CTA_WHATSAPP") {
    return blockedWa ? "SOFT_CONTACT" : "WHATSAPP";
  }
  if (analysis.commercialScore >= 55 && !analysis.objections.length && !blockedWa) {
    if (analysis.urgency === "HIGH") return "CONSULTATION";
    if (analysis.commercialScore >= 70) return "SOFT_CONTACT";
  }
  return "NONE";
}

export function shouldAttachWhatsApp(cta: CtaType, analysis: AgentAnalysis, context: CustomerContext): boolean {
  if (blocksWhatsAppCta(analysis.objections, context)) return false;
  return cta === "WHATSAPP" || cta === "HANDOFF";
}

export function nbaFromCta(cta: CtaType): NextBestAction {
  switch (cta) {
    case "ASK_MISSING_INFO":
      return "ASK_MISSING_INFO";
    case "WHATSAPP":
      return "CTA_WHATSAPP";
    case "CONSULTATION":
      return "CTA_CONSULTATION";
    case "HANDOFF":
      return "HANDOFF";
    default:
      return "ANSWER";
  }
}
