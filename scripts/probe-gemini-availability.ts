/** Quick Gemini availability probe — exit 0=ok, 1=quota/block, 2=no key */
import { config as loadEnv } from "dotenv";
loadEnv();
import { emptyCustomerContext } from "../src/lib/agent/context";
import { getChatbotConfig } from "../src/server/chatbot/config";
import { generateAgentTurn, GeminiServiceError } from "../src/server/chatbot/gemini";

const cfg = getChatbotConfig();
if (!cfg.geminiApiKey) {
  console.log("NO_API_KEY");
  process.exit(2);
}
try {
  const turn = await generateAgentTurn(cfg, "en", "hi", [], "", {
    conversationSummary: "",
    customerContext: emptyCustomerContext(),
    agentStateBlock: "intent=GREETING",
  });
  console.log("GEMINI_AVAILABLE");
  console.log("reply_len", turn.reply?.length ?? 0);
  process.exit(0);
} catch (error) {
  const msg = error instanceof Error ? error.message : String(error);
  const kind = error instanceof GeminiServiceError ? error.kind : "unknown";
  if (/429|quota|RESOURCE_EXHAUSTED/i.test(msg) || kind === "quota") {
    console.log("GEMINI_QUOTA_BLOCKED");
    console.log(msg.slice(0, 200));
    process.exit(1);
  }
  console.log("GEMINI_ERROR", kind, msg.slice(0, 200));
  process.exit(1);
}
