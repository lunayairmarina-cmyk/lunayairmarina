/**
 * Full chatbot reset: conversations, leads, and visitor identity epoch bump.
 * Run: npx tsx scripts/clear-ai-conversations.ts
 */
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

import { clearAllChatbotVisitorDataAdmin } from "../src/server/agent/chatbotResetAdmin";
import { getAdminFirestore, hasFirebaseAdminCredentials } from "../src/server/agent/firebaseAdmin";

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dirname, "../.env") });

async function main() {
  if (!hasFirebaseAdminCredentials()) {
    console.error("missing_firebase_admin_credentials");
    process.exit(1);
  }
  const db = await getAdminFirestore();
  const result = await clearAllChatbotVisitorDataAdmin(db);
  console.log(`deleted_conversations=${result.conversations}`);
  console.log(`deleted_leads=${result.leads}`);
  console.log(`identity_reset_epoch=${result.identityResetEpoch}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`clear_failed=${message.split("\n")[0]}`);
  process.exit(1);
});
