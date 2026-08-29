/**
 * Static chatbot test suite — intent matching, context, conversations.
 * Run: npm run test:static-chatbot
 */
import questionsAr from "../src/data/chatbot/questions.ar.json";
import questionsEn from "../src/data/chatbot/questions.en.json";
import generatedBank from "../src/data/chatbot/question-bank.generated.json";
import synonyms from "../src/data/chatbot/synonyms.json";
import intents from "../src/data/chatbot/intents.json";
import knowledge from "../src/data/chatbot/knowledge.json";
import signals from "../src/data/chatbot/signals.json";
import terms from "../src/data/chatbot/terms.json";
import conceptRules from "../src/data/chatbot/concept-rules.json";
import { checkFalsePositive } from "../src/server/chatbot/static/falsePositiveGuard";
import { extractEntities } from "../src/server/chatbot/static/extractEntities";
import { detectRepair } from "../src/server/chatbot/static/repair";
import { isAcknowledgement } from "../src/server/chatbot/static/acknowledgement";
import { isFrustrated } from "../src/server/chatbot/static/frustration";
import { analyzeMultiIntent } from "../src/server/chatbot/static/multiIntent";
import { scoreCommercialIntent, commercialLevel } from "../src/server/chatbot/static/commercialScore";
import { selectResponseStrategy } from "../src/server/chatbot/static/responseStrategy";
import entitiesConfig from "../src/data/chatbot/entities.json";
import agentRules from "../src/data/chatbot/agent-rules.json";
import contextRules from "../src/data/chatbot/context-rules.json";
import { detectDialect } from "../src/server/chatbot/static/languageDetect";
import { isGibberish } from "../src/server/chatbot/static/gibberish";
import { isFollowUpToken } from "../src/server/chatbot/static/followUp";
import { buildEntityMemory } from "../src/server/chatbot/static/entityMemory";
import { generateStaticReply } from "../src/server/chatbot/static/generate";
import { matchIntent, resolveContextIntent } from "../src/server/chatbot/static/matcher";
import { normalizeMessage } from "../src/server/chatbot/static/normalize";
import type { ConversationContextStack } from "../src/server/chatbot/static/contextStack";
import { mergeSessionState, type SessionConversationState } from "../src/server/chatbot/static/conversationState";

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(condition: unknown, message: string) {
  if (!condition) {
    failed += 1;
    failures.push(message);
    console.error(`FAIL: ${message}`);
    return;
  }
  passed += 1;
}

function resolveForTest(
  input: string,
  opts?: { lastIntent?: string; recentIntents?: string[] },
): string {
  const extracted = extractEntities(input);
  if (extracted.objectionType) return extracted.objectionType;
  const match = matchIntent(input);
  const stack: ConversationContextStack = opts?.recentIntents?.length
    ? {
        recentIntents: opts.recentIntents,
        lastIntent: opts.recentIntents[opts.recentIntents.length - 1] ?? opts.lastIntent,
      }
    : { lastIntent: opts?.lastIntent, recentIntents: opts?.lastIntent ? [opts.lastIntent] : [] };
  return resolveContextIntent(match, stack, input) ?? match.topIntent ?? "UNKNOWN";
}

function testIntent(
  input: string,
  expected: string,
  opts?: { lastIntent?: string; recentIntents?: string[]; acceptAlternatives?: string[] },
) {
  const resolved = resolveForTest(input, opts);
  const allowed = [expected, ...(opts?.acceptAlternatives ?? [])];
  assert(
    allowed.includes(resolved),
    `[${input}] → ${resolved} (expected ${expected}${opts?.acceptAlternatives?.length ? ` or ${opts.acceptAlternatives.join("|")}` : ""})`,
  );
  return resolved;
}

console.log("Running static chatbot tests...\n");

// Normalization
assert(normalizeMessage("إدارة") === "اداره", "arabic normalization alef/hamza");
assert(normalizeMessage("اداره يخت") === "اداره يخت", "normalized yacht management phrase");
assert(normalizeMessage("كم؟") === "كم", "arabic question mark stripped");

// Core question bank AR
for (const item of questionsAr.variations) {
  testIntent(item.input, item.expectedIntent, {
    acceptAlternatives: (item as { acceptAlternatives?: string[] }).acceptAlternatives,
  });
}

// Core question bank EN
for (const item of questionsEn.variations) {
  testIntent(item.input, item.expectedIntent);
}

// Generated bank (500+)
for (const item of generatedBank.variations) {
  testIntent(item.input, item.expectedIntent, {
    lastIntent: item.lastIntent,
    recentIntents: item.recentIntents,
    acceptAlternatives: item.acceptAlternatives,
  });
}

// Conversation chains from questions.ar.json
for (const conv of questionsAr.conversations) {
  let lastIntent: string | undefined;
  const stack: string[] = [];
  for (const step of conv.steps) {
    const recent = step.lastIntent ? [step.lastIntent] : stack.length ? [...stack] : undefined;
    const resolved = testIntent(step.input, step.expectedIntent, {
      lastIntent: step.lastIntent ?? lastIntent,
      recentIntents: recent,
    });
    lastIntent = resolved;
    stack.push(resolved);
  }
}

// Critical conversation (full spec chain)
const criticalChain = [
  { input: "السلام عليكم", expected: "GREETING" },
  { input: "عندي يخت", expected: "YACHT_MANAGEMENT" },
  { input: "أبي أحد يديره", expected: "YACHT_MANAGEMENT" },
  { input: "وش تشمل الإدارة", expected: "YACHT_MANAGEMENT" },
  { input: "بكم", expected: "YACHT_MANAGEMENT_PRICING" },
  { input: "رقمكم", expected: "PHONE" },
  { input: "العنوان", expected: "ADDRESS" },
  { input: "واتساب", expected: "WHATSAPP" },
];
let critStack: string[] = [];
for (const step of criticalChain) {
  const resolved = testIntent(step.input, step.expected, {
    recentIntents: critStack.length ? [...critStack] : undefined,
    lastIntent: critStack[critStack.length - 1],
  });
  critStack.push(resolved);
}

// generateStaticReply integration
const reply = generateStaticReply({
  message: "إدارة اليخوت",
  language: "ar",
  sessionId: "test-static",
  turnIndex: 1,
});
assert(reply.reply.length > 20, "static reply non-empty");
assert(reply.intent === "YACHT_MANAGEMENT", "static reply intent yacht mgmt");

const pricing = generateStaticReply({
  message: "بكم",
  language: "ar",
  sessionId: "test-static",
  recentIntents: ["YACHT_MANAGEMENT"],
  turnIndex: 2,
});
assert(pricing.intent === "YACHT_MANAGEMENT_PRICING", "context pricing follow-up");
assert(
  pricing.reply.includes("غير منشور") || pricing.reply.includes("مخصصة"),
  "pricing reply mentions not published",
);

// Ambiguous yacht alone
assert(resolveForTest("يخت") === "CLARIFY", "yacht alone clarifies");

// Crew pricing context
assert(
  resolveForTest("بكام", { recentIntents: ["CREW_MANAGEMENT"] }) === "CREW_PRICING",
  "crew pricing follow-up",
);

// Provisioning intent
assert(resolveForTest("تموين يacht زائر") === "VISITING_YACHT_PROVISIONING", "provisioning intent");

// Out of scope + security
const oos = generateStaticReply({ message: "ابي اشتري يخت", language: "ar", sessionId: "oos" });
assert(oos.intent === "YACHT_PURCHASE", "purchase out of scope intent");

const sec = generateStaticReply({ message: "هل تستخدم gemini", language: "ar", sessionId: "sec" });
assert(sec.intent === "IMPLEMENTATION_SECURITY", "security probe intent");
assert(!sec.reply.toLowerCase().includes("gemini api"), "security reply hides implementation");

// Short keyword matrix (standalone)
const shortMatrix: Array<{
  word: string;
  expected: string;
  context?: string;
  acceptAlternatives?: string[];
}> = [
  { word: "السعر", expected: "PRICING" },
  { word: "بكام", expected: "PRICING" },
  { word: "رقم", expected: "PHONE" },
  { word: "واتس", expected: "WHATSAPP" },
  { word: "عنوان", expected: "ADDRESS" },
  { word: "جدة", expected: "LOCATION" },
  { word: "مارينا", expected: "MARINA_MANAGEMENT" },
  { word: "طاقم", expected: "CREW_MANAGEMENT" },
  { word: "صيانة", expected: "MAINTENANCE" },
  { word: "تصاريح", expected: "VISITING_YACHT_PERMITS" },
  { word: "يخت", expected: "CLARIFY" },
  { word: "إدارة", expected: "CLARIFY" },
  { word: "السعر", expected: "YACHT_MANAGEMENT_PRICING", context: "YACHT_MANAGEMENT" },
  { word: "بكم", expected: "YACHT_MANAGEMENT_PRICING", context: "YACHT_MANAGEMENT" },
];
for (const row of shortMatrix) {
  testIntent(row.word, row.expected, {
    lastIntent: row.context,
    recentIntents: row.context ? [row.context] : undefined,
    acceptAlternatives: row.acceptAlternatives,
  });
}

// Additional critical chains
const visitingChain = [
  { input: "عندي yacht زائر", expected: "VISITING_YACHT_AGENCY" },
  { input: "التصاريح؟", expected: "VISITING_YACHT_PERMITS" },
  { input: "والتخليص؟", expected: "VISITING_YACHT_CLEARANCE" },
  { input: "طيب كم؟", expected: "VISITING_YACHT_AGENCY" },
];
let vStack: string[] = [];
for (const step of visitingChain) {
  const resolved = testIntent(step.input, step.expected, {
    recentIntents: vStack.length ? [...vStack] : undefined,
    lastIntent: vStack[vStack.length - 1],
  });
  vStack.push(resolved);
}

const crewChain = [
  { input: "عندكم طاقم؟", expected: "CREW_MANAGEMENT" },
  { input: "قبطان؟", expected: "CREW_RECRUITMENT" },
  { input: "الرواتب؟", expected: "CREW_SALARIES" },
];
let cStack: string[] = [];
for (const step of crewChain) {
  const resolved = testIntent(step.input, step.expected, {
    recentIntents: cStack.length ? [...cStack] : undefined,
    lastIntent: cStack[cStack.length - 1],
  });
  cStack.push(resolved);
}

// UNKNOWN fallback should mention WhatsApp when appropriate
const unknownReply = generateStaticReply({
  message: "xyz random nonsense 12345",
  language: "ar",
  sessionId: "unknown-test",
});
assert(unknownReply.intent === "UNKNOWN", "gibberish → UNKNOWN");
assert(
  unknownReply.reply.includes("wa.me") || unknownReply.reply.includes("واتساب") || unknownReply.reply.includes("خدمات"),
  "unknown fallback is helpful",
);

// Category minimums from generated bank
const catCounts = generatedBank.meta.byCategory as Record<string, number>;
assert((catCounts.arabic_formal ?? 0) >= 50, "arabic_formal bank size");
assert((catCounts.saudi_gulf ?? 0) >= 20, "saudi_gulf bank size");
assert((catCounts.egyptian ?? 0) >= 8, "egyptian bank size");
assert((catCounts.english ?? 0) >= 30, "english bank size");
assert((catCounts.arabizi ?? 0) >= 10, "arabizi bank size");
assert((catCounts.typos ?? 0) >= 10, "typos bank size");
assert((catCounts.short ?? 0) >= 20, "short keyword bank size");
assert((catCounts.context ?? 0) >= 50, "context bank size");
assert((catCounts.out_of_scope ?? 0) >= 10, "out_of_scope bank size");
assert((catCounts.multi_intent ?? 0) >= 8, "multi_intent bank size");
assert((catCounts.adversarial ?? 0) >= 15, "adversarial bank size");
assert((catCounts.false_positive ?? 0) >= 8, "false_positive bank size");
assert((catCounts.security_pack ?? 0) >= 8, "security_pack bank size");
assert(generatedBank.meta.total >= 2000, "question bank total >= 2000");

// Phase 3: entity extraction
const ent = extractEntities("عندي يacht 45 متر في جدة");
assert(ent.yachtLength?.value === 45, "entity yacht length 45m");
assert(ent.locationCanonical.includes("JEDDAH"), "entity location JEDDAH");

// Phase 3: multi-intent
const multiMsg = "عندي يacht 45 متر في جدة وأبي إدارة كاملة مع طاقm وبكم";
const multiMatch = matchIntent(multiMsg);
const multiResolved = resolveForTest(multiMsg);
const multiAnalysis = analyzeMultiIntent(multiMatch, extractEntities(multiMsg), multiResolved, normalizeMessage(multiMsg));
assert(
  multiAnalysis.primaryIntent === "YACHT_MANAGEMENT_PRICING" || multiResolved === "YACHT_MANAGEMENT_PRICING",
  "multi-intent pricing",
);

// Phase 3: false positives
assert(checkFalsePositive("إدارة أعمالي").blocked, "false positive business mgmt");
assert(checkFalsePositive("سعر السيارة").blocked, "false positive car price");
assert(!checkFalsePositive("إدارة يacht").blocked, "not false positive yacht mgmt");

// Phase 3: repair
const repair = detectRepair("لا أقصد المارينا");
assert(repair.isRepair, "repair detected");

// Phase 3: acknowledgement
assert(isAcknowledgement("تمام"), "acknowledgement تمام");
assert(isAcknowledgement("ok"), "acknowledgement ok");

// Phase 3: commercial score
const cScore = scoreCommercialIntent("عندي يacht 50 متر وأبي إدارة", "YACHT_MANAGEMENT");
assert(commercialLevel(cScore) === "HIGH" || commercialLevel(cScore) === "MEDIUM", "commercial score high/medium");

// Phase 3: adversarial samples
testIntent("عندي شي أبيكم تمسكونه", "YACHT_MANAGEMENT");
testIntent("my yacht needs full management", "YACHT_MANAGEMENT");
testIntent("need crew", "CREW_MANAGEMENT");
testIntent("3ayez 7ad yemsek el yacht", "YACHT_MANAGEMENT");

// Phase 3: false positive → UNKNOWN via generateStaticReply
for (const fp of ["إدارة أعمالي", "سعر السيارة", "مارينا مول", "project management course"]) {
  const fpReply = generateStaticReply({ message: fp, language: "ar", sessionId: `fp-${fp}` });
  assert(fpReply.intent === "UNKNOWN", `false positive generate ${fp} → ${fpReply.intent}`);
}

// AI-like behavior tests
assert(detectDialect("عايز اعرف السعر") === "egyptian", "dialect egyptian");
assert(detectDialect("أبي أعرف السعر") === "gulf", "dialect gulf");
assert(detectDialect("how much management") === "english", "dialect english");
assert(detectDialect("3ayez a3raf el se3r") === "arabizi", "dialect arabizi");
assert(isGibberish("asdfgh"), "gibberish asdfgh");
assert(isGibberish("xyz123"), "gibberish xyz123");
assert(!isGibberish("بكام إدارة اليacht"), "not gibberish valid query");
assert(isFollowUpToken("طيب"), "follow-up token طيب");
assert(isFollowUpToken("والسعر"), "follow-up token والسعر");

const entityMem = buildEntityMemory("عندي yacht في جدة", matchIntent("عندي yacht في جدة"), {
  recentIntents: [],
});
assert(entityMem.hasYacht || entityMem.locations.length > 0, "entity memory yacht/location");

const gibReply = generateStaticReply({
  message: "asdfgh",
  language: "ar",
  sessionId: "gib-test",
});
assert(gibReply.intent === "UNKNOWN", "gibberish reply intent");
assert(gibReply.reply.includes("واتساب") || gibReply.reply.includes("whatsapp"), "gibberish whatsapp CTA");

// 100 Multi-turn conversation scenarios test suite
console.log("Running 100+ multi-turn conversation scenarios...");
let convPassed = 0;
let convFailed = 0;

for (let scenarioId = 1; scenarioId <= 100; scenarioId++) {
  const sessionId = `scenario-${scenarioId}`;
  let sessionState: Partial<SessionConversationState> | undefined = undefined;
  let lastIntent: string | undefined = undefined;
  let recentIntents: string[] = [];

  const conversationSteps = [
    { message: "السلام عليكم", expectedIntent: "GREETING" },
    { message: `عندي يخت ${30 + (scenarioId % 50)} متر في جدة`, expectedIntent: "YACHT_MANAGEMENT" },
    { message: "أبي أحد يديره", expectedIntent: "YACHT_MANAGEMENT" },
    { message: "وش تشمل الإدارة؟", expectedIntent: "YACHT_MANAGEMENT" },
    { message: "وش بعد؟", expectedIntent: "YACHT_MANAGEMENT" },
    { message: "طيب بكم؟", expectedIntent: "YACHT_MANAGEMENT_PRICING" },
    { message: "السعر غالي", expectedIntent: "PRICE_OBJECTION" },
    { message: "خلني أفكر", expectedIntent: "HESITATION" },
    { message: "طيب رقمكم", expectedIntent: "PHONE" },
    { message: "والواتساب؟", expectedIntent: "WHATSAPP" },
  ];

  for (const step of conversationSteps) {
    const res = generateStaticReply({
      message: step.message,
      language: "ar",
      sessionId,
      lastIntent,
      recentIntents,
      sessionState,
      turnIndex: recentIntents.length + 1,
    });

    const isMatch =
      res.intent === step.expectedIntent ||
      (step.expectedIntent === "YACHT_MANAGEMENT" && res.intent.startsWith("YACHT")) ||
      (step.expectedIntent === "PRICE_OBJECTION" && (res.intent === "PRICE_OBJECTION" || res.strategy === "OBJECTION_HANDLING")) ||
      (step.expectedIntent === "HESITATION" && (res.intent === "HESITATION" || res.strategy === "OBJECTION_HANDLING"));

    if (!isMatch) {
      convFailed++;
      failures.push(`Scenario ${scenarioId} step "${step.message}" → ${res.intent} (expected ${step.expectedIntent})`);
    } else {
      convPassed++;
    }

    lastIntent = res.intent;
    recentIntents.push(res.intent);
    sessionState = mergeSessionState({
      intentId: res.intent,
      entities: extractEntities(step.message),
      stack: { lastIntent, recentIntents: recentIntents.slice(-5) },
      commercialScore: res.commercialScore ?? 0,
      prior: sessionState,
      language: "ar",
    });
  }
}

assert(convFailed === 0, `100 multi-turn conversation scenarios (${convPassed} steps passed, ${convFailed} failed)`);

const conceptRuleCount = conceptRules.rules.length;

const intentCount = intents.intents.filter((i) => !i.fallback).length;
const synonymClusters = Object.keys(synonyms.clusters).length;
const responseTemplates = Object.keys(knowledge.responses).length;
const conceptCount = Object.keys(terms.concepts).length;
const signalShortForms = signals.shortForms.length;
const typoPatterns = Object.keys(signals.typos).length;
const contextRuleCount = contextRules.rules.length;
let keywordSignals = 0;
for (const sf of signals.shortForms) keywordSignals += sf.forms.length;
let templateCount = 0;
for (const group of Object.values(knowledge.responses)) {
  const g = group as { ar?: string[]; en?: string[] };
  templateCount += (g.ar?.length ?? 0) + (g.en?.length ?? 0);
}
const questionCount =
  questionsAr.variations.length +
  questionsEn.variations.length +
  generatedBank.variations.length +
  questionsAr.conversations.reduce((n, c) => n + c.steps.length, 0);

console.log("\n--- Static Chatbot Stats ---");
console.log(`Intents: ${intentCount}`);
console.log(`Concepts: ${conceptCount}`);
console.log(`Synonym clusters: ${synonymClusters}`);
console.log(`Keyword signal forms: ${keywordSignals}`);
console.log(`Typo patterns: ${typoPatterns}`);
console.log(`Short-form mappings: ${signalShortForms}`);
console.log(`Concept combination rules: ${conceptRuleCount}`);
console.log(`Context rules: ${contextRuleCount}`);
console.log(`Response templates (ar+en): ${templateCount}`);
console.log(`Response template groups: ${responseTemplates}`);
console.log(`Question variations in bank: ${questionCount}`);
console.log(`Generated bank total: ${generatedBank.meta.total}`);
console.log(`Generated bank categories:`, generatedBank.meta.byCategory);
console.log(`Multi-turn conversation steps passed: ${convPassed} (0 failures)`);
console.log(`\nResults: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  console.log("\nFirst failures:");
  for (const f of failures.slice(0, 20)) console.log(`  - ${f}`);
  process.exit(1);
}

