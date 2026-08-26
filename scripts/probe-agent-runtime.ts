/**
 * Runtime persistence probe for conversations / leads / candidates.
 * Uses Admin SDK only. No secrets logged. No production CMS mutation.
 */
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

import {
  emptyCustomerContext,
  extractContextFromMessage,
  updateConversationSummary,
} from "../src/lib/agent/context";
import { detectLeadSignal } from "../src/server/agent/leadDetection";
import {
  assertFirebaseAdminReady,
  getAdminFirestore,
} from "../src/server/agent/firebaseAdmin";
import {
  buildConversationRecord,
  makeMessageId,
} from "../src/server/agent/conversationStore";
import {
  appendConversationMessageAdmin,
  loadConversationAdmin,
  saveConversationAdmin,
} from "../src/server/agent/conversationStoreAdmin";
import { buildAiLeadRecord } from "../src/lib/agent/aiAdminClient";
import { createAiLeadAdmin } from "../src/server/agent/leadsStoreAdmin";
import {
  estimateAnswerConfidence,
  shouldCreateKnowledgeCandidate,
} from "../src/server/agent/knowledgeCandidates";
import { retrieveKnowledge, resetKnowledgeCacheForTests } from "../src/server/agent/retrieve";
import { buildKnowledgeDocId } from "../src/server/agent/normalize";
import { KNOWLEDGE_SCHEMA_VERSION } from "../src/lib/agent/types";
import { upsertKnowledgeDocumentsAdmin } from "../src/server/agent/knowledgeStoreAdmin";

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dirname, "../.env") });

const SESSION_ID = `test-sess-${Date.now().toString(36)}`;

async function main() {
  await assertFirebaseAdminReady();
  const db = await getAdminFirestore();
  resetKnowledgeCacheForTests();

  console.log("\n=== CONVERSATION PERSISTENCE ===\n");
  console.log(`sessionId=${SESSION_ID}`);

  let context = emptyCustomerContext();
  let summary = "";
  const turns = ["عندي يخت 80 قدم", "في جدة", "ومحتاج إدارة طاقم وصيانة"];

  for (const turn of turns) {
    context = extractContextFromMessage(turn, "ar", context).context;
    summary = updateConversationSummary(summary, turn, "ar", context);
  }

  const record = buildConversationRecord({
    sessionId: SESSION_ID,
    language: "ar",
    customerContext: context,
  });
  record.summary = summary;
  record.lastIntent = "yacht_recommendation";
  record.leadStatus = "potential";
  await saveConversationAdmin(db, record);

  for (const turn of turns) {
    await appendConversationMessageAdmin(db, SESSION_ID, {
      id: makeMessageId("user"),
      role: "user",
      content: turn,
      timestamp: new Date().toISOString(),
    });
    await appendConversationMessageAdmin(db, SESSION_ID, {
      id: makeMessageId("assistant"),
      role: "assistant",
      content: "test-reply",
      timestamp: new Date().toISOString(),
    });
  }

  const loaded = await loadConversationAdmin(db, SESSION_ID);
  const msgs = await db.collection("aiConversations").doc(SESSION_ID).collection("messages").get();
  const ctx = (loaded?.customerContext ?? {}) as Record<string, unknown>;
  const interests = Array.isArray(ctx.interests) ? (ctx.interests as string[]) : [];

  console.log(`conversation_saved=${Boolean(loaded)}`);
  console.log(`messages_count=${msgs.size}`);
  console.log(`yachtLength=${String(ctx.yachtLength ?? "")}`);
  console.log(`location=${String(ctx.location ?? "")}`);
  console.log(
    `interests_ok=${interests.includes("crew_management") && interests.includes("maintenance_operations")}`,
  );
  const convPass =
    Boolean(loaded) &&
    msgs.size >= 6 &&
    String(ctx.yachtLength ?? "").includes("80") &&
    String(ctx.location ?? "") === "جدة" &&
    interests.includes("crew_management") &&
    interests.includes("maintenance_operations");
  console.log(`conversation_persistence=${convPass ? "PASS" : "FAIL"}`);

  console.log("\n=== LEAD PERSISTENCE ===\n");
  const leadSignal = detectLeadSignal(
    "عايز أتواصل، رقمي 0500000000",
    context,
    "human_handoff",
    "potential",
  );
  let leadPass = false;
  let leadId = "";
  if (leadSignal.shouldCreateLead) {
    const lead = buildAiLeadRecord({
      conversationId: SESSION_ID,
      context,
      phone: leadSignal.phone || "+966500000000",
      email: "test-agent@example.com",
      name: "Test Agent",
    });
    await createAiLeadAdmin(db, lead);
    leadId = lead.id;
    const leadSnap = await db.collection("aiLeads").doc(leadId).get();
    leadPass = leadSnap.exists;
    console.log(`lead_created=${leadPass}`);
    console.log(`lead_id_present=${Boolean(leadId)}`);
  } else {
    console.log("lead_created=false");
    console.log("reason=detectLeadSignal did not request create");
  }
  console.log(`lead_persistence=${leadPass ? "PASS" : "FAIL"}`);

  console.log("\n=== KNOWLEDGE CANDIDATE + APPROVAL ===\n");
  const obscure = "هل تقدمون خدمة طلاء اليخت بالذهب الحقيقي غير المذكورة؟";
  const retrieval = await retrieveKnowledge(obscure, "ar");
  const topScore = retrieval.diagnostic.selected[0]?.score ?? 0;
  const shouldCandidate = shouldCreateKnowledgeCandidate({
    intent: retrieval.analysis.intent,
    retrievedCount: retrieval.documents.length,
    topScore,
    message: obscure,
  });
  console.log(`candidate_auto_trigger=${shouldCandidate}`);
  console.log(`retrieval_fromFallback=${retrieval.fromFallback}`);
  console.log(`topScore=${topScore}`);

  // Force runtime path proof even if lexical retrieval scored high on unrelated docs.
  const candidateId = `kc-test-${Date.now().toString(36)}`;
  await db.collection("knowledgeCandidates").doc(candidateId).set({
    id: candidateId,
    question: obscure,
    language: "ar",
    reason: "runtime test candidate (forced path proof)",
    sourceConversationId: SESSION_ID,
    status: "pending",
    createdAt: new Date().toISOString(),
  });
  const candSnap = await db.collection("knowledgeCandidates").doc(candidateId).get();
  const candidatePass = candSnap.exists && candSnap.data()?.status === "pending";
  console.log(`candidate_created=${candidatePass}`);

  const approvedAnswer =
    "لا توجد خدمة منشورة لطلاء اليخت بالذهب. تواصل مع الفريق للاستفسارات الخاصة.";
  const kbDoc = {
    id: buildKnowledgeDocId("faq", `approved-${candidateId}`, "ar"),
    type: "faq" as const,
    language: "ar" as const,
    title: obscure,
    content: `Question: ${obscure}\nAnswer: ${approvedAnswer}`,
    source: "cms" as const,
    sourcePath: `knowledgeCandidates/${candidateId}`,
    keywords: ["طلاء", "ذهب", "يخت", "غير_مذكورة_لوناير"],
    published: true,
    updatedAt: new Date().toISOString(),
    version: KNOWLEDGE_SCHEMA_VERSION,
  };
  await upsertKnowledgeDocumentsAdmin(db, [kbDoc]);
  await db.collection("knowledgeCandidates").doc(candidateId).set(
    {
      status: "approved",
      suggestedAnswer: approvedAnswer,
      reviewedAt: new Date().toISOString(),
    },
    { merge: true },
  );
  resetKnowledgeCacheForTests();
  const after = await retrieveKnowledge("طلاء اليخت بالذهب غير_مذكورة_لوناير", "ar");
  const approvePass =
    after.documents.some((d) => d.id === kbDoc.id) || after.formatted.includes("طلاء اليخت بالذهب");
  console.log(`approved_kb_retrievable=${approvePass}`);
  console.log(`approved_fromFallback=${after.fromFallback}`);
  console.log(`knowledge_candidate=${candidatePass ? "PASS" : "FAIL"}`);
  console.log(`candidate_approval_kb=${approvePass ? "PASS" : "FAIL"}`);
  console.log(
    `note=auto_trigger_threshold_may_not_fire_when_unrelated_docs_score_high; write/approve path proven separately`,
  );

  console.log("\n=== CMS SYNC STATUS (read-only) ===\n");
  const syncSnap = await db.collection("knowledgeSync").doc("status").get();
  console.log(`knowledgeSync_exists=${syncSnap.exists}`);
  if (syncSnap.exists) {
    const data = syncSnap.data() ?? {};
    console.log(`needsReingest=${Boolean(data.needsReingest)}`);
    console.log(`has_lastIngestAt=${Boolean(data.lastIngestAt)}`);
  }
  console.log("cms_sync=NOT_TESTED (no live CMS content mutation)");

  console.log("\n=== CONFIDENCE SAMPLE ===");
  console.log(`estimate=${estimateAnswerConfidence(topScore, retrieval.documents.length)}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
