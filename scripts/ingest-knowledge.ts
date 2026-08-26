/**
 * Builds the Firestore knowledge base from website content (locales + Firestore CMS).
 *
 * Uses Firebase Admin SDK + Service Account (server-only). Does NOT use
 * Firebase Auth email/password, CMS admin accounts, or Gemini credentials.
 *
 * Prerequisites:
 * 1. Create a Firebase service account JSON (Console → Project settings → Service accounts)
 * 2. Store the JSON outside git (or in a gitignored path)
 * 3. Set FIREBASE_SERVICE_ACCOUNT_PATH (and optionally FIREBASE_PROJECT_ID) in .env
 *
 * Run: npm run ingest:knowledge
 * Dry-run (no writes, no Admin credentials required): npm run ingest:knowledge:dry
 */
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

import { assertFirebaseAdminReady, getAdminFirestore } from "../src/server/agent/firebaseAdmin";
import { printIngestionReport } from "../src/server/agent/ingest";
import {
  countKnowledgeDocumentsAdmin,
  runKnowledgeIngestionAdmin,
} from "../src/server/agent/ingestAdmin";
import { buildKnowledgeDocuments, summarizeIngestion } from "../src/server/agent/buildDocuments";
import { loadStaticKnowledgeSourceBundle } from "../src/server/agent/loadSource";
import { loadKnowledgeSourceBundleAdmin } from "../src/server/agent/loadSourceAdmin";
import { resetKnowledgeCacheForTests } from "../src/server/agent/retrieve";

const dryRun = process.argv.includes("--dry-run");

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
loadEnv({ path: resolve(root, ".env") });

async function verifyFirestoreDocuments() {
  const db = await getAdminFirestore();
  const total = await countKnowledgeDocumentsAdmin(db);
  console.log(
    `\n[ingest-knowledge] Firestore verification: ${total} documents in knowledgeDocuments`,
  );
  if (total === 0) {
    throw new Error(
      "[ingest-knowledge] Verification failed — knowledgeDocuments collection is empty.",
    );
  }
  return total;
}

async function main() {
  console.log(`Starting Lunayair knowledge ingestion${dryRun ? " (dry-run)" : ""}...`);

  if (dryRun) {
    // Prefer Admin read when credentials exist; otherwise build from static locales only.
    let documentsReport;
    try {
      await assertFirebaseAdminReady();
      const bundle = await loadKnowledgeSourceBundleAdmin(await getAdminFirestore());
      const { documents, skipped } = buildKnowledgeDocuments(bundle);
      documentsReport = summarizeIngestion(documents, skipped);
      console.log("[ingest-knowledge] Dry-run source: Admin SDK (CMS + locales).");
    } catch {
      const { documents, skipped } = buildKnowledgeDocuments(loadStaticKnowledgeSourceBundle());
      documentsReport = summarizeIngestion(documents, skipped);
      console.log(
        "[ingest-knowledge] Dry-run source: static locales only (Admin credentials not configured).",
      );
    }
    printIngestionReport({ ...documentsReport, removed: 0 });
    console.log("\nDry-run complete — no Firestore writes performed.\n");
    return;
  }

  try {
    const ready = await assertFirebaseAdminReady();
    console.log(
      `[ingest-knowledge] Admin SDK ready (project=${ready.projectId}, credential=${ready.credentialSource}).`,
    );
    const db = await getAdminFirestore();
    const report = await runKnowledgeIngestionAdmin(db);
    printIngestionReport(report);
    const verifiedCount = await verifyFirestoreDocuments();
    console.log(`\nIngestion complete — ${verifiedCount} documents verified in Firestore.\n`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/permission|insufficient|PERMISSION_DENIED/i.test(message)) {
      console.error(`
[ingest-knowledge] Firestore write denied for Admin SDK.

Likely causes:
  1. Wrong Firebase project / service account
  2. Service account lacks Cloud Datastore User / Firebase Admin role
  3. FIREBASE_PROJECT_ID does not match the service account project
`);
    }
    throw error;
  } finally {
    resetKnowledgeCacheForTests();
  }
}

main().catch((error) => {
  console.error("[ingest-knowledge] Failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
