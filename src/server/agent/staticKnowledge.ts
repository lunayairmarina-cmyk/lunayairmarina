import type { KnowledgeDocument } from "@/lib/agent/types";
import { buildKnowledgeDocuments } from "./buildDocuments";
import { loadStaticKnowledgeSourceBundle } from "./loadSource";

let cachedStaticDocuments: KnowledgeDocument[] | null = null;

/** Full website knowledge from locales + canonical fallbacks — no Firestore required. */
export function getStaticKnowledgeDocuments(): KnowledgeDocument[] {
  if (!cachedStaticDocuments) {
    const bundle = loadStaticKnowledgeSourceBundle();
    cachedStaticDocuments = buildKnowledgeDocuments(bundle).documents;
  }
  return cachedStaticDocuments;
}

export function resetStaticKnowledgeCacheForTests() {
  cachedStaticDocuments = null;
}
