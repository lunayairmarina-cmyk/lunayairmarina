/**
 * Lead capture, identity, phone validation, and personalization tests.
 * Run: npm run test:chatbot-lead
 */
import { buildIdentity, loadChatbotIdentity, saveChatbotIdentity } from "../src/lib/chatbot/identity";
import {
  normalizeSaudiPhone,
  validatePhone,
  validateVisitorName,
} from "../src/lib/chatbot/phone";
import { computeLeadScoreDelta, mergeLeadContext } from "../src/server/chatbot/static/leadScore";
import { applyVisitorName } from "../src/server/chatbot/static/personalizeReply";
import { qualifyLead } from "../src/server/chatbot/static/leadQualification";
import { extractEntities } from "../src/server/chatbot/static/extractEntities";
import { commercialLevel, scoreCommercialIntent } from "../src/server/chatbot/static/commercialScore";
import { emptyCustomerContext } from "../src/lib/agent/context";
import { generateStaticReply } from "../src/server/chatbot/static/generate";

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

// Phone normalization
const p1 = normalizeSaudiPhone("053 156 1212");
assert(p1.normalized === "+966531561212", "normalize 053 format");
assert(validatePhone("0531561212"), "validate 053");

const p2 = normalizeSaudiPhone("+966 53 156 1212");
assert(p2.normalized === "+966531561212", "normalize +966");

const p3 = normalizeSaudiPhone("531561212");
assert(p3.normalized === "+966531561212", "normalize without leading 0");

// Name validation
assert(validateVisitorName("أحمد"), "valid Arabic name");
assert(validateVisitorName("Ahmed Ali"), "valid English name");
assert(!validateVisitorName("A"), "reject single char");
assert(!validateVisitorName("12345"), "reject digits only");

// Lead score
assert(computeLeadScoreDelta("PRICING", extractEntities("بكم")) >= 3, "pricing score");
assert(
  computeLeadScoreDelta("YACHT_MANAGEMENT", extractEntities("عندي يacht")) >= 5,
  "yacht + service score",
);

const ctx = mergeLeadContext(
  emptyCustomerContext(),
  qualifyLead("YACHT_MANAGEMENT", extractEntities("عندي يacht في جدة"), "HIGH"),
  computeLeadScoreDelta("YACHT_MANAGEMENT", extractEntities("عندي يacht في جدة")),
  "YACHT_MANAGEMENT",
  [],
);
assert((ctx.leadScore ?? 0) > 0, "lead score accumulated");
assert(ctx.yachtMentioned === true, "yacht mentioned flag");

// Name personalization
const named = applyVisitorName({
  reply: "نقدم إدارة اليخوت 360°.",
  visitorName: "أحمد",
  language: "ar",
  turnIndex: 0,
  intentId: "YACHT_MANAGEMENT",
  sessionId: "test-session-001",
});
assert(named.includes("أحمد"), "reply uses visitor name");

const namedEn = applyVisitorName({
  reply: "We offer yacht management.",
  visitorName: "Ahmed",
  language: "en",
  turnIndex: 0,
  intentId: "YACHT_MANAGEMENT",
  sessionId: "test-session-002",
});
assert(namedEn.includes("Ahmed"), "english name prefix");

// Static engine with visitor name (no LLM)
const staticReply = generateStaticReply({
  message: "عندي يacht وأبي أحد يديره",
  language: "ar",
  sessionId: "lead-test-session",
  visitorName: "أحمد",
  turnIndex: 0,
});
assert(staticReply.intent === "YACHT_MANAGEMENT", "static intent yacht mgmt");
assert(staticReply.reply.includes("أحمد"), "static reply personalized");

// Commercial score
const cScore = scoreCommercialIntent("عندي يacht 50 متر وأبي إدارة", "YACHT_MANAGEMENT");
assert(
  commercialLevel(cScore) === "HIGH" || commercialLevel(cScore) === "MEDIUM",
  "commercial score level",
);

// Identity round-trip (mock browser localStorage)
const g = globalThis as typeof globalThis & { window?: Window & typeof globalThis };
if (!g.window) {
  g.window = g as unknown as Window & typeof globalThis;
}
if (typeof g.window.localStorage === "undefined") {
  const store = new Map<string, string>();
  g.window.localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
  } as Storage;
}

const identity = buildIdentity({
  sessionId: "testlead12345678",
  name: "أحمد",
  phone: "0531561212",
  language: "ar",
});
saveChatbotIdentity(identity);
const loaded = loadChatbotIdentity();
assert(loaded?.name === "أحمد", "identity name persisted");
assert(loaded?.sessionId === "testlead12345678", "identity session persisted");
assert(loaded?.normalizedPhone === "+966531561212", "identity phone normalized");

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
