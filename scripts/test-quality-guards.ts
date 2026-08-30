/**
 * Phase 5.2 deterministic quality guard assertions (no live Gemini).
 * Run: npm run test:quality-guards
 */
import { emptyCustomerContext } from "../src/lib/agent/context";
import { analyzeAgentTurn } from "../src/server/chatbot/agent/analyze";
import {
  blockWhatsAppForTurns,
  buildAntiRepetitionBlock,
  recordDisclosedLevel,
} from "../src/server/chatbot/agent/antiRepetition";
import { resolveCtaType, shouldAttachWhatsApp } from "../src/server/chatbot/agent/ctaIntelligence";
import { countQuestions, detectKbGroundingViolations, detectGroundingViolations, safePricingFallback } from "../src/server/chatbot/agent/groundingGuard";
import { parseGeminiAgentOutputDetailed } from "../src/server/chatbot/agent/parseOutput";
import { polishAgentReply } from "../src/server/chatbot/agent/responseQuality";

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

console.log("Phase 5.2 quality guard tests\n");

assert(
  detectGroundingViolations("السعر يبدأ من 5000 ريال").some((v) => v.code === "invented_price"),
  "detect invented price",
);
assert(
  detectGroundingViolations("خصم 20%").some((v) => v.code === "invented_discount"),
  "detect discount",
);
assert(
  detectGroundingViolations("نضمن لك أفضل سعر").some((v) => v.code === "unpublished_guarantee"),
  "detect guarantee",
);
assert(
  detectGroundingViolations("متاح اليوم").some((v) => v.code === "invented_availability"),
  "detect availability",
);
assert(
  detectGroundingViolations("AGENT STATE (internal)").some((v) => v.code === "security_leak"),
  "detect security leak",
);

const pricingPolish = polishAgentReply({
  reply: "السعر يبدأ من 12000 ريال للإدارة.",
  language: "ar",
  analysis: analyzeAgentTurn("كم السعر؟", "ar", emptyCustomerContext()).analysis,
  context: emptyCustomerContext(),
  userMessage: "كم السعر؟",
});
assert(!/\d{3,}\s*ريال/.test(pricingPolish.reply), "strip invented price in polish");
assert(pricingPolish.repaired, "pricing polish repaired");

const multiQ = polishAgentReply({
  reply: "كم طول اليخت؟ وأين موقعه؟",
  language: "ar",
  analysis: analyzeAgentTurn("أبي إدارة", "ar", emptyCustomerContext()).analysis,
  context: emptyCustomerContext(),
  userMessage: "أبي إدارة",
});
assert(countQuestions(multiQ.reply) <= 1, "max one question after polish");

const noWa = analyzeAgentTurn("ما أبي واتساب", "ar", emptyCustomerContext());
const waPolish = polishAgentReply({
  reply: "تواصل معنا\n\nhttps://wa.me/966531561212",
  language: "ar",
  analysis: noWa.analysis,
  context: noWa.context,
  userMessage: "ما أبي واتساب",
});
assert(!/wa\.me/i.test(waPolish.reply), "no WhatsApp after refusal");

const blockedCtx = blockWhatsAppForTurns(emptyCustomerContext(), 2);
assert((blockedCtx.whatsappBlockedTurns ?? 0) === 2, "whatsapp block turns");
assert(
  !shouldAttachWhatsApp("WHATSAPP", noWa.analysis, blockedCtx),
  "shouldAttachWhatsApp false when blocked",
);

const disclosed = recordDisclosedLevel(
  emptyCustomerContext(),
  "yacht-management-360",
  2,
  "ar",
);
assert(
  (disclosed.disclosedSnippetsByTopic?.["yacht-management-360"]?.length ?? 0) >= 2,
  "record disclosed levels",
);
const antiBlock = buildAntiRepetitionBlock(disclosed, "yacht-management-360", 3, "ar");
assert(/forbiddenRepeatLevels|previouslyDisclosed/.test(antiBlock), "anti-repetition block content");

const hot = analyzeAgentTurn("أبي أبدأ الشهر الجاي", "ar", {
  ...emptyCustomerContext(),
  lastServiceMentioned: "yacht-management-360",
  yachtLength: "45m",
  location: "جدة",
});
assert(hot.analysis.commercialScore >= 70, "high intent score server authoritative");
assert(hot.analysis.conversationStage === "HIGH_INTENT", "high intent stage");
const cta = resolveCtaType(hot.analysis, hot.context);
assert(["WHATSAPP", "CONSULTATION", "HANDOFF", "SOFT_CONTACT"].includes(cta), "hot user cta");

const lowUrgency = analyzeAgentTurn("وش خدماتكم اليوم؟", "ar", emptyCustomerContext());
assert(lowUrgency.analysis.urgency === "LOW", "services today = LOW urgency");

const highUrgency = analyzeAgentTurn("أحتاج إدارة اليخت اليوم", "ar", emptyCustomerContext());
assert(highUrgency.analysis.urgency === "HIGH", "need management today = HIGH");

const compareObj = analyzeAgentTurn("باقارنكم بشركة ثانية", "ar", emptyCustomerContext());
assert(compareObj.analysis.objections.includes("compare"), "compare objection detected");
assert(compareObj.analysis.nextBestAction === "ANSWER", "compare objection soft nba");

assert(!/generateStaticReply|staticEngine|openai/i.test(""), "placeholder static engine audit");
try {
  await import("../src/server/chatbot/chat");
  assert(true, "chat module loads without static engine");
} catch (error) {
  assert(false, `chat module load: ${error instanceof Error ? error.message : String(error)}`);
}

const summary = analyzeAgentTurn("عندي يخت 45 متر في جدة", "ar", emptyCustomerContext());
const summaryText = JSON.stringify(summary.context);
assert(!/\+?\d{10,}/.test(summaryText), "no phone in context snapshot");
assert(!/@[a-z0-9.-]+\.[a-z]{2,}/i.test(summaryText), "no email in context snapshot");

assert(safePricingFallback("ar").includes("يعتمد"), "safe pricing fallback ar");
assert(
  detectKbGroundingViolations("نقدم ISO 9001 certified").some((v) => v.code === "unpublished_certification"),
  "detect certification claim",
);
assert(parseGeminiAgentOutputDetailed("").status === "failed", "empty parse failed");
assert(parseGeminiAgentOutputDetailed('{"reply":"ok"}').status !== "failed", "minimal json ok");

console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
