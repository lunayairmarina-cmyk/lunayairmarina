/**
 * Deterministic contact, attribution, identity, intent, and information-budget tests.
 * Run: npm run test:contact-attribution
 */
import { emptyCustomerContext, mergeCustomerContext } from "../src/lib/agent/context";
import { analyzeAgentTurn } from "../src/server/chatbot/agent/analyze";
import { buildAntiRepetitionBlock } from "../src/server/chatbot/agent/antiRepetition";
import { shouldAttachWhatsApp } from "../src/server/chatbot/agent/ctaIntelligence";
import { polishAgentReply } from "../src/server/chatbot/agent/responseQuality";
import {
  detectChatbotIdentity,
  detectPhoneRequest,
  detectWhatsAppRequest,
  factIdsToRecord,
  getAllServiceFactTexts,
  resolveQuestionFocus,
  selectAllowedFacts,
} from "../src/server/chatbot/agent/factSelection";
import { composeGeminiKnowledge } from "../src/server/chatbot/knowledge";
import {
  appendPublishedWhatsAppUrl,
  getPublishedWhatsAppUrl,
  replyContainsPublishedWhatsAppUrl,
} from "../src/server/chatbot/contactChannels";
import contact from "../src/data/chatbot/contact.json";

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

function assertIdentityRouting(message: string, language: "ar" | "en") {
  assert(detectChatbotIdentity(message), `detect: identity "${message}"`);
  const turn = analyzeAgentTurn(message, language, emptyCustomerContext());
  assert(turn.analysis.intent === "CHATBOT_IDENTITY", `intent: identity for "${message}"`);
  assert(turn.analysis.questionFocus === "chatbot_identity", `focus: identity for "${message}"`);
  const sel = selectAllowedFacts({
    serviceId: "yacht-management-360",
    disclosureLevel: 1,
    questionFocus: "chatbot_identity",
    intent: "CHATBOT_IDENTITY",
    disclosedFactIds: [],
    language,
    message,
  });
  assert(sel.reason === "chatbot_identity", `selection: identity for "${message}"`);
  assert(
    sel.allowedFacts.some((f) => /AI|ذكي|assistant|مساعد/i.test(f.text)),
    `facts: AI identity for "${message}"`,
  );
}

function run() {
  console.log("Running contact & attribution tests...\n");

  const publishedWa = getPublishedWhatsAppUrl();
  assert(publishedWa === contact.whatsappUrl, "central: whatsapp url from contact.json");
  assert(
    replyContainsPublishedWhatsAppUrl(`تواصل معنا ${publishedWa}`),
    "central: detects published whatsapp url in reply",
  );
  assert(
    appendPublishedWhatsAppUrl("مرحباً").endsWith(publishedWa),
    "central: append uses published url",
  );

  // Contact focus detection
  assert(resolveQuestionFocus("رقم الواتس") === "contact_whatsapp", "focus: whatsapp ar");
  assert(resolveQuestionFocus("ممكن رقم الهاتف") === "contact_phone", "focus: phone ar");
  assert(resolveQuestionFocus("في رقم اتصال؟") === "contact_phone", "focus: phone exists ar");
  assert(resolveQuestionFocus("مفيش رقم اتصال") === "contact_phone", "focus: phone denial ar");
  assert(resolveQuestionFocus("WhatsApp number") === "contact_whatsapp", "focus: whatsapp en");
  assert(resolveQuestionFocus("phone number") === "contact_phone", "focus: phone en");

  const phoneSel = selectAllowedFacts({
    serviceId: "yacht-management-360",
    disclosureLevel: 1,
    questionFocus: "contact_phone",
    intent: "CONTACT",
    disclosedFactIds: [],
    language: "ar",
    message: "ممكن رقم الهاتف",
  });
  assert(phoneSel.reason === "contact_phone", "selection: contact_phone reason");
  assert(
    phoneSel.allowedFacts.some((f) => f.text.includes(contact.phoneDisplay)),
    "selection: phone display in facts",
  );
  assert(
    phoneSel.allowedFacts.some((f) => f.id === "contact_phone_available"),
    "selection: phone available fact for denial correction",
  );
  const phonePayload = composeGeminiKnowledge("ar", "", { intent: "CONTACT", factSelection: phoneSel });
  assert(phonePayload.includes(contact.phoneDisplay), "payload: phone display present");
  assert(phonePayload.includes("channels"), "payload: structured channels");

  const waSel = selectAllowedFacts({
    serviceId: "yacht-management-360",
    disclosureLevel: 1,
    questionFocus: "contact_whatsapp",
    intent: "WHATSAPP",
    disclosedFactIds: [],
    language: "ar",
    message: "رقم الواتس",
  });
  assert(waSel.allowedFacts.some((f) => f.text.includes(contact.whatsappUrl)), "selection: whatsapp url");

  const phoneAnalysis = analyzeAgentTurn("ممكن رقم الهاتف", "ar", emptyCustomerContext());
  assert(phoneAnalysis.analysis.intent === "CONTACT", "intent: contact for phone");
  assert(phoneAnalysis.analysis.questionFocus === "contact_phone", "analysis: contact_phone focus");
  assert(phoneAnalysis.context.requestedContactMethod === "phone", "context: phone method");
  assert(phoneAnalysis.analysis.nextBestAction === "ANSWER", "nba: answer for phone not whatsapp");
  assert(
    shouldAttachWhatsApp("NONE", phoneAnalysis.analysis, phoneAnalysis.context) === false,
    "cta: no auto whatsapp on phone request",
  );
  const phonePolish = polishAgentReply({
    reply: "رقمنا للاتصال الصوتي متاح.",
    language: "ar",
    analysis: phoneAnalysis.analysis,
    context: phoneAnalysis.context,
    userMessage: "ممكن رقم الهاتف",
  });
  assert(!replyContainsPublishedWhatsAppUrl(phonePolish.reply), "polish: phone reply does not auto-append whatsapp");

  const waAnalysis = analyzeAgentTurn("رقم الواتس", "ar", emptyCustomerContext());
  assert(waAnalysis.analysis.intent === "WHATSAPP", "intent: whatsapp");
  assert(waAnalysis.context.requestedContactMethod === "whatsapp", "context: whatsapp method");
  assert(waAnalysis.analysis.nextBestAction === "CTA_WHATSAPP", "nba: whatsapp for whatsapp request");
  const waPolish = polishAgentReply({
    reply: "تقدر تتواصل معنا على واتساب.",
    language: "ar",
    analysis: waAnalysis.analysis,
    context: waAnalysis.context,
    userMessage: "رقم الواتس",
  });
  assert(replyContainsPublishedWhatsAppUrl(waPolish.reply), "polish: whatsapp request appends published url");

  const denialAnalysis = analyzeAgentTurn("مفيش رقم اتصال", "ar", emptyCustomerContext());
  assert(denialAnalysis.analysis.questionFocus === "contact_phone", "denial: routes to contact_phone");

  assert(!detectPhoneRequest("رقم الواتس"), "detect: whatsapp is not phone");
  assert(detectWhatsAppRequest("رقم الواتس"), "detect: whatsapp request");
  assert(detectPhoneRequest("ممكن رقم الهاتف"), "detect: phone request");

  // Top1Markting attribution
  const attrMessages = [
    "مين عمل الموقع؟",
    "مين نفذ الموقع؟",
    "مين عمل الشات بوت؟",
    "مين طور الموقع؟",
    "Who built this website?",
    "Who developed the chatbot?",
  ];
  for (const msg of attrMessages) {
    const turn = analyzeAgentTurn(msg, msg.includes("Who") ? "en" : "ar", emptyCustomerContext());
    assert(turn.analysis.intent === "WEBSITE_ATTRIBUTION", `intent: attribution for "${msg}"`);
    const sel = selectAllowedFacts({
      serviceId: "yacht-management-360",
      disclosureLevel: 1,
      questionFocus: "website_attribution",
      intent: "WEBSITE_ATTRIBUTION",
      disclosedFactIds: [],
      language: msg.includes("Who") ? "en" : "ar",
      message: msg,
    });
    assert(sel.allowedFacts.some((f) => f.text.includes("Top1Markting")), `facts: Top1Markting for "${msg}"`);
    assert(
      sel.allowedFacts.some((f) => f.text.includes("top1markting.com")),
      `facts: Top1Markting URL for "${msg}"`,
    );
    assert(sel.allowedFactIds.length === 2, `facts: only approved attribution ids for "${msg}"`);
  }

  // Chatbot identity — Arabic
  for (const msg of [
    "انت مين",
    "إنت مين",
    "أنت مين",
    "مين المساعد",
    "مين الكابتن",
    "هل انت AI",
    "هل أنت ذكاء اصطناعي",
    "هل انت روبوت",
    "شات بوت",
    "الكابتن المساعد",
  ]) {
    assertIdentityRouting(msg, "ar");
  }

  // Chatbot identity — English
  for (const msg of [
    "who are you",
    "are you AI",
    "are you a bot",
    "are you human",
    "chatbot",
    "captain",
  ]) {
    assertIdentityRouting(msg, "en");
  }

  // Yacht intents
  const rental = analyzeAgentTurn("تاجير يخت", "ar", emptyCustomerContext());
  assert(rental.analysis.intent === "YACHT_RENTAL", "intent: yacht rental");
  assert(rental.analysis.questionFocus === "yacht_rental", "focus: yacht rental");
  const rentalSel = selectAllowedFacts({
    serviceId: "yacht-management-360",
    disclosureLevel: 1,
    questionFocus: "yacht_rental",
    intent: "YACHT_RENTAL",
    disclosedFactIds: [],
    language: "ar",
    message: "تاجير يخت",
  });
  assert(rentalSel.allowedFacts.some((f) => f.id === "yacht_rental_not_listed"), "facts: rental not listed");

  const needYacht = analyzeAgentTurn("محتاج يخت", "ar", emptyCustomerContext());
  assert(needYacht.analysis.intent === "YACHT_CLARIFY", "intent: ambiguous yacht need");
  assert(needYacht.analysis.nextBestAction === "CLARIFY", "nba: clarify for ambiguous yacht");

  const ownMgmt = analyzeAgentTurn("أبي أدير يختي", "ar", emptyCustomerContext());
  assert(ownMgmt.context.lastServiceMentioned === "yacht-management-360", "service: manage own yacht");

  // L1 scope budget
  const scope = analyzeAgentTurn("وش تشمل إدارة اليخت؟", "ar", emptyCustomerContext());
  assert(scope.analysis.questionFocus === "scope_overview", "focus: L1 scope preserved");
  const scopeSel = selectAllowedFacts({
    serviceId: "yacht-management-360",
    disclosureLevel: scope.analysis.disclosureLevel,
    questionFocus: scope.analysis.questionFocus,
    intent: scope.analysis.intent,
    disclosedFactIds: [],
    language: "ar",
    message: "وش تشمل إدارة اليخت؟",
  });
  const scopePayload = composeGeminiKnowledge("ar", "", {
    intent: scope.analysis.intent,
    factSelection: scopeSel,
  });
  const ym360FactIdsInPayload = scopeSel.allowedFactIds.filter((id) => id.startsWith("ym360_")).length;
  const hiddenBullets = getAllServiceFactTexts("yacht-management-360", "ar");
  const hiddenBulletProseHits = hiddenBullets.filter((b) => scopePayload.includes(b)).length;
  const hasIncludesArray = scopePayload.includes('"includes"');
  assert(ym360FactIdsInPayload === 0, "L1: ym360FactIdsInPayload === 0");
  assert(hiddenBulletProseHits === 0, "L1: hiddenBulletProseHits === 0");
  assert(hasIncludesArray === false, "L1: hasIncludesArray === false");

  const op = analyzeAgentTurn("وش يشمل من ناحية التشغيل؟", "ar", emptyCustomerContext());
  assert(op.analysis.questionFocus === "operational", "focus: operational preserved");
  const opSel = selectAllowedFacts({
    serviceId: "yacht-management-360",
    disclosureLevel: 3,
    questionFocus: "operational",
    intent: op.analysis.intent,
    disclosedFactIds: [],
    language: "ar",
    message: "وش يشمل من ناحية التشغيل؟",
  });
  assert(!opSel.allowedFacts.some((f) => f.kind === "pricing"), "operational: no pricing at L3");

  const l1Recorded = factIdsToRecord(scopeSel);
  const l2 = selectAllowedFacts({
    serviceId: "yacht-management-360",
    disclosureLevel: 2,
    questionFocus: "progressive_expand",
    intent: "PROGRESSIVE",
    disclosedFactIds: l1Recorded,
    language: "ar",
    message: "وش بعد؟",
  });
  const l2Facts = l2.allowedFactIds.filter((id) => id.startsWith("ym360_"));
  assert(l2Facts.length <= 3, "progressive: وش بعد <= 3 new fact IDs");

  const l2Recorded = [...l1Recorded, ...factIdsToRecord(l2)];
  const l3 = selectAllowedFacts({
    serviceId: "yacht-management-360",
    disclosureLevel: 3,
    questionFocus: "progressive_expand",
    intent: "PROGRESSIVE",
    disclosedFactIds: l2Recorded,
    language: "ar",
    message: "تفاصيل أكثر",
  });
  assert(l3.allowedFactIds.filter((id) => id.startsWith("ym360_")).length <= 3, "progressive: تفاصيل أكثر <= 3 facts");
  assert(!l3.allowedFacts.some((f) => f.kind === "pricing"), "progressive: no pricing unless pricing focus");

  // Greeting variation guidance
  const greetCtx = mergeCustomerContext(emptyCustomerContext(), {
    lastCasualReply: "أهلاً بك يا أحمد. كيف أقدر أساعدك اليوم بخصوص خدمات Lunayair Marina؟",
  });
  const greetTurn = analyzeAgentTurn("ازيك", "ar", greetCtx);
  assert(greetTurn.analysis.intent === "GREETING", "intent: greeting");
  assert(greetTurn.analysis.questionFocus === "casual_greeting", "focus: casual greeting");
  const antiRep = buildAntiRepetitionBlock(greetCtx, "general", 0, "ar");
  assert(antiRep.includes("lastCasualGreetingReply"), "anti-rep: last greeting tracked");
  assert(antiRep.includes("do NOT repeat verbatim"), "anti-rep: variation instruction");

  console.log(`\nContact & attribution: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

run();
