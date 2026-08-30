/**
 * Phase 5.4 deterministic context isolation tests (no live Gemini).
 * Run: npm run test:context-isolation
 */
import { emptyCustomerContext } from "../src/lib/agent/context";
import { analyzeAgentTurn } from "../src/server/chatbot/agent/analyze";
import {
  detectTopicShift,
  resolveActiveObjections,
  sanitizeContextForGemini,
  detectReplyLanguageMismatch,
  looksLikeLeakedJson,
} from "../src/server/chatbot/agent/contextIsolation";
import { buildSystemPrompt } from "../src/server/chatbot/prompt";
import { resolveCtaType } from "../src/server/chatbot/agent/ctaIntelligence";
import { blockWhatsAppForTurns } from "../src/server/chatbot/agent/antiRepetition";
import { detectKbGroundingViolations } from "../src/server/chatbot/agent/groundingGuard";

let passed = 0;
let failed = 0;

function assert(condition: unknown, message: string) {
  if (!condition) {
    failed += 1;
    console.error(`FAIL: ${message}`);
    return;
  }
  passed += 1;
}

console.log("Phase 5.4 context isolation tests\n");

// Cross-session simulation: empty context has no prior facts
const fresh = emptyCustomerContext();
const convA = analyzeAgentTurn("عندي يخت 45 متر في جدة", "ar", fresh).context;
assert(convA.yachtLength?.includes("45"), "conv A captures length");
assert(convA.location === "جدة", "conv A captures location");

const convB = analyzeAgentTurn("what services do you provide?", "en", emptyCustomerContext());
assert(!convB.context.yachtLength, "conv B isolated: no yacht length bleed");
assert(!convB.context.location, "conv B isolated: no location bleed");
assert(convB.analysis.intent === "SERVICES", "conv B services intent");

// Same-session memory
let same = emptyCustomerContext();
same = analyzeAgentTurn("عندي يخت 45 متر", "ar", same).context;
same = analyzeAgentTurn("في جدة", "ar", same).context;
same = analyzeAgentTurn("أبي إدارة", "ar", same).context;
const mem = analyzeAgentTurn("وش تشمل؟", "ar", same);
assert(mem.context.yachtLength?.includes("45"), "same session keeps length");
assert(mem.context.location === "جدة", "same session keeps location");
assert(mem.context.lastServiceMentioned === "yacht-management-360", "same session keeps service");

// Objection expiration
assert(
  resolveActiveObjections(["price"], "وش تشمل؟", []).length === 0,
  "price objection expires on scope question",
);
assert(
  resolveActiveObjections(["price", "no_whatsapp"], "وش تشمل؟", []).includes("no_whatsapp"),
  "no_whatsapp persists on topic shift",
);
assert(
  resolveActiveObjections(["no_whatsapp"], "السعر غالي", ["price"]).includes("no_whatsapp"),
  "no_whatsapp persists when price detected",
);
assert(
  resolveActiveObjections(["no_whatsapp"], "السعر غالي", ["price"]).includes("price"),
  "price detected alongside persistent no_whatsapp",
);
const afterPrice = analyzeAgentTurn("السعر غالي", "ar", emptyCustomerContext());
const afterScope = analyzeAgentTurn("وش تشمل؟", "ar", afterPrice.context);
assert(afterScope.analysis.conversationStage !== "OBJECTION", "stage clears after scope");
assert(!afterScope.analysis.objections.includes("price"), "active price cleared");

// Intent shift after objection
const intentFlow = analyzeAgentTurn("what services do you offer?", "en", afterPrice.context);
assert(intentFlow.analysis.intent === "SERVICES", "services intent after objection");
assert(intentFlow.analysis.intent !== "OBJECTION", "not stuck on objection intent");

// CTA: no whatsapp block then handoff allowed
let ctaCtx = blockWhatsAppForTurns(emptyCustomerContext(), 0);
ctaCtx = analyzeAgentTurn("ما أبي واتساب", "ar", ctaCtx).context;
const scopeAfterWa = analyzeAgentTurn("وش تشمل الإدارة؟", "ar", ctaCtx);
assert(!scopeAfterWa.analysis.objections.includes("thinking"), "scope after no wa");
const handoff = analyzeAgentTurn("أبي أكلم أحد", "ar", scopeAfterWa.context);
assert(handoff.analysis.nextBestAction === "CTA_CONSULTATION", "handoff uses consult when wa blocked");
const cta = resolveCtaType(handoff.analysis, handoff.context);
assert(cta !== "WHATSAPP", "handoff not whatsapp when blocked");
assert(["CONSULTATION", "HANDOFF", "SOFT_CONTACT", "NONE"].includes(cta), "consult/handoff allowed");

// Topic switch disclosure
let disc = emptyCustomerContext();
disc = analyzeAgentTurn("وش تشمل إدارة اليخت؟", "ar", disc).context;
disc = analyzeAgentTurn("وش بعد؟", "ar", disc).context;
const marina = analyzeAgentTurn("وش خدمات المارينا؟", "ar", disc);
assert(
  marina.analysis.disclosureTopic === "marina-management" ||
    marina.context.lastServiceMentioned === "marina-management",
  "marina topic switch",
);
const yachtLevel = disc.disclosureByTopic?.["yacht-management-360"] ?? 0;
const marinaLevel = marina.context.disclosureByTopic?.["marina-management"] ?? marina.analysis.disclosureLevel;
assert(marinaLevel <= 1 || marina.analysis.disclosureLevel <= 1, "marina starts low level");

// Grounding
assert(
  detectKbGroundingViolations("نعم عندنا خصم 30%", "ar").some((v) => v.code === "invented_discount"),
  "blocks invented discount",
);
assert(
  detectKbGroundingViolations("نضمن توفير الطاقم خلال 24 ساعة", "ar").some(
    (v) => v.code === "unpublished_guarantee" || v.code === "invented_availability",
  ),
  "blocks invented guarantee/availability",
);
assert(
  detectKbGroundingViolations("لدينا فرع في الرياض", "ar").some((v) => v.code === "unpublished_location"),
  "blocks unpublished Riyadh branch",
);

// Sensitive data sanitization
const dirty = { ...emptyCustomerContext(), phone: "+966501234567", email: "a@b.com" };
const clean = sanitizeContextForGemini(dirty);
assert(!("phone" in clean) && clean.phone === undefined, "phone stripped for Gemini");
assert(!("email" in clean) && clean.email === undefined, "email stripped for Gemini");
assert(Array.isArray(clean.interests), "interests normalized for Gemini");

// Partial context must not crash prompt builder (regression: interests undefined)
let promptOk = true;
try {
  buildSystemPrompt("en", "kb", { customerContext: { yachtLength: "45m" } as typeof dirty });
} catch {
  promptOk = false;
}
assert(promptOk, "buildSystemPrompt tolerates partial customerContext");

// Response quality signals
assert(looksLikeLeakedJson('{"reply":"hi","intent":"X"}'), "detect leaked JSON");
assert(detectReplyLanguageMismatch("مرحباً بك في خدماتنا المتكاملة لليacht", "en"), "detect en/ar mismatch");

assert(detectTopicShift("what services do you offer?"), "topic shift services en");
assert(detectTopicShift("وش تشمل؟"), "topic shift scope ar");

console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
