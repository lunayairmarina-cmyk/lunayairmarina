import type { CustomerContext } from "@/lib/agent/context";
import type { AgentIntent } from "@/lib/agent/query";

export type LeadSignal = {
  leadStatus: "none" | "potential" | "handoff";
  shouldOfferHandoff: boolean;
  shouldCreateLead: boolean;
  phone?: string;
  email?: string;
  name?: string;
};

const PHONE_RE = /(?:\+?\d[\d\s\-()]{7,}\d)/;
const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;

function hasBuyingIntent(message: string, context: CustomerContext, intent: AgentIntent): boolean {
  const text = message.toLowerCase();
  if (intent === "human_handoff" || intent === "pricing" || intent === "availability") return true;
  if (context.yachtLength && context.location && context.interests.length > 0) return true;
  if (
    /عايز|محتاج|interested|need help|consult|استشار|تواصلوا|كلموني|contact me|call me|whatsapp/i.test(
      text,
    )
  ) {
    return true;
  }
  return false;
}

/** Detect soft lead / handoff without creating noisy leads on every message. */
export function detectLeadSignal(
  message: string,
  context: CustomerContext,
  intent: AgentIntent,
  priorLeadStatus: "none" | "potential" | "handoff" = "none",
): LeadSignal {
  const phoneMatch = message.match(PHONE_RE);
  const emailMatch = message.match(EMAIL_RE);
  const phone = phoneMatch?.[0]?.replace(/\s+/g, " ").trim();
  const email = emailMatch?.[0]?.trim().toLowerCase();
  const name = context.name;

  const consent =
    /تواصلوا|كلموني|yes contact|call me|whatsapp me|ابعتولي|تواصل معاي|تواصل معي|contact me|reach out/i.test(
      message,
    );

  if (
    phone ||
    email ||
    (consent && (priorLeadStatus === "potential" || priorLeadStatus === "handoff"))
  ) {
    return {
      leadStatus: "handoff",
      shouldOfferHandoff: false,
      shouldCreateLead: Boolean(phone || email || name),
      phone,
      email,
      name,
    };
  }

  if (hasBuyingIntent(message, context, intent) || priorLeadStatus === "potential") {
    return {
      leadStatus: "potential",
      shouldOfferHandoff: priorLeadStatus === "none",
      shouldCreateLead: false,
      name,
    };
  }

  return {
    leadStatus: priorLeadStatus,
    shouldOfferHandoff: false,
    shouldCreateLead: false,
  };
}
