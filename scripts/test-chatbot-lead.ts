/**
 * Lead capture, identity, phone validation tests.
 * Run: npm run test:chatbot-lead
 */
import { buildIdentity, loadChatbotIdentity, saveChatbotIdentity } from "../src/lib/chatbot/identity";
import {
  normalizeSaudiPhone,
  validatePhone,
  validateVisitorName,
} from "../src/lib/chatbot/phone";
import { emptyCustomerContext, extractContextFromMessage } from "../src/lib/agent/context";
import { leadPatchFromContext } from "../src/server/chatbot/leadPatch";
import { detectLeadSignal } from "../src/server/agent/leadDetection";

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

const p1 = normalizeSaudiPhone("053 156 1212");
assert(p1.normalized === "+966531561212", "normalize 053 format");
assert(validatePhone("0531561212"), "validate 053");

const p2 = normalizeSaudiPhone("+966 53 156 1212");
assert(p2.normalized === "+966531561212", "normalize +966");

const p3 = normalizeSaudiPhone("531561212");
assert(p3.normalized === "+966531561212", "normalize without leading 0");

assert(validateVisitorName("أحمد"), "valid Arabic name");
assert(validateVisitorName("Ahmed Ali"), "valid English name");
assert(!validateVisitorName("A"), "reject single char");
assert(!validateVisitorName("12345"), "reject digits only");

let ctx = emptyCustomerContext();
ctx = extractContextFromMessage("عندي يخت 45 متر في جدة وأبي إدارة", "ar", ctx).context;
assert(ctx.yachtLength?.includes("45"), "yacht length extracted");
assert(ctx.location === "جدة", "Jeddah extracted");
assert(ctx.yachtMentioned === true, "yacht mentioned flag");

const patch = leadPatchFromContext({ ...ctx, phone: "0531561212", name: "أحمد" }, "services");
assert(patch.location === "جدة", "lead patch keeps location");
assert(patch.yachtMentioned === true, "lead patch keeps yacht flag");

const lead = detectLeadSignal("محتاج حد يتولى التشغيل", ctx, "services", "none");
assert(lead.leadStatus === "potential" || lead.shouldOfferHandoff, "buying intent is a lead signal");

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
