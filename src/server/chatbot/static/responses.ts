import type { ChatbotLanguage } from "@/data/chatbot/loadKnowledge";

import { getStaticKnowledgeBundle } from "@/data/chatbot/loadKnowledge";

import type { DialectHint } from "./languageDetect";

import type { MatchResult } from "./matcher";



export interface ResponseSelectionInput {

  language: ChatbotLanguage;

  intentId: string;

  sessionId?: string;

  turnIndex?: number;

  ambiguousKey?: string;

  match?: MatchResult;

  dialect?: DialectHint;

  appendCta?: boolean;

  appendProgressive?: boolean;

}



const lastTemplateBySession = new Map<string, { intentId: string; index: number }>();



function hashPick(seed: string, count: number): number {

  let h = 0;

  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) | 0;

  return Math.abs(h) % count;

}



function pickVariantIndex(

  sessionId: string,

  intentId: string,

  turnIndex: number,

  count: number,

  dialect?: DialectHint,

): number {

  if (count <= 1) return 0;

  const seed = `${sessionId}-${intentId}-${turnIndex}-${dialect ?? "std"}`;

  let idx = hashPick(seed, count);

  const prev = lastTemplateBySession.get(sessionId);

  if (prev && prev.intentId === intentId && prev.index === idx) {

    idx = (idx + 1) % count;

  }

  lastTemplateBySession.set(sessionId, { intentId, index: idx });

  return idx;

}



function applyPlaceholders(text: string, placeholders: Record<string, string>): string {

  return text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => placeholders[key] ?? "");

}



function getVariants(

  intentId: string,

  language: ChatbotLanguage,

  dialect?: DialectHint,

): string[] {

  const bundle = getStaticKnowledgeBundle();

  const responses = bundle.knowledge.responses[intentId];

  if (!responses) return [];



  const kb = bundle.knowledge as typeof bundle.knowledge & {

    dialectVariants?: Record<string, { ar_gulf?: string[]; ar_egypt?: string[] }>;

  };

  const dialectPack = kb.dialectVariants?.[intentId];



  if (language === "ar" && dialect === "gulf" && dialectPack?.ar_gulf?.length) {

    return dialectPack.ar_gulf;

  }

  if (language === "ar" && dialect === "egyptian" && dialectPack?.ar_egypt?.length) {

    return dialectPack.ar_egypt;

  }



  return responses[language] ?? responses.en ?? [];

}



export function selectResponse(input: ResponseSelectionInput): string {

  const bundle = getStaticKnowledgeBundle();

  const {

    language,

    intentId,

    sessionId = "s",

    turnIndex = 0,

    ambiguousKey,

    dialect,

    appendCta = false,

    appendProgressive = false,

  } = input;



  if (intentId === "CLARIFY" && ambiguousKey) {

    const clar = bundle.ambiguous.clarifications[ambiguousKey];

    if (clar) {

      const variants = clar[language] ?? clar.en ?? [];

      if (variants.length) {

        const idx = pickVariantIndex(sessionId, `CLARIFY-${ambiguousKey}`, turnIndex, variants.length, dialect);

        return variants[idx]!;

      }

    }

  }



  const responses = bundle.knowledge.responses[intentId];

  if (!responses) {

    const fallback = bundle.knowledge.responses.UNKNOWN ?? bundle.knowledge.responses.GIBBERISH;

    const variants = fallback?.[language] ?? fallback?.en ?? [];

    const idx = pickVariantIndex(sessionId, "UNKNOWN", turnIndex, variants.length, dialect);

    return applyPlaceholders(variants[idx] ?? variants[0] ?? "", bundle.knowledge.placeholders);

  }



  const variants = getVariants(intentId, language, dialect);

  if (!variants.length) return "";



  const idx = pickVariantIndex(sessionId, intentId, turnIndex, variants.length, dialect);

  let raw = variants[idx] ?? variants[0]!;

  raw = applyPlaceholders(raw, bundle.knowledge.placeholders);



  const kb = bundle.knowledge as typeof bundle.knowledge & {

    ctas?: { commercial_ar?: string[]; commercial_en?: string[] };

    progressive?: Record<string, { ar?: string[]; en?: string[] }>;

  };



  if (appendProgressive && kb.progressive?.[intentId]) {

    const hints = kb.progressive[intentId]![language] ?? kb.progressive[intentId]!.en ?? [];

    if (hints.length) {

      const hidx = hashPick(`${sessionId}-prog-${intentId}`, hints.length);

      raw = `${raw}\n\n${hints[hidx]}`;

    }

  }



  if (appendCta && kb.ctas) {

    const ctas = language === "ar" ? kb.ctas.commercial_ar : kb.ctas.commercial_en;

    if (ctas?.length) {

      const cidx = hashPick(`${sessionId}-cta-${intentId}`, ctas.length);

      raw = `${raw}\n\n${applyPlaceholders(ctas[cidx]!, bundle.knowledge.placeholders)}`;

    }

  }



  return raw;

}



export function confidenceFromScore(

  score: number,

  threshold: number,

): "high" | "medium" | "low" {

  if (score >= threshold * 2) return "high";

  if (score >= threshold) return "medium";

  return "low";

}



export function isCommercialIntent(intentId: string, bundle = getStaticKnowledgeBundle()): boolean {

  return bundle.conceptRules.commercialIntents.includes(intentId);

}


