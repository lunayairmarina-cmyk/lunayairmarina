/**
 * Phase 5.3 Gemini JSON parse + salvage reliability (no live API).
 * Run: npm run test:json-reliability
 */
import {
  parseGeminiAgentOutput,
  parseGeminiAgentOutputDetailed,
} from "../src/server/chatbot/agent/parseOutput";
import { ensureAssistantReply } from "../src/server/chatbot/geminiFallback";

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

console.log("Phase 5.3 JSON reliability tests\n");

const valid = parseGeminiAgentOutputDetailed(
  JSON.stringify({
    reply: "مرحباً، كيف أقدر أساعدك؟",
    intent: "GREETING",
    commercialScore: 10,
    urgency: "LOW",
    nextBestAction: "ANSWER",
    buyingSignals: [],
    objectionTypes: [],
    disclosureLevel: 0,
    ctaType: "NONE",
  }),
);
assert(valid.status === "valid", "valid JSON parse");
assert(valid.output?.intent === "GREETING", "valid intent preserved");

const fenced = parseGeminiAgentOutputDetailed(
  'Here is the response:\n```json\n{"reply":"Hello from fence","intent":"GENERAL"}\n```',
);
assert(fenced.status === "salvaged", "markdown fence salvaged");
assert(fenced.reply === "Hello from fence", "fence reply extracted");

const wrapped = parseGeminiAgentOutputDetailed(
  'Sure! {"reply":"Wrapped JSON works","intent":"SERVICES","urgency":"LOW"} Hope that helps.',
);
assert(wrapped.status === "salvaged", "wrapped JSON salvaged");

const truncated = parseGeminiAgentOutputDetailed(
  '{"reply":"Truncated but ok","intent":"GENERAL","secondaryIntents":["PRICING"',
);
assert(truncated.status === "salvaged", "truncated JSON repaired");
assert(truncated.reply === "Truncated but ok", "truncated reply ok");

const escaped = parseGeminiAgentOutputDetailed(
  '{"reply":"Line\\nbreak \\"quote\\"","intent":"GENERAL"}',
);
assert(escaped.status === "valid" || escaped.status === "salvaged", "escaped JSON");
assert(escaped.reply?.includes("Line"), "escaped reply decoded");

const wrongTypes = parseGeminiAgentOutputDetailed(
  '{"reply":"Type coerce","commercialScore":"55","disclosureLevel":"2","handoff":"false"}',
);
assert(wrongTypes.status !== "failed", "wrong primitive types coerced");
assert(wrongTypes.output?.commercialScore === 55, "score coerced to number");

const missingOptional = parseGeminiAgentOutputDetailed('{"reply":"Minimal ok"}');
assert(missingOptional.status !== "failed", "missing optional fields ok");
assert(missingOptional.output?.intent === "GENERAL", "default intent");

const emptyReply = parseGeminiAgentOutputDetailed('{"reply":"","intent":"GENERAL"}');
assert(emptyReply.status === "failed", "empty reply is failed not pass");

const emptyInput = parseGeminiAgentOutputDetailed("");
assert(emptyInput.status === "failed", 'empty string input failed');
assert(emptyInput.output === null, "empty string no fake output");

const whitespace = parseGeminiAgentOutputDetailed("   ");
assert(whitespace.status === "failed", "whitespace input failed");

const nullInput = parseGeminiAgentOutputDetailed(null);
assert(nullInput.status === "failed", "null input failed");

const undefinedInput = parseGeminiAgentOutputDetailed(undefined);
assert(undefinedInput.status === "failed", "undefined input failed");

const emptyObject = parseGeminiAgentOutputDetailed("{}");
assert(emptyObject.status === "failed", "empty object failed");

const garbage = parseGeminiAgentOutputDetailed("not json at all");
assert(garbage.status === "failed", "garbage is failed not fake pass");
assert(parseGeminiAgentOutput("not json at all") === null, "garbage returns null");

for (const emptyCase of ["", null, undefined, "   ", {}]) {
  const safe = ensureAssistantReply(
    parseGeminiAgentOutputDetailed(emptyCase).reply,
    "ar",
    "empty",
  );
  assert(safe.trim().length > 0, `ensureAssistantReply never empty for ${String(emptyCase)}`);
}

const replyOnlyRegex = parseGeminiAgentOutputDetailed('{"reply":"Regex salvage","intent":123}');
assert(replyOnlyRegex.status !== "failed", "invalid intent type coerced not failed");
assert(replyOnlyRegex.reply === "Regex salvage", "reply preserved on coerce");

console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
