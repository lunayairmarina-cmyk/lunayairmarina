import { doc, setDoc, type Firestore } from "firebase/firestore";
import {
  KNOWLEDGE_CANDIDATES_COLLECTION,
  KNOWLEDGE_SCHEMA_VERSION,
  type AgentLanguage,
  type KnowledgeCandidateRecord,
  type KnowledgeDocument,
} from "@/lib/agent/types";
import { buildKnowledgeDocId } from "./normalize";
import { upsertKnowledgeDocuments } from "./knowledgeStore";

export async function createKnowledgeCandidate(
  db: Firestore,
  input: {
    question: string;
    language: AgentLanguage;
    reason: string;
    sourceConversationId: string;
    suggestedAnswer?: string;
  },
): Promise<KnowledgeCandidateRecord> {
  const id = `kc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const record: KnowledgeCandidateRecord = {
    id,
    question: input.question.trim().slice(0, 500),
    language: input.language,
    suggestedAnswer: input.suggestedAnswer?.trim().slice(0, 2000),
    reason: input.reason,
    sourceConversationId: input.sourceConversationId,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  await setDoc(doc(db, KNOWLEDGE_CANDIDATES_COLLECTION, id), record);
  return record;
}

export async function approveKnowledgeCandidate(
  db: Firestore,
  candidate: KnowledgeCandidateRecord,
  approvedAnswer: string,
): Promise<KnowledgeDocument> {
  const document: KnowledgeDocument = {
    id: buildKnowledgeDocId("faq", `approved-${candidate.id}`, candidate.language),
    type: "faq",
    language: candidate.language,
    title: candidate.question,
    content: `Question: ${candidate.question}\nAnswer: ${approvedAnswer}`,
    source: "cms",
    sourcePath: `knowledgeCandidates/${candidate.id}`,
    keywords: candidate.question
      .toLowerCase()
      .split(/\s+/)
      .filter((token) => token.length > 2)
      .slice(0, 20),
    published: true,
    updatedAt: new Date().toISOString(),
    version: KNOWLEDGE_SCHEMA_VERSION,
  };
  await upsertKnowledgeDocuments(db, [document]);
  await setDoc(
    doc(db, KNOWLEDGE_CANDIDATES_COLLECTION, candidate.id),
    {
      ...candidate,
      status: "approved",
      suggestedAnswer: approvedAnswer,
      reviewedAt: new Date().toISOString(),
    },
    { merge: true },
  );
  return document;
}

export function shouldCreateKnowledgeCandidate(input: {
  intent: string;
  retrievedCount: number;
  topScore: number;
  message: string;
}): boolean {
  if (/price|availability|system prompt|api key/i.test(input.message)) return false;
  if (input.intent === "pricing" || input.intent === "availability") return false;
  return input.retrievedCount === 0 || input.topScore < 8;
}

export function estimateAnswerConfidence(
  topScore: number,
  retrievedCount: number,
): "high" | "medium" | "low" {
  if (retrievedCount > 0 && topScore >= 24) return "high";
  if (retrievedCount > 0 && topScore >= 12) return "medium";
  return "low";
}
