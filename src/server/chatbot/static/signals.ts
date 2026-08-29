import type { StaticKnowledgeBundle } from "@/data/chatbot/loadKnowledge";
import { getStaticKnowledgeBundle } from "@/data/chatbot/loadKnowledge";
import { fuzzyTokenMatch } from "./fuzzy";
import { normalizeMessage, tokenize } from "./normalize";

export interface SignalHit {
  signalId: string;
  intent?: string;
  concepts: string[];
  clusters: string[];
  ambiguousAlone?: boolean;
  ambiguousKey?: string;
  defaultIntent?: string;
  matchedForm: string;
  fuzzy?: boolean;
}

export interface ExtractedSignals {
  tokens: string[];
  normalized: string;
  concepts: Set<string>;
  clusters: Set<string>;
  hits: SignalHit[];
  typoApplied: string[];
}

function stripFillers(normalized: string, fillers: string[]): string {
  let tokens = tokenize(normalized);
  const fillerSet = new Set(fillers.map((f) => normalizeMessage(f)));
  tokens = tokens.filter((t) => !fillerSet.has(t) && t !== "و" && t !== "fa" && t !== "wa");
  return tokens.join(" ");
}

function applyTypos(tokens: string[], typos: Record<string, string>): { tokens: string[]; applied: string[] } {
  const applied: string[] = [];
  const out = tokens.map((t) => {
    const mapped = typos[t];
    if (mapped) {
      applied.push(`${t}->${mapped}`);
      return normalizeMessage(mapped);
    }
    return t;
  });
  return { tokens: out, applied };
}

function matchShortForms(
  bundle: StaticKnowledgeBundle,
  tokens: string[],
  fuzzyCfg: { enabled: boolean; maxDistance: number; minLength: number },
): SignalHit[] {
  const hits: SignalHit[] = [];

  for (const token of tokens) {
    for (const sf of bundle.signals.shortForms) {
      const forms = sf.forms.map((f) => normalizeMessage(f));
      let matched: string | undefined;
      if (forms.includes(token)) matched = token;
      else if (fuzzyCfg.enabled) {
        const fuzzy = fuzzyTokenMatch(token, forms, fuzzyCfg.maxDistance, fuzzyCfg.minLength);
        if (fuzzy) matched = fuzzy;
      }
      if (!matched) continue;
      if (sf.ambiguousAlone && tokens.length > 1) continue;
      hits.push({
        signalId: sf.id,
        intent: sf.intent,
        concepts: sf.concepts ?? [],
        clusters: sf.clusters ?? [],
        ambiguousAlone: sf.ambiguousAlone,
        ambiguousKey: sf.ambiguousKey,
        defaultIntent: sf.defaultIntent,
        matchedForm: matched,
        fuzzy: matched !== token,
      });
      break;
    }
  }

  const joined = tokens.join(" ");
  for (const sf of bundle.signals.shortForms) {
    for (const f of sf.forms) {
      const nf = normalizeMessage(f);
      if (!nf.includes(" ")) continue;
      const phraseMatch =
        joined === nf ||
        joined.startsWith(`${nf} `) ||
        joined.endsWith(` ${nf}`) ||
        joined.includes(` ${nf} `);
      if (phraseMatch) {
        hits.push({
          signalId: sf.id,
          intent: sf.intent,
          concepts: sf.concepts ?? [],
          clusters: sf.clusters ?? [],
          ambiguousAlone: sf.ambiguousAlone,
          ambiguousKey: sf.ambiguousKey,
          defaultIntent: sf.defaultIntent,
          matchedForm: nf,
        });
        break;
      }
    }
  }

  return hits;
}

export function extractSignals(message: string, bundle = getStaticKnowledgeBundle()): ExtractedSignals {
  const raw = message.trim();
  if (raw === "$$" || raw === "$") {
    return {
      tokens: ["price"],
      normalized: "price",
      concepts: new Set(["price"]),
      clusters: new Set(["pricing"]),
      hits: [
        {
          signalId: "pricing",
          intent: "PRICING",
          concepts: ["price"],
          clusters: ["pricing"],
          ambiguousAlone: true,
          defaultIntent: "PRICING",
          matchedForm: "$$",
        },
      ],
      typoApplied: [],
    };
  }

  let normalized = normalizeMessage(message);
  normalized = stripFillers(normalized, bundle.signals.fillers);
  let tokens = tokenize(normalized);
  const typoResult = applyTypos(tokens, bundle.signals.typos);
  tokens = typoResult.tokens;
  normalized = tokens.join(" ");

  const hits = matchShortForms(bundle, tokens, bundle.signals.fuzzy);
  const concepts = new Set<string>();
  const clusters = new Set<string>();
  for (const h of hits) {
    for (const c of h.concepts) concepts.add(c);
    for (const c of h.clusters) clusters.add(c);
  }

  for (const [concept, variants] of Object.entries(bundle.terms.concepts)) {
    for (const v of variants) {
      const nv = normalizeMessage(v);
      if (!nv) continue;
      const matched =
        nv.length <= 3
          ? tokens.includes(nv)
          : tokens.includes(nv) || tokens.some((t) => t === nv || (t.length > 3 && t.includes(nv)));
      if (matched) {
        concepts.add(concept);
        break;
      }
    }
  }

  return {
    tokens,
    normalized,
    concepts,
    clusters,
    hits,
    typoApplied: typoResult.applied,
  };
}

export function resolveContextBoost(
  signals: ExtractedSignals,
  lastIntent: string | undefined,
  recentIntents: string[],
  bundle = getStaticKnowledgeBundle(),
): string | null {
  const anchors = [
    ...(lastIntent ? [lastIntent] : []),
    ...[...recentIntents].reverse(),
  ].filter((v, i, arr) => arr.indexOf(v) === i);

  const tryBoost = (concept: string, anchor: string): string | null => {
    const map = bundle.signals.contextBoost[concept as keyof typeof bundle.signals.contextBoost];
    if (!map || typeof map !== "object") return null;
    for (const [prefix, intent] of Object.entries(map)) {
      if (prefix !== "default" && anchor.startsWith(prefix)) return intent;
    }
    return (map as { default?: string }).default ?? null;
  };

  const tryConcept = (concept: string): string | null => {
    for (const anchor of anchors) {
      const boosted = tryBoost(concept, anchor);
      if (boosted) return boosted;
    }
    return null;
  };

  const priorityConcepts = [
    "captain",
    "payroll",
    "permits",
    "clearance",
    "provisioning",
    "maintenance",
    "berthing",
    "price",
    "crew",
    "marina",
  ];
  for (const concept of priorityConcepts) {
    if (!signals.concepts.has(concept)) continue;
    const boosted = tryConcept(concept);
    if (boosted) return boosted;
  }

  for (const concept of signals.concepts) {
    const boosted = tryConcept(concept);
    if (boosted) return boosted;
  }

  if (signals.clusters.has("pricing") || signals.concepts.has("price")) {
    for (const anchor of anchors) {
      const priceMap = bundle.signals.contextBoost.price;
      if (priceMap) {
        for (const [prefix, intent] of Object.entries(priceMap)) {
          if (prefix !== "default" && anchor.startsWith(prefix)) return intent;
        }
      }
    }
  }

  return null;
}

export function resolveShortSignalIntent(
  signals: ExtractedSignals,
  hasContext: boolean,
): { intent: string | null; ambiguousKey?: string } {
  if (signals.hits.length === 0) return { intent: null };

  const unambiguous = signals.hits.filter((h) => h.intent && !h.ambiguousAlone);
  if (unambiguous.length === 1 && signals.tokens.length <= 3) {
    return { intent: unambiguous[0]!.intent! };
  }

  const amb = signals.hits.find((h) => h.ambiguousAlone);
  if (amb && !hasContext && signals.tokens.length === 1) {
    return {
      intent: amb.defaultIntent ?? "CLARIFY",
      ambiguousKey: amb.ambiguousKey,
    };
  }

  if (unambiguous.length === 1) {
    return { intent: unambiguous[0]!.intent! };
  }

  return { intent: null };
}
