/**
 * One-time cleanup: delete all aiConversations (+ messages subcollection, linked leads).
 * Run: npx tsx scripts/clear-ai-conversations.ts
 */
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

import { deleteAllConversationsAdmin } from "../src/server/agent/conversationStoreAdmin";
import { getAdminFirestore, hasFirebaseAdminCredentials } from "../src/server/agent/firebaseAdmin";

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dirname, "../.env") });

async function main() {
  if (!hasFirebaseAdminCredentials()) {
    console.error("missing_firebase_admin_credentials");
    process.exit(1);
  }
  const db = await getAdminFirestore();
  const deleted = await deleteAllConversationsAdmin(db);
  console.log(`deleted_conversations=${deleted}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`clear_failed=${message.split("\n")[0]}`);
  process.exit(1);
});
