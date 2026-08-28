/**
 * Local Admin Firestore read/write smoke — no secrets logged.
 * Uses FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON from env.
 */
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { randomUUID } from "node:crypto";
import {
  assertFirebaseAdminReady,
  getAdminFirestore,
  probeAdminFirestore,
} from "../src/server/agent/firebaseAdmin";

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dirname, "../.env") });

if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim() && !process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim()) {
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH = resolve(__dirname, "../secrets/firebase-service-account.json");
}

async function main() {
  const probe = await probeAdminFirestore();
  console.log(`ADMIN_ENV_PRESENT=${probe.ADMIN_ENV_PRESENT}`);
  console.log(`ADMIN_JSON_PARSE=${probe.ADMIN_JSON_PARSE}`);
  console.log(`ADMIN_INIT=${probe.ADMIN_INIT}`);
  console.log(`ADMIN_DB=${probe.ADMIN_DB}`);
  console.log(`ADMIN_PROJECT_ID=${probe.ADMIN_PROJECT_ID ?? "null"}`);

  if (!probe.ADMIN_INIT || !probe.ADMIN_DB) {
    console.error(`ADMIN_INIT_ERROR=${probe.ADMIN_INIT_ERROR_MESSAGE ?? "unknown"}`);
    process.exit(1);
  }

  const ready = await assertFirebaseAdminReady();
  console.log(`credentialSource=${ready.credentialSource}`);
  console.log(`projectId=${ready.projectId}`);

  const db = await getAdminFirestore();
  const sessionId = `local_probe_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
  const now = new Date().toISOString();
  const convRef = db.collection("aiConversations").doc(sessionId);

  await convRef.set({
    conversationId: sessionId,
    sessionId,
    language: "ar",
    startedAt: now,
    lastMessageAt: now,
    summary: "local admin probe",
    customerContext: { interests: [] },
    status: "active",
    leadStatus: "handoff",
    visitorName: "Local Probe",
    visitorPhone: "+966500000001",
  });
  console.log(`CONVERSATION_WRITE=PASS sessionId=${sessionId}`);

  await convRef.collection("messages").doc("probe_user_1").set({
    id: "probe_user_1",
    role: "user",
    content: "probe message",
    timestamp: now,
  });
  console.log(`MESSAGE_WRITE=PASS`);

  const readBack = await convRef.get();
  console.log(`CONVERSATION_READ=${readBack.exists ? "PASS" : "FAIL"}`);

  const msgs = await convRef.collection("messages").limit(1).get();
  console.log(`MESSAGE_READ=${msgs.empty ? "FAIL" : "PASS"}`);

  // cleanup probe doc
  const batch = db.batch();
  msgs.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(convRef);
  await batch.commit();
  console.log(`CLEANUP=PASS`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`LOCAL_FIRESTORE=FAIL`);
  console.error(`error=${message.split("\n")[0]}`);
  process.exit(1);
});
