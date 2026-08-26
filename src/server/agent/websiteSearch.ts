import type { AgentLanguage, KnowledgeDocument, KnowledgeDocumentType } from "@/lib/agent/types";
import {
  expandQueryTokens,
  needsMultiDocumentReasoning,
  type QueryAnalysis,
} from "@/lib/agent/query";
import type { CustomerContext } from "@/lib/agent/context";
import { buildKnowledgeDocuments } from "./buildDocuments";
import { loadStaticKnowledgeSourceBundle } from "./loadSource";
import { loadKnowledgeSourceBundleAdmin } from "./loadSourceAdmin";
import { tryGetAdminFirestore } from "./firebaseAdmin";

export type RetrievalPass = "kb_primary" | "website_expanded" | "website_live";

export interface RetrievalSufficiency {
  sufficient: boolean;
  reason: string;
  needsWebsiteSearch: boolean;
}

const MULTI_DOC_PREFERRED: KnowledgeDocumentType[] = [
  "service",
  "fleet",
  "location",
  "faq",
  "why",
  "contact",
  "about",
];

/** Gate: expected questions stay on primary KB; weak/unexpected → website search. */
export function evaluateRetrievalSufficiency(input: {
  topScore: number;
  selectedCount: number;
  selectedTypes: KnowledgeDocumentType[];
  analysis: QueryAnalysis;
}): RetrievalSufficiency {
  const { topScore, selectedCount, analysis, selectedTypes } = input;
  const multi = needsMultiDocumentReasoning(analysis);
  const typeDiversity = new Set(selectedTypes).size;

  if (selectedCount === 0 || topScore < 8) {
    return {
      sufficient: false,
      reason: "empty_or_very_weak",
      needsWebsiteSearch: true,
    };
  }

  if (topScore < 14) {
    return {
      sufficient: false,
      reason: "low_relevance",
      needsWebsiteSearch: true,
    };
  }

  if (multi && typeDiversity < 2 && topScore < 28) {
    return {
      sufficient: false,
      reason: "needs_multi_document",
      needsWebsiteSearch: true,
    };
  }

  if (analysis.intent === "unknown" && topScore < 18) {
    return {
      sufficient: false,
      reason: "unknown_intent_weak",
      needsWebsiteSearch: true,
    };
  }

  return { sufficient: true, reason: "ok", needsWebsiteSearch: false };
}

export function expandAnalysisForWebsiteSearch(analysis: QueryAnalysis): QueryAnalysis {
  const tokens = expandQueryTokens(analysis.normalized, analysis.tokens);
  const preferredTypes = [
    ...new Set([...analysis.preferredTypes, ...(needsMultiDocumentReasoning(analysis) ? MULTI_DOC_PREFERRED : [])]),
  ];
  return { ...analysis, tokens, preferredTypes };
}

/** Prefer assembling complementary types for multi-entity yacht questions. */
export function assembleMultiDocumentContext(
  ranked: Array<{ doc: KnowledgeDocument; score: number }>,
  analysis: QueryAnalysis,
  maxDocs: number,
): Array<{ doc: KnowledgeDocument; score: number }> {
  if (!needsMultiDocumentReasoning(analysis)) {
    return ranked.slice(0, maxDocs);
  }

  const selected: Array<{ doc: KnowledgeDocument; score: number }> = [];
  const seen = new Set<string>();
  const takeBestOfType = (type: KnowledgeDocumentType) => {
    const hit = ranked.find((item) => item.doc.type === type && !seen.has(item.doc.id));
    if (hit && selected.length < maxDocs) {
      selected.push(hit);
      seen.add(hit.doc.id);
    }
  };

  // Always try to cover complementary sources when entities span size/place/crew/family.
  if (analysis.entities.includes("family-guests") || analysis.intent === "fleet") {
    takeBestOfType("fleet");
  }
  if (analysis.entities.includes("jeddah") || analysis.entities.includes("red-sea")) {
    takeBestOfType("location");
  }
  if (
    analysis.entities.includes("crew-management") ||
    /طاقم|crew/i.test(analysis.normalized)
  ) {
    const crew = ranked.find(
      (item) => item.doc.slug === "crew-management" && !seen.has(item.doc.id),
    );
    if (crew && selected.length < maxDocs) {
      selected.push(crew);
      seen.add(crew.doc.id);
    }
  }
  if (
    analysis.entities.includes("yacht-size") ||
    /صيان|تشغيل|maintenance|operations|اداره/i.test(analysis.normalized)
  ) {
    const ym = ranked.find(
      (item) => item.doc.slug === "yacht-management-360" && !seen.has(item.doc.id),
    );
    if (ym && selected.length < maxDocs) {
      selected.push(ym);
      seen.add(ym.doc.id);
    }
  }

  takeBestOfType("service");
  takeBestOfType("faq");
  takeBestOfType("contact");

  for (const item of ranked) {
    if (selected.length >= maxDocs) break;
    if (seen.has(item.doc.id)) continue;
    selected.push(item);
    seen.add(item.doc.id);
  }

  return selected;
}

let liveWebsiteCache: KnowledgeDocument[] | null = null;
let liveWebsiteCacheAt = 0;
const LIVE_CACHE_TTL_MS = 2 * 60 * 1000;

/**
 * Rebuild searchable website content in-memory from CMS/locales (public sources only).
 * Does not write Firestore; used when stored KB is weak/stale for the question.
 */
export async function loadLiveWebsiteKnowledgeDocuments(): Promise<KnowledgeDocument[]> {
  const now = Date.now();
  if (liveWebsiteCache && now - liveWebsiteCacheAt < LIVE_CACHE_TTL_MS) {
    return liveWebsiteCache;
  }

  try {
    const adminDb = tryGetAdminFirestore();
    const bundle = adminDb
      ? await loadKnowledgeSourceBundleAdmin(adminDb)
      : loadStaticKnowledgeSourceBundle();
    const { documents } = buildKnowledgeDocuments(bundle);
    liveWebsiteCache = documents;
    liveWebsiteCacheAt = now;
    return documents;
  } catch {
    const { documents } = buildKnowledgeDocuments(loadStaticKnowledgeSourceBundle());
    liveWebsiteCache = documents;
    liveWebsiteCacheAt = now;
    return documents;
  }
}

export function resetLiveWebsiteCacheForTests() {
  liveWebsiteCache = null;
  liveWebsiteCacheAt = 0;
}

export function mergeRankedDocuments(
  primary: Array<{ doc: KnowledgeDocument; score: number }>,
  secondary: Array<{ doc: KnowledgeDocument; score: number }>,
  maxDocs: number,
): Array<{ doc: KnowledgeDocument; score: number }> {
  const byId = new Map<string, { doc: KnowledgeDocument; score: number }>();
  for (const item of [...secondary, ...primary]) {
    const existing = byId.get(item.doc.id);
    if (!existing || item.score > existing.score) byId.set(item.doc.id, item);
  }
  return [...byId.values()].sort((a, b) => b.score - a.score).slice(0, maxDocs * 2);
}

export function filterPublicLanguageDocs(
  docs: KnowledgeDocument[],
  language: AgentLanguage,
  allowFallbackLanguage: boolean,
): KnowledgeDocument[] {
  const primary = docs.filter((doc) => doc.language === language && doc.published !== false);
  if (!allowFallbackLanguage || primary.length > 0) return primary;
  const other: AgentLanguage = language === "ar" ? "en" : "ar";
  return docs.filter((doc) => doc.language === other && doc.published !== false);
}

/** Score boost helper used by retrieve website pass (keeps scoring in one place via callback). */
export function applyWebsitePassScoring(
  docs: KnowledgeDocument[],
  analysis: QueryAnalysis,
  language: AgentLanguage,
  context: CustomerContext | undefined,
  scoreFn: (doc: KnowledgeDocument, analysis: QueryAnalysis, context?: CustomerContext) => number,
): Array<{ doc: KnowledgeDocument; score: number }> {
  const expanded = expandAnalysisForWebsiteSearch(analysis);
  return docs
    .map((doc) => {
      let score = scoreFn(doc, expanded, context);
      if (score <= 0) return { doc, score: 0 };
      if (doc.language === language) score += 4;
      if (doc.type === "fleet" && /عائله|عيله|افراد|family|guest/i.test(expanded.normalized)) {
        score += 12;
      }
      if (doc.type === "advertisement" && /اعلان|إعلان|شراك|advert|partner/i.test(expanded.normalized)) {
        score += 14;
      }
      if (doc.type === "testimonial" && /رأي|تجرب|testimonial|review|عميل/i.test(expanded.normalized)) {
        score += 12;
      }
      if (doc.type === "gallery" && /معرض|gallery|صور/i.test(expanded.normalized)) {
        score += 12;
      }
      if (doc.type === "location" && /جدة|jeddah/i.test(expanded.normalized)) {
        score += 10;
      }
      return { doc, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);
}
