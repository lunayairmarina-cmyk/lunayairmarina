/**
 * Verifies Firestore knowledge + retrieval + conversation context (no Gemini calls).
 * Prefers Firebase Admin SDK when credentials exist; falls back to client count.
 * Run: npx tsx scripts/verify-agent-retrieval.ts
 */
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

import {
  emptyCustomerContext,
  extractContextFromMessage,
  formatCustomerContext,
} from "../src/lib/agent/context";
import { analyzeQuery } from "../src/lib/agent/query";
import {
  hasFirebaseAdminCredentials,
  tryGetAdminFirestore,
} from "../src/server/agent/firebaseAdmin";
import { countKnowledgeDocumentsAdmin } from "../src/server/agent/ingestAdmin";
import {
  buildHistoryContextSnippet,
  resetKnowledgeCacheForTests,
  retrieveKnowledge,
} from "../src/server/agent/retrieve";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
loadEnv({ path: resolve(root, ".env") });

const QUERIES = [
  "في عندكم انستجرام؟",
  "احكيلي عن الشركة",
  "إيه الخدمات اللي بتقدموها؟",
  "اشرحلي إدارة اليخوت 360 بالتفصيل",
  "أنا عندي يخت 80 قدم في جدة، إيه الخدمات المناسبة ليا؟",
  "عندي يخت وعايز إدارة طاقم",
  "إيه الفرق بين إدارة اليخت وإدارة الطاقم؟",
  "هل بتقدموا خدمات لليخوت القادمة للسعودية؟",
  "فين موقعكم؟",
  "إزاي أتواصل معاكم؟",
  "أنا مالك يخت وبصراحة مش عايز أدخل في تفاصيل التشغيل والطاقم والصيانة، إيه الحل اللي عندكم؟",
  // Unexpected / website-grounded matrix
  "إيه أحسن يخت لعيلة 8 أفراد في جدة؟",
  "عندي 80ft وعايز أستخدمه في جدة ومعايا طاقم، إيه الخدمات المناسبة؟",
  "بكام المرسى؟",
  "Is berth availability published for next week?",
  "What is the capital of France?",
  "Tell me about yacht management without using the word management",
];

const EXPECTED_INTENTS: Record<string, string[]> = {
  "في عندكم انستجرام؟": ["social_media"],
  "احكيلي عن الشركة": ["general_company"],
  "إيه الفرق بين إدارة اليخت وإدارة الطاقم؟": ["service_comparison"],
  "إزاي أتواصل معاكم؟": ["contact"],
  "فين موقعكم؟": ["location"],
};

async function countViaAdmin(): Promise<number | null> {
  if (!hasFirebaseAdminCredentials()) return null;
  const db = tryGetAdminFirestore();
  if (!db) return null;
  return countKnowledgeDocumentsAdmin(db);
}

async function main() {
  resetKnowledgeCacheForTests();

  console.log("\n=== FIRESTORE KNOWLEDGE VERIFICATION ===\n");
  console.log(`Admin credentials configured: ${hasFirebaseAdminCredentials() ? "yes" : "no"}`);

  let firestoreCount = 0;
  let countSource = "none";
  try {
    const adminCount = await countViaAdmin();
    if (adminCount !== null) {
      firestoreCount = adminCount;
      countSource = "firestore-admin";
    } else {
      const { initializeApp } = await import("firebase/app");
      const { getFirestore } = await import("firebase/firestore");
      const { countKnowledgeDocuments } = await import("../src/server/agent/knowledgeStore");
      const app = initializeApp({
        apiKey: process.env.VITE_FIREBASE_API_KEY?.trim() || "demo",
        authDomain:
          process.env.VITE_FIREBASE_AUTH_DOMAIN?.trim() || "lunayairmarina-2d694.firebaseapp.com",
        projectId: process.env.VITE_FIREBASE_PROJECT_ID?.trim() || "lunayairmarina-2d694",
        storageBucket:
          process.env.VITE_FIREBASE_STORAGE_BUCKET?.trim() ||
          "lunayairmarina-2d694.firebasestorage.app",
        messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim() || "640687266007",
        appId:
          process.env.VITE_FIREBASE_APP_ID?.trim() || "1:640687266007:web:3effccbfa5897130277892",
      });
      firestoreCount = await countKnowledgeDocuments(getFirestore(app));
      countSource = "firestore-client";
    }
    console.log(`knowledgeDocuments count: ${firestoreCount} (via ${countSource})`);
  } catch (error) {
    console.log(
      `knowledgeDocuments read failed: ${error instanceof Error ? error.message : error}`,
    );
  }

  console.log("\n=== INTENT SMOKE CHECKS ===\n");
  for (const [query, expected] of Object.entries(EXPECTED_INTENTS)) {
    const intent = analyzeQuery(query).intent;
    const ok = expected.includes(intent);
    console.log(`${ok ? "OK" : "FAIL"} | ${query} → ${intent} (expected ${expected.join("|")})`);
  }

  console.log("\n=== RETRIEVAL QUERIES ===\n");
  let anyFirestore = false;
  for (const query of QUERIES) {
    const language = /[A-Za-z]{3,}/.test(query) && !/[\u0600-\u06FF]/.test(query) ? "en" : "ar";
    const result = await retrieveKnowledge(query, language);
    if (!result.fromFallback) anyFirestore = true;
    console.log(`Q: ${query}`);
    console.log(
      `  lang=${language} | intent=${result.analysis.intent} | docs=${result.documents.length} | fallback=${result.fromFallback} | source=${result.diagnostic.knowledgeSource} | pass=${result.diagnostic.retrievalPass} | webSearch=${result.diagnostic.websiteSearchUsed}`,
    );
    console.log(
      `  selected: ${result.diagnostic.selected.map((item) => `${item.type}(${item.score})`).join(", ") || "defaults"}`,
    );
    const top = result.documents[0];
    if (top) {
      console.log(`  top: [${top.type}] ${top.title.slice(0, 60)}`);
      console.log(`  snippet: ${top.content.slice(0, 140).replace(/\n/g, " ")}...`);
    }
    console.log("");
  }

  console.log("=== MULTI-TURN CONTEXT ===\n");
  let context = emptyCustomerContext();
  const turns = ["عندي يخت 80 قدم", "في جدة", "ومحتاج إدارة الطاقم والصيانة", "إيه أنسب خدمة؟"];
  const history: Array<{ role: "user" | "assistant"; content: string }> = [];

  for (const turn of turns) {
    history.push({ role: "user", content: turn });
    context = extractContextFromMessage(turn, "ar", context).context;
    const historyText = buildHistoryContextSnippet(history);
    const result = await retrieveKnowledge(turn, "ar", { context, historyText });
    console.log(`Turn: ${turn}`);
    console.log(`  context: ${formatCustomerContext(context, "ar").replace(/\n/g, " | ")}`);
    console.log(
      `  retrieval: ${result.documents.map((d) => d.type).join(", ")} | intent=${result.analysis.intent}`,
    );
    history.push({ role: "assistant", content: "..." });
  }

  console.log("\n=== DONE ===\n");
  console.log(
    `fromFallback (sample): ${anyFirestore ? "false (at least one Firestore hit)" : "true"}`,
  );
  console.log(`firestoreCount: ${firestoreCount}`);

  if (!hasFirebaseAdminCredentials()) {
    console.warn(
      "BLOCKER: FIREBASE_SERVICE_ACCOUNT_PATH / GOOGLE_APPLICATION_CREDENTIALS not set — cannot verify real ingestion.",
    );
    process.exitCode = 1;
    return;
  }

  if (firestoreCount === 0 || !anyFirestore) {
    console.warn(
      "WARNING: Firestore knowledgeDocuments empty or retrieval still on static fallback.",
    );
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
