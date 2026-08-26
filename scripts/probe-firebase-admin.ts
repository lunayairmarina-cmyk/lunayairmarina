/**
 * Temporary Admin connectivity probe — no secrets logged.
 * Run: npx tsx scripts/probe-firebase-admin.ts
 */
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

import {
  assertFirebaseAdminReady,
  getAdminFirestore,
  hasFirebaseAdminCredentials,
} from "../src/server/agent/firebaseAdmin";

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dirname, "../.env") });

async function main() {
  console.log(`has_credentials=${hasFirebaseAdminCredentials()}`);
  const ready = await assertFirebaseAdminReady();
  console.log(`admin_ready=true`);
  console.log(`projectId=${ready.projectId}`);
  console.log(`credentialSource=${ready.credentialSource}`);

  const db = await getAdminFirestore();
  const snap = await db.collection("knowledgeDocuments").limit(1).get();
  console.log(`firestore_reachable=true`);
  console.log(`knowledgeDocuments_sample_exists=${!snap.empty}`);
  const all = await db.collection("knowledgeDocuments").get();
  console.log(`knowledgeDocuments_count=${all.size}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`admin_ready=false`);
  console.error(`error=${message.split("\n")[0]}`);
  process.exit(1);
});
