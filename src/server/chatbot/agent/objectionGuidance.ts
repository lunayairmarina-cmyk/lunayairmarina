import type { ChatLanguage } from "@/lib/chatbot/types";
import type { CustomerContext } from "@/lib/agent/context";
import type { NextBestAction } from "./types";
import { stripWhatsAppLinks } from "./contextIsolation";

export function blocksWhatsAppCta(objections: string[], context?: CustomerContext): boolean {
  if ((context?.whatsappBlockedTurns ?? 0) > 0) return true;
  if (context?.requestedContactMethod === "email") return true;
  return objections.some((item) =>
    ["no_whatsapp", "thinking", "no_contact_now"].includes(item),
  );
}

export function blocksHandoff(objections: string[]): boolean {
  return objections.includes("no_contact_now");
}

export function sanitizeReplyForObjections(
  reply: string,
  objections: string[],
  context?: CustomerContext,
): string {
  if (!blocksWhatsAppCta(objections, context)) return reply;
  return stripWhatsAppLinks(reply);
}

export function adjustNbaForObjections(
  nba: NextBestAction,
  objections: string[],
  context?: CustomerContext,
): NextBestAction {
  const blockedWa = blocksWhatsAppCta(objections, context);

  if (blockedWa && (nba === "CTA_WHATSAPP" || nba === "HANDOFF")) {
    if (objections.includes("thinking") || objections.includes("price")) return "ANSWER";
    return "CTA_CONSULTATION";
  }
  if (objections.includes("thinking") && (nba === "CTA_WHATSAPP" || nba === "CTA_CONSULTATION")) {
    return "ANSWER";
  }
  if (objections.includes("price") && nba === "CTA_WHATSAPP") {
    return "ANSWER";
  }
  if (nba === "CTA_CONSULTATION") return "CTA_CONSULTATION";
  return objections.length ? "ANSWER" : nba;
}

export function buildObjectionGuidance(objections: string[], language: ChatLanguage): string {
  if (!objections.length) return "";

  const rules: string[] = [];
  if (objections.includes("price")) {
    rules.push(
      language === "ar"
        ? 'OBJECTION price: تفهّم → وضّح أن الباقات مخصصة وشفافية OPEX → قلّل الاحتكاك → CTA خفيف (نموذج الشات) بدون خصم أو سعر أو وعد غير منشور.'
        : "OBJECTION price: Acknowledge → customized packages / OPEX transparency → reduce friction → soft CTA (in-chat form). No discount, invented price, or unpublished promise.",
    );
  }
  if (objections.includes("thinking")) {
    rules.push(
      language === "ar"
        ? "OBJECTION thinking: أعطِ مساحة، لا تضغط، لا تذكر واتساب، لا CTA قوي."
        : "OBJECTION thinking: Give space, no pressure, no WhatsApp, no strong CTA.",
    );
  }
  if (objections.includes("no_whatsapp")) {
    rules.push(
      language === "ar"
        ? "OBJECTION no_whatsapp: احترم الرفض — لا رابط واتساب، قدّم نموذج الشات أو البريد المنشور."
        : "OBJECTION no_whatsapp: Respect refusal — no WhatsApp link; offer in-chat form or published email.",
    );
  }
  if (objections.includes("compare")) {
    rules.push(
      language === "ar"
        ? "OBJECTION compare: لا تهاجم المنافس — قدّم نقاط Lunayair المنشورة فقط (خدمات، شفافية، مواقع) بلا ادعاءات تفوق مختلقة."
        : "OBJECTION compare: Do not attack competitors — share published Lunayair points only (services, transparency, locations) with no invented superiority claims.",
    );
  }
  if (objections.includes("unsure")) {
    rules.push(
      language === "ar"
        ? "OBJECTION unsure: اسأل سؤال توضيحي واحد فقط."
        : "OBJECTION unsure: Ask one clarifying question only.",
    );
  }

  return rules.length
    ? `OBJECTION PLAYBOOK (internal):\n${rules.join("\n")}`
    : "";
}
