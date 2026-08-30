import type { ChatLanguage } from "@/lib/chatbot/types";
import type { CustomerContext } from "@/lib/agent/context";
import type { AgentAnalysis } from "./types";
import {
  asksKnownMissingField,
  countQuestions,
  detectKbGroundingViolations,
  safePricingFallback,
  safeSecurityFallback,
  stripInventedPricingSentences,
  stripUnsupportedClaims,
} from "./groundingGuard";
import { sanitizeReplyForObjections, blocksWhatsAppCta } from "./objectionGuidance";
import { buildDisclosureFacts } from "./progressiveDisclosure";
import { resolveCtaType, shouldAttachWhatsApp } from "./ctaIntelligence";
import {
  detectReplyLanguageMismatch,
  looksLikeLeakedJson,
  stripWhatsAppLinks,
  repairLanguageMismatchReply,
} from "./contextIsolation";
import { parseGeminiAgentOutputDetailed } from "./parseOutput";

const WHATSAPP_URL = "https://wa.me/966531561212";

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
  const trimmed = kept.join("").trim();
  return trimmed || (language === "ar" ? "كيف أقدر أساعدك أكثر؟" : "How can I help you further?");
}

function appendDisclosureIfNeeded(
  reply: string,
  analysis: AgentAnalysis,
  language: ChatLanguage,
): string {
  if (analysis.nextBestAction !== "SHOW_MORE" && analysis.disclosureLevel <= 0) return reply;
  const topic = analysis.disclosureTopic ?? "general";
  const facts = buildDisclosureFacts(topic, analysis.disclosureLevel, language);
  if (!facts || reply.includes(facts.slice(0, 40))) return reply;
  const prefix = language === "ar" ? "باختصار:" : "In brief:";
  return `${reply.trim()}\n\n${prefix}\n${facts}`;
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
      reply: input.language === "ar" ? "كيف أقدر أساعدك في خدمات Lunayair Marina؟" : "How can I help with Lunayair Marina services?",
      repaired: true,
      usedFallback: true,
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
      reply =
        input.language === "ar"
          ? "كيف أقدر أساعدك في خدمات Lunayair Marina؟"
          : "How can I help with Lunayair Marina services?";
      usedFallback = true;
      repaired = true;
    }
  }

  if (detectReplyLanguageMismatch(reply, input.language)) {
    violations.push("language_mismatch");
    reply = repairLanguageMismatchReply(input.language, input.analysis);
    repaired = true;
    usedFallback = true;
  }

  if (input.analysis.security) {
    const leak = detectKbGroundingViolations(reply, input.language).some((v) => v.code === "security_leak");
    if (leak || /system prompt|api key|hidden instructions/i.test(reply)) {
      reply = safeSecurityFallback(input.language);
      violations.push("security_leak");
      repaired = true;
      usedFallback = true;
    }
  }

  const grounding = detectKbGroundingViolations(reply, input.language);
  for (const v of grounding) violations.push(v.code);

  if (grounding.some((v) => v.code === "invented_price")) {
    reply = stripInventedPricingSentences(reply, input.language);
    if (/price|سعر|pricing|تكلف/i.test(input.userMessage) && !reply.trim()) {
      reply = safePricingFallback(input.language);
      usedFallback = true;
    }
    repaired = true;
  }

  if (
    grounding.some((v) =>
      ["invented_discount", "unpublished_guarantee", "invented_availability", "unpublished_certification", "unpublished_service_claim"].includes(v.code),
    )
  ) {
    const stripped = stripUnsupportedClaims(reply, input.language);
    reply = stripped || safePricingFallback(input.language);
    repaired = true;
    if (!stripped) usedFallback = true;
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

  if (input.analysis.progressive || input.analysis.disclosureLevel > 0) {
    const enriched = appendDisclosureIfNeeded(reply, input.analysis, input.language);
    if (enriched !== reply) {
      reply = enriched;
      repaired = true;
    }
  }

  if (shouldAttachWhatsApp(ctaType, input.analysis, input.context) && !/wa\.me\/966531561212/i.test(reply)) {
    reply = `${reply.trim()}\n\n${WHATSAPP_URL}`;
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
