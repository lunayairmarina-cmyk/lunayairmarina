import type { ChatLanguage } from "@/lib/chatbot/types";
import type { CustomerContext } from "@/lib/agent/context";
import type { AgentAnalysis } from "./types";
import {
  asksKnownMissingField,
  countQuestions,
  detectKbGroundingViolations,
  stripInventedPricingSentences,
  stripUnsupportedClaims,
} from "./groundingGuard";
import { sanitizeReplyForObjections, blocksWhatsAppCta } from "./objectionGuidance";
import { resolveCtaType, shouldAttachWhatsApp } from "./ctaIntelligence";
import {
  appendPublishedWhatsAppUrl,
  replyContainsPublishedWhatsAppUrl,
} from "../contactChannels";
import {
  detectReplyLanguageMismatch,
  looksLikeLeakedJson,
  stripWhatsAppLinks,
} from "./contextIsolation";
import { parseGeminiAgentOutputDetailed } from "./parseOutput";

export interface QualityPolishResult {
  reply: string;
  repaired: boolean;
  usedFallback: boolean;
  violations: string[];
  ctaType: ReturnType<typeof resolveCtaType>;
}

function trimToOneQuestion(reply: string, language: ChatLanguage): string {
  if (countQuestions(reply) <= 1) return reply;
  const parts = reply.split(/(?<=[?؟])/);
  let questions = 0;
  const kept: string[] = [];
  for (const part of parts) {
    if (/[?؟]/.test(part)) {
      questions += 1;
      if (questions > 1) continue;
    }
    kept.push(part);
  }
  return kept.join("").trim();
}

function stripSecurityLeakSentences(reply: string, language: ChatLanguage): string {
  const sentences = reply.split(/(?<=[.!?؟])\s+/);
  const kept = sentences.filter((sentence) => {
    if (/system prompt|api key|hidden instructions/i.test(sentence)) return false;
    return !detectKbGroundingViolations(sentence, language).some((v) => v.code === "security_leak");
  });
  return kept.join(" ").trim();
}

export function polishAgentReply(input: {
  reply: string;
  language: ChatLanguage;
  analysis: AgentAnalysis;
  context: CustomerContext;
  userMessage: string;
}): QualityPolishResult {
  let reply = input.reply.trim();
  const violations: string[] = [];
  let repaired = false;
  let usedFallback = false;
  const ctaType = resolveCtaType(input.analysis, input.context);

  if (!reply) {
    return {
      reply: "",
      repaired: false,
      usedFallback: false,
      violations: ["empty_reply"],
      ctaType,
    };
  }

  if (looksLikeLeakedJson(reply)) {
    const salvaged = parseGeminiAgentOutputDetailed(reply);
    if (salvaged.reply) {
      reply = salvaged.reply;
      repaired = true;
    } else {
      violations.push("leaked_json");
      reply = "";
      repaired = true;
    }
  }

  if (detectReplyLanguageMismatch(reply, input.language)) {
    violations.push("language_mismatch");
  }

  if (input.analysis.security) {
    const leak = detectKbGroundingViolations(reply, input.language).some((v) => v.code === "security_leak");
    if (leak || /system prompt|api key|hidden instructions/i.test(reply)) {
      const stripped = stripSecurityLeakSentences(reply, input.language);
      if (stripped !== reply) {
        reply = stripped;
        violations.push("security_leak");
        repaired = true;
      }
    }
  }

  const grounding = detectKbGroundingViolations(reply, input.language);
  for (const v of grounding) violations.push(v.code);

  if (grounding.some((v) => v.code === "invented_price")) {
    reply = stripInventedPricingSentences(reply, input.language);
    repaired = true;
  }

  if (
    grounding.some((v) =>
      ["invented_discount", "unpublished_guarantee", "invented_availability", "unpublished_certification", "unpublished_service_claim"].includes(v.code),
    )
  ) {
    const stripped = stripUnsupportedClaims(reply, input.language);
    reply = stripped;
    repaired = true;
  }

  const priorAsked = input.context.askedMissingFields ?? [];
  if (asksKnownMissingField(reply, priorAsked, input.language)) {
    violations.push("repeated_missing_question");
    reply = trimToOneQuestion(reply, input.language);
    repaired = true;
  }

  if (countQuestions(reply) > 1) {
    violations.push("multi_question");
    reply = trimToOneQuestion(reply, input.language);
    repaired = true;
  }

  reply = sanitizeReplyForObjections(reply, input.analysis.objections, input.context);
  if (blocksWhatsAppCta(input.analysis.objections, input.context)) {
    const stripped = stripWhatsAppLinks(reply);
    if (stripped !== reply) {
      violations.push("whatsapp_after_refusal");
      reply = stripped;
      repaired = true;
    }
  }

  if (
    shouldAttachWhatsApp(ctaType, input.analysis, input.context) &&
    !replyContainsPublishedWhatsAppUrl(reply)
  ) {
    reply = appendPublishedWhatsAppUrl(reply);
  }

  if (blocksWhatsAppCta(input.analysis.objections, input.context)) {
    const final = stripWhatsAppLinks(reply);
    if (final !== reply) {
      violations.push("whatsapp_after_refusal");
      reply = final;
      repaired = true;
    }
  }

  return { reply: reply.trim(), repaired, usedFallback, violations, ctaType };
}
