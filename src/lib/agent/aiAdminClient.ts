import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  type Firestore,
} from "firebase/firestore";
import type { CustomerContext } from "@/lib/agent/context";
import {
  AI_LEADS_COLLECTION,
  KNOWLEDGE_CANDIDATES_COLLECTION,
  KNOWLEDGE_COLLECTION,
  KNOWLEDGE_SCHEMA_VERSION,
  type AiLeadRecord,
  type AiLeadStatus,
  type KnowledgeCandidateRecord,
  type KnowledgeDocument,
} from "@/lib/agent/types";

function buildLeadId(): string {
  return `lead-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildAiLeadRecord(input: {
  conversationId: string;
  context: CustomerContext;
  phone?: string;
  email?: string;
  name?: string;
}): AiLeadRecord {
  return {
    id: buildLeadId(),
    name: (input.name ?? input.context.name ?? "").slice(0, 120),
    phone: (input.phone ?? "").slice(0, 40),
    email: (input.email ?? "").slice(0, 200),
    yachtType: (input.context.yachtType ?? input.context.customerType ?? "").slice(0, 80),
    yachtLength: (input.context.yachtLength ?? "").slice(0, 40),
    location: (input.context.location ?? "").slice(0, 80),
    serviceInterest: (input.context.interests ?? []).slice(0, 12),
    conversationId: input.conversationId,
    source: "ai_agent",
    status: "new",
    createdAt: new Date().toISOString(),
  };
}

export async function createAiLeadClient(
  db: Firestore,
  record: AiLeadRecord,
): Promise<AiLeadRecord> {
  await setDoc(doc(db, AI_LEADS_COLLECTION, record.id), record);
  return record;
}

export async function updateAiLeadStatusClient(
  db: Firestore,
  id: string,
  status: AiLeadStatus,
): Promise<void> {
  await setDoc(doc(db, AI_LEADS_COLLECTION, id), { status }, { merge: true });
}

export async function listAiLeadsClient(db: Firestore, max = 50): Promise<AiLeadRecord[]> {
  try {
    const snap = await getDocs(
      query(collection(db, AI_LEADS_COLLECTION), orderBy("createdAt", "desc"), limit(max)),
    );
    return snap.docs.map((item) => item.data() as AiLeadRecord);
  } catch {
    const snap = await getDocs(collection(db, AI_LEADS_COLLECTION));
    return snap.docs
      .map((item) => item.data() as AiLeadRecord)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, max);
  }
}

function buildKnowledgeDocId(type: string, slug: string, language: string): string {
  return `${type}-${slug}-${language}`.replace(/[^a-zA-Z0-9_-]+/g, "-").toLowerCase();
}

export async function approveKnowledgeCandidateClient(
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
  await setDoc(doc(db, KNOWLEDGE_COLLECTION, document.id), document, { merge: true });
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
