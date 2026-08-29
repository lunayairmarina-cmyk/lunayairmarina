import type { StaticKnowledgeBundle } from "@/data/chatbot/loadKnowledge";
import { getStaticKnowledgeBundle } from "@/data/chatbot/loadKnowledge";
import type { ConversationContextStack } from "./contextStack";
import { stackMatches } from "./contextStack";
import { detectEntities } from "./entities";
import { isShortMessage, normalizeMessage, tokenize } from "./normalize";
import {
  extractSignals,
  resolveContextBoost,
  resolveShortSignalIntent,
  type ExtractedSignals,
} from "./signals";
import { resolveConceptCombination } from "./conceptCombiner";
import { resolveFollowUpIntent } from "./followUp";
import type { ExtractedSignals } from "./signals";
import { checkFalsePositive } from "./falsePositiveGuard";

function resolvePriorityIntent(
  match: MatchResult,
  signals: ExtractedSignals,
  message: string,
  entities: ReturnType<typeof detectEntities>,
  bundle: StaticKnowledgeBundle,
): string | null {
  const normalizedMsg = normalizeMessage(message);

  if (
    normalizedMsg.includes("السلام عليكم") ||
    normalizedMsg.includes("سلام عليكم") ||
    normalizedMsg.includes("مرحبا") ||
    normalizedMsg.includes("اهلين") ||
    /\bhello\b/i.test(normalizedMsg) ||
    /\bhi\b/i.test(normalizedMsg)
  ) {
    return "GREETING";
  }

  if (match.matchedClusters.includes("how_are_you")) return "HOW_ARE_YOU";

  const hasPricingSignal =
    signals.concepts.has("price") ||
    normalizedMsg.includes("how much") ||
    normalizedMsg.includes("price") ||
    normalizedMsg.includes("cost") ||
    normalizedMsg.includes("بكم") ||
    normalizedMsg.includes("بكام") ||
    normalizedMsg.includes("سعر") ||
    normalizedMsg.includes("تكلفة");

  const hasYachtSignal =
    signals.concepts.has("yacht") ||
    normalizedMsg.includes("yacht") ||
    normalizedMsg.includes("يخت") ||
    normalizedMsg.includes("قارب");

  const hasMgmtSignal =
    signals.concepts.has("management") ||
    normalizedMsg.includes("management") ||
    normalizedMsg.includes("اداره") ||
    normalizedMsg.includes("ادارة") ||
    normalizedMsg.includes("يدير");

  if (normalizedMsg.includes("اداره مارينا") || normalizedMsg.includes("ادارة مارينا") || normalizedMsg.includes("marina management")) {
    return "MARINA_MANAGEMENT";
  }

  if (normalizedMsg.includes("visiting yacht permits") || normalizedMsg.includes("تصاريح")) {
    return "VISITING_YACHT_PERMITS";
  }

  if (normalizedMsg.includes("visiting yacht clearance") || normalizedMsg.includes("تخليص")) {
    return "VISITING_YACHT_CLEARANCE";
  }

  if (normalizedMsg.includes("visiting yacht provisioning") || normalizedMsg.includes("تموين")) {
    return "VISITING_YACHT_PROVISIONING";
  }

  if (signals.concepts.has("agency") || normalizedMsg.includes("وكالة") || normalizedMsg.includes("وكاله")) {
    return "VISITING_YACHT_AGENCY";
  }

  if ((normalizedMsg.includes("وكاله يخت") || normalizedMsg.includes("وكالة يخت") || normalizedMsg.includes("visiting yacht")) && !normalizedMsg.includes("permit") && !normalizedMsg.includes("تصاريح")) {
    return "VISITING_YACHT_AGENCY";
  }

  if ((normalizedMsg.includes("حجز مرسي") || normalizedMsg.includes("حجز مرسى") || (normalizedMsg.includes("رسو") && !normalizedMsg.includes("رسوم")) || normalizedMsg.includes("berth") || normalizedMsg.includes("مرسي") || normalizedMsg.includes("مرسى")) && !normalizedMsg.includes("استشاره") && !normalizedMsg.includes("استشارة") && !normalizedMsg.includes("حجز استشاره") && !hasMgmtSignal) {
    return "BERTHING";
  }

  if (hasPricingSignal && (hasYachtSignal || entities.hasOwnershipSignal || normalizedMsg.includes("يخت") || normalizedMsg.includes("yacht"))) {
    return "YACHT_MANAGEMENT_PRICING";
  }

  if (hasPricingSignal && (signals.concepts.has("agency") || normalizedMsg.includes("وكالة") || normalizedMsg.includes("visiting"))) {
    return "VISITING_YACHT_AGENCY";
  }

  if (hasPricingSignal && (signals.concepts.has("marina") || normalizedMsg.includes("marina") || normalizedMsg.includes("مارينا"))) {
    return "MARINA_MANAGEMENT";
  }

  if (hasPricingSignal && (signals.concepts.has("crew") || normalizedMsg.includes("crew") || normalizedMsg.includes("طاقم"))) {
    return "CREW_PRICING";
  }

  if (normalizedMsg.includes("السلام عليكم") || normalizedMsg.includes("سلام عليكم") || normalizedMsg.includes("مرحبا") || normalizedMsg.includes("اهلين") || normalizedMsg.includes("hello") || normalizedMsg.includes("hi")) {
    return "GREETING";
  }

  if (hasPricingSignal && (hasYachtSignal || hasMgmtSignal || entities.hasOwnershipSignal)) {
    return "YACHT_MANAGEMENT_PRICING";
  }

  if (normalizedMsg.includes("تمسكون") || normalizedMsg.includes("يمسك") || normalizedMsg.includes("yemsek")) {
    return "YACHT_MANAGEMENT";
  }

  if (
    (normalizedMsg.includes("اجنبي") || normalizedMsg.includes("foreign") || normalizedMsg.includes("دخول")) &&
    (normalizedMsg.includes("yacht") || normalizedMsg.includes("يacht") || normalizedMsg.includes("يخت")) &&
    !normalizedMsg.includes("تصاريح") &&
    !signals.concepts.has("permits")
  ) {
    return "VISITING_YACHT_AGENCY";
  }

  if (normalizedMsg.includes("يهتم") && (normalizedMsg.includes("yacht") || normalizedMsg.includes("يacht") || normalizedMsg.includes("يخت"))) {
    return "YACHT_MANAGEMENT";
  }

  if (normalizedMsg.includes("ناس للطاق") || normalizedMsg.includes("nas lil")) {
    return "CREW_MANAGEMENT";
  }

  for (const hit of signals.hits) {
    if (!hit.intent || hit.ambiguousAlone) continue;
    if (
      [
        "VISITING_YACHT_CLEARANCE",
        "VISITING_YACHT_PROVISIONING",
        "VISITING_YACHT_PERMITS",
        "MOBILE_APP",
        "CREW_RECRUITMENT",
        "CREW_SALARIES",
        "CREW_TRAINING",
        "REFIT",
        "BERTHING",
      ].includes(hit.intent)
    ) {
      return hit.intent;
    }
  }

  if (normalizedIncludesRecruitment(message) || signals.concepts.has("captain")) {
    return "CREW_RECRUITMENT";
  }

  if (match.matchedClusters.includes("mobile_app") || signals.clusters.has("mobile_app")) {
    return "MOBILE_APP";
  }
  if (signals.concepts.has("clearance")) return "VISITING_YACHT_CLEARANCE";
  if (signals.concepts.has("provisioning") || match.matchedClusters.includes("provisioning")) {
    return "VISITING_YACHT_PROVISIONING";
  }
  if (signals.concepts.has("permits")) return "VISITING_YACHT_PERMITS";

  const isVisiting =
    signals.concepts.has("agency") ||
    normalizedMsg.includes("زاير") ||
    normalizedMsg.includes("زائر") ||
    normalizedMsg.includes("visiting");
  if (isVisiting) {
    const visiting = match.scores.find((s) => s.intentId.startsWith("VISITING"));
    if (visiting) return visiting.intentId;
    return "VISITING_YACHT_AGENCY";
  }

  if (signals.concepts.has("refit")) return "REFIT";
  if (signals.concepts.has("maintenance")) return "MAINTENANCE";

  if (normalizedMsg.includes("360")) {
    const s360 = match.scores.find((s) => s.intentId === "YACHT_MANAGEMENT_360");
    if (s360 && s360.score > 0) return "YACHT_MANAGEMENT_360";
    if (signals.concepts.has("yacht") && signals.concepts.has("management")) {
      return "YACHT_MANAGEMENT_360";
    }
  }

  if (signals.concepts.has("crew") && !signals.concepts.has("services")) {
    if (!(signals.concepts.has("yacht") && signals.concepts.has("management"))) {
      const crew = match.scores.find((s) => s.intentId.startsWith("CREW"));
      if (crew) return crew.intentId;
    }
  }

  const pricingKw = match.scores.find(
    (s) => s.intentId === "YACHT_MANAGEMENT_PRICING" && s.reasons.some((r) => r.startsWith("kw:")),
  );
  if (pricingKw) return "YACHT_MANAGEMENT_PRICING";

  if (signals.concepts.has("marina") && signals.concepts.has("management")) {
    return "MARINA_MANAGEMENT";
  }

  if (
    entities.hasOwnershipSignal &&
    (signals.concepts.has("yacht") || signals.concepts.has("management") || match.matchedClusters.includes("yacht_management")) &&
    !signals.concepts.has("marina")
  ) {
    return "YACHT_MANAGEMENT";
  }

  if (
    normalizedMsg.includes("interested in management") ||
    normalizedMsg.includes("how can i start") ||
    normalizedMsg.includes("looking for management")
  ) {
    return "YACHT_MANAGEMENT";
  }

  if (
    (normalizedMsg.includes("more") ||
      normalizedMsg.includes("else") ||
      normalizedMsg.includes("اكثر") ||
      normalizedMsg.includes("أكثر") ||
      normalizedMsg.includes("تفاصيل")) &&
    !signals.concepts.has("price")
  ) {
    return "SERVICES_LIST";
  }

  if (
    (normalizedMsg.includes("يدير") || normalizedMsg.includes("تدير") || normalizedMsg.includes("تديرون")) &&
    (signals.concepts.has("yacht") ||
      normalizedMsg.includes("yacht") ||
      normalizedMsg.includes("يacht") ||
      normalizedMsg.includes("يختi"))
  ) {
    return "YACHT_MANAGEMENT";
  }

  if (
    signals.concepts.has("management") &&
    (normalizedMsg.includes("احتاج") || normalizedMsg.includes("محتاج")) &&
    !signals.concepts.has("yacht") &&
    !signals.concepts.has("marina") &&
    !signals.concepts.has("crew") &&
    !normalizedMsg.includes("yacht") &&
    !normalizedMsg.includes("يacht")
  ) {
    return "CLARIFY";
  }

  return null;
}

function normalizedIncludesRecruitment(message: string): boolean {
  const n = normalizeMessage(message);
  return (
    n.includes("توظيف") ||
    n.includes("recruit") ||
    n.includes("hire") ||
    n.includes("placement") ||
    n.includes("قبطان") ||
    n.includes("captain")
  );
}

export interface IntentScore {
  intentId: string;
  score: number;
  reasons: string[];
}

export interface MatchResult {
  scores: IntentScore[];
  topIntent: string | null;
  topScore: number;
  matchedClusters: string[];
  matchedConcepts: string[];
  ambiguous: boolean;
  ambiguousKey?: string;
  signals?: ExtractedSignals;
  signalIntent?: string | null;
}

function phraseMatches(normalized: string, phrase: string, tokens: string[]): boolean {
  const p = normalizeMessage(phrase);
  if (!p) return false;
  const phraseTokens = tokenize(p);

  if (phraseTokens.length === 1) {
    const pt = phraseTokens[0]!;
    if (pt.length <= 3) return tokens.includes(pt);
    return tokens.includes(pt) || normalized.includes(p);
  }

  return normalized.includes(p);
}

function scoreIntent(
  bundle: StaticKnowledgeBundle,
  intentDef: StaticKnowledgeBundle["intents"]["intents"][number],
  normalized: string,
  tokens: string[],
  clusterHits: Map<string, number>,
  conceptHits: Set<string>,
  signalBoost: number,
): IntentScore {
  let score = signalBoost;
  const reasons: string[] = signalBoost > 0 ? [`signal+${signalBoost}`] : [];

  if (intentDef.clusters) {
    for (const clusterId of intentDef.clusters) {
      const hit = clusterHits.get(clusterId) ?? 0;
      if (hit > 0) {
        score += hit;
        reasons.push(`cluster:${clusterId}+${hit}`);
      }
    }
  }

  if (intentDef.keywords) {
    for (const kw of intentDef.keywords) {
      if (phraseMatches(normalized, kw, tokens)) {
        score += intentDef.parent ? 5 : 3;
        reasons.push(`kw:${kw}`);
      }
    }
  }

  if (intentDef.concepts) {
    let conceptCount = 0;
    for (const concept of intentDef.concepts) {
      if (conceptHits.has(concept)) {
        conceptCount += 1;
        reasons.push(`concept:${concept}`);
      }
    }
    if (intentDef.concepts.length >= 2) {
      if (conceptCount >= 2) {
        score += conceptCount * 2;
        if (intentDef.compoundBonus) {
          score += intentDef.compoundBonus;
          reasons.push(`compound+${intentDef.compoundBonus}`);
        }
      }
    } else if (conceptCount >= 1) {
      score += 2;
    }
  }

  if (intentDef.exclusive && score > 0) {
    score += 8;
    reasons.push("exclusive+8");
  }

  return { intentId: intentDef.id, score, reasons };
}

function buildClusterHits(
  bundle: StaticKnowledgeBundle,
  normalized: string,
  tokens: string[],
  extraClusters: Set<string>,
): Map<string, number> {
  const hits = new Map<string, number>();
  for (const [clusterId, cluster] of Object.entries(bundle.synonyms.clusters)) {
    const phrases = [...(cluster.phrases.ar ?? []), ...(cluster.phrases.en ?? [])];
    for (const phrase of phrases) {
      if (phraseMatches(normalized, phrase, tokens)) {
        hits.set(clusterId, (hits.get(clusterId) ?? 0) + cluster.weight);
        break;
      }
    }
  }
  for (const c of extraClusters) {
    const cluster = bundle.synonyms.clusters[c as keyof typeof bundle.synonyms.clusters];
    if (cluster) hits.set(c, (hits.get(c) ?? 0) + cluster.weight);
  }
  return hits;
}

function signalBoostForIntent(intentId: string, signals: ExtractedSignals): number {
  for (const hit of signals.hits) {
    if (hit.intent === intentId) return 6;
  }
  return 0;
}

export function matchIntent(
  message: string,
  bundle = getStaticKnowledgeBundle(),
): MatchResult {
  const signals = extractSignals(message, bundle);
  const normalized = signals.normalized || normalizeMessage(message);
  const tokens = signals.tokens.length ? signals.tokens : tokenize(normalized);
  const clusterHits = buildClusterHits(bundle, normalized, tokens, signals.clusters);
  const conceptHits = new Set(signals.concepts);

  const matchedClusters = [...clusterHits.keys()];
  const matchedConcepts = [...conceptHits];

  const scores: IntentScore[] = bundle.intents.intents
    .filter((i) => !i.fallback)
    .map((def) =>
      scoreIntent(
        bundle,
        def,
        normalized,
        tokens,
        clusterHits,
        conceptHits,
        signalBoostForIntent(def.id, signals),
      ),
    )
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  const top = scores[0];
  const second = scores[1];
  let ambiguous = false;
  let ambiguousKey: string | undefined;

  const shortSignal = resolveShortSignalIntent(signals, false);
  if (shortSignal.ambiguousKey) {
    ambiguous = true;
    ambiguousKey = shortSignal.ambiguousKey;
  }

  if (top && top.intentId === "PRICING" && !scores.some((s) => s.intentId.includes("PRICING") && s.intentId !== "PRICING")) {
    ambiguous = true;
    ambiguousKey = ambiguousKey ?? "PRICING";
  }

  if (
    conceptHits.has("management") &&
    !conceptHits.has("yacht") &&
    !conceptHits.has("marina") &&
    !conceptHits.has("crew") &&
    !matchedClusters.includes("yacht_management") &&
    !matchedClusters.includes("marina_mgmt") &&
    !matchedClusters.includes("crew_mgmt") &&
    !matchedClusters.includes("visiting_agency") &&
    tokens.length === 1
  ) {
    ambiguous = true;
    ambiguousKey = ambiguousKey ?? "management_ambiguous";
  }

  if (
    conceptHits.has("yacht") &&
    !conceptHits.has("management") &&
    !conceptHits.has("agency") &&
    !matchedClusters.includes("yacht_management") &&
    !matchedClusters.includes("visiting_agency") &&
    !matchedClusters.includes("yacht_rental") &&
    tokens.length === 1
  ) {
    ambiguous = true;
    ambiguousKey = ambiguousKey ?? "yacht_ambiguous";
  }

  if (top && second && top.score - second.score < 2 && top.score < bundle.intents.threshold + 2) {
    ambiguous = true;
    if (!ambiguousKey) ambiguousKey = "PRICING";
  }

  return {
    scores,
    topIntent: top?.intentId ?? null,
    topScore: top?.score ?? 0,
    matchedClusters,
    matchedConcepts,
    ambiguous,
    ambiguousKey,
    signals,
    signalIntent: shortSignal.intent,
  };
}

export function resolveContextIntent(
  match: MatchResult,
  context: ConversationContextStack | string | undefined,
  message: string,
  bundle = getStaticKnowledgeBundle(),
): string | null {
  const stack: ConversationContextStack =
    typeof context === "string" || context === undefined
      ? { lastIntent: typeof context === "string" ? context : undefined, recentIntents: context ? [context] : [] }
      : { recentIntents: context.recentIntents ?? [], lastIntent: context.lastIntent, lastTopic: context.lastTopic };
  const lastIntent = stack.lastIntent;
  const recentIntents = stack.recentIntents ?? [];
  const hasContext = Boolean(lastIntent || recentIntents.length > 0);
  const entities = detectEntities(message);
  const short = isShortMessage(message, bundle.contextRules.shortMessageMaxWords);
  const signals = match.signals ?? extractSignals(message, bundle);
  const normalizedMsg = normalizeMessage(message);

  if (match.matchedClusters.includes("implementation_probe")) {
    return "IMPLEMENTATION_SECURITY";
  }

  const fp = checkFalsePositive(message);
  if (fp.blocked) return "UNKNOWN";

  const hasRecentPrefix = (prefix: string) =>
    recentIntents.some((i) => i.startsWith(prefix)) || (lastIntent?.startsWith(prefix) ?? false);

  const priorityIntent = resolvePriorityIntent(match, signals, message, entities, bundle);
  if (priorityIntent) return priorityIntent;

  const contextBoost = resolveContextBoost(signals, lastIntent, recentIntents, bundle);
  if (contextBoost) return contextBoost;

  const followUpIntent = resolveFollowUpIntent(message, stack, bundle);
  if (followUpIntent) return followUpIntent;

  const allConcepts = new Set([...match.matchedConcepts, ...signals.concepts]);
  const conceptCombo = resolveConceptCombination(allConcepts, {
    lastIntent,
    recentIntents,
    hasOwnership: entities.hasOwnershipSignal,
    normalizedMessage: normalizedMsg,
    bundle,
  });
  if (conceptCombo) return conceptCombo;

  if (match.matchedClusters.includes("pricing")) {
    if (match.matchedConcepts.includes("crew") && match.matchedClusters.includes("pricing")) {
      if (!(match.matchedConcepts.includes("yacht") || match.matchedClusters.includes("yacht_management"))) {
        return "CREW_PRICING";
      }
    }
    if (match.matchedClusters.includes("yacht_management")) return "YACHT_MANAGEMENT_PRICING";
    if (match.matchedClusters.includes("crew_mgmt")) return "CREW_PRICING";
    if (match.matchedClusters.includes("visiting_agency")) return "VISITING_YACHT_AGENCY";
    if (match.matchedClusters.includes("marina_mgmt")) return "MARINA_MANAGEMENT";
  }

  if (short || signals.tokens.length <= 3) {
    if (
      !normalizedIncludesRecruitment(message) &&
      !normalizedMsg.includes("operations") &&
      !normalizedMsg.includes("تشغيل")
    ) {
      const shortResolved = resolveShortSignalIntent(signals, hasContext);
      if (shortResolved.intent) {
        if (shortResolved.intent === "CLARIFY") {
          match.ambiguous = true;
          match.ambiguousKey = shortResolved.ambiguousKey ?? match.ambiguousKey;
          if (!hasContext) return "CLARIFY";
        } else if (shortResolved.intent === "PRICING" && !hasContext) {
          return "PRICING";
        } else if (shortResolved.intent !== "PRICING" || hasContext) {
          const boosted = resolveContextBoost(signals, lastIntent, recentIntents, bundle);
          return boosted ?? shortResolved.intent;
        }
      }
    }
  }

  if (match.matchedClusters.includes("provisioning")) return "VISITING_YACHT_PROVISIONING";
  if (normalizedMsg.includes("وكالة") || normalizedMsg.includes("وكاله")) {
    const visiting = match.scores.find((s) => s.intentId.startsWith("VISITING"));
    if (visiting || match.matchedClusters.includes("visiting_agency")) {
      return visiting?.intentId ?? "VISITING_YACHT_AGENCY";
    }
  }
  if (
    normalizedMsg.includes("زاير") ||
    normalizedMsg.includes("زائر") ||
    normalizedMsg.includes("زائرة") ||
    normalizedMsg.includes("visiting") ||
    match.matchedConcepts.includes("visiting")
  ) {
    if (
      signals.concepts.has("clearance") ||
      signals.concepts.has("provisioning") ||
      signals.concepts.has("permits")
    ) {
      /* handled above */
    } else {
      return match.scores.find((s) => s.intentId.startsWith("VISITING"))?.intentId ?? "VISITING_YACHT_AGENCY";
    }
  }
  if (match.matchedConcepts.includes("agency") || match.matchedConcepts.includes("visiting")) {
    const visiting = match.scores.find((s) => s.intentId.startsWith("VISITING"));
    if (visiting) return visiting.intentId;
    return "VISITING_YACHT_AGENCY";
  }
  if (match.matchedClusters.includes("visiting_agency")) {
    const visiting = match.scores.find((s) => s.intentId.startsWith("VISITING"));
    if (visiting) return visiting.intentId;
    return "VISITING_YACHT_AGENCY";
  }
  if (match.matchedClusters.includes("yacht_management")) {
    const yacht = match.scores.find((s) => s.intentId.startsWith("YACHT"));
    if (yacht && yacht.score >= bundle.intents.clarifyThreshold) return yacht.intentId;
  }
  if (match.matchedClusters.includes("marina_mgmt")) {
    if ((normalizedMsg.includes("حجز") || normalizedMsg.includes("رسو") || normalizedMsg.includes("berth")) && !normalizedMsg.includes("ادارة") && !normalizedMsg.includes("إدارة")) {
      return "BERTHING";
    }
    const ops = match.scores.find((s) => s.intentId === "MARINA_OPERATIONS");
    if (
      ops &&
      (ops.reasons.some((r) => r.startsWith("kw:")) ||
        normalizedMsg.includes("operations") ||
        normalizedMsg.includes("تشغيل"))
    ) {
      return "MARINA_OPERATIONS";
    }
    const marina = match.scores.find((s) => s.intentId.startsWith("MARINA") || s.intentId === "BERTHING");
    if (marina) return marina.intentId;
    return "MARINA_MANAGEMENT";
  }
  if (match.matchedConcepts.includes("captain")) {
    return "CREW_RECRUITMENT";
  }
  if (match.matchedConcepts.includes("maintenance")) {
    return "MAINTENANCE";
  }
  if (match.matchedConcepts.includes("berthing")) {
    if (hasRecentPrefix("MARINA")) return "BERTHING";
    return "BERTHING";
  }
  if (match.matchedClusters.includes("crew_mgmt")) {
    const recruit = match.scores.find((s) => s.intentId === "CREW_RECRUITMENT");
    const crewMgmt = match.scores.find((s) => s.intentId === "CREW_MANAGEMENT");
    if (
      recruit &&
      (recruit.reasons.some((r) => r.startsWith("kw:")) ||
        normalizedIncludesRecruitment(message) ||
        match.matchedConcepts.includes("captain"))
    ) {
      return "CREW_RECRUITMENT";
    }
    const crew = match.scores.find((s) => s.intentId.startsWith("CREW"));
    if (crew) return crew.intentId;
    return "CREW_MANAGEMENT";
  }
  if (match.matchedClusters.includes("pricing") && !hasContext) {
    const yachtPrice = match.scores.find((s) => s.intentId === "YACHT_MANAGEMENT_PRICING");
    if (yachtPrice && yachtPrice.score >= bundle.intents.threshold) return "YACHT_MANAGEMENT_PRICING";
    return "PRICING";
  }
  if (match.matchedClusters.includes("yacht_rental")) {
    const msg = normalizeMessage(message);
    if (msg.includes("charter") && !msg.includes("rental") && !msg.includes("rent") && !msg.includes("تأجير")) {
      return "CHARTER";
    }
    return "YACHT_RENTAL";
  }
  if (match.matchedClusters.includes("yacht_purchase")) return "YACHT_PURCHASE";
  if (match.matchedClusters.includes("yacht_sale")) return "YACHT_SALE";
  if (match.matchedClusters.includes("whatsapp_contact")) return "WHATSAPP";
  if (match.matchedClusters.includes("email_contact")) return "EMAIL";
  if (match.matchedClusters.includes("mobile_app")) return "MOBILE_APP";
  if (match.matchedClusters.includes("about_company")) {
    const founded = match.scores.find((s) => s.intentId === "FOUNDED");
    const about = match.scores.find((s) => s.intentId === "ABOUT_COMPANY");
    if (founded && about && founded.score > about.score) return "FOUNDED";
    if (founded && founded.reasons.some((r) => r.startsWith("kw:"))) return "FOUNDED";
    return "ABOUT_COMPANY";
  }
  if (match.matchedClusters.includes("address_contact")) return "ADDRESS";

  for (const rule of bundle.contextRules.rules) {
    const when = rule.when as Record<string, unknown>;
    if (when.clusters) {
      const clusterOk = (when.clusters as string[]).some((c) => match.matchedClusters.includes(c));
      if (!clusterOk) continue;
    }
    if (when.concepts) {
      const concepts = when.concepts as string[];
      const conceptOk = concepts.every((c) => match.matchedConcepts.includes(c));
      if (!conceptOk) continue;
      if (when.noOtherConcepts) {
        const extra = match.matchedConcepts.filter((c) => !concepts.includes(c));
        if (extra.length > 0) continue;
      }
      const blocked = ["visiting_agency", "marina_mgmt", "crew_mgmt", "yacht_rental"];
      if (concepts.includes("yacht") && blocked.some((b) => match.matchedClusters.includes(b)))
        continue;
    }
    if (when.ownershipSignal === true && !entities.hasOwnershipSignal) continue;
    if (when.noOwnershipSignal === true && entities.hasOwnershipSignal) continue;
    if (when.shortMessage && !short) continue;
    if (when.lastIntent && lastIntent !== when.lastIntent) {
      if (!recentIntents.includes(when.lastIntent as string)) continue;
    }
    if (when.lastIntentPrefix) {
      if (!hasRecentPrefix(when.lastIntentPrefix as string)) continue;
    }
    return rule.resolveTo;
  }

  if (signals.concepts.has("price") || match.matchedClusters.includes("pricing")) {
    if (hasRecentPrefix("YACHT")) return "YACHT_MANAGEMENT_PRICING";
    if (hasRecentPrefix("CREW")) return "CREW_PRICING";
    if (hasRecentPrefix("VISITING")) return "VISITING_YACHT_AGENCY";
    if (hasRecentPrefix("MARINA")) return "MARINA_MANAGEMENT";
    if (lastIntent?.startsWith("YACHT")) return "YACHT_MANAGEMENT_PRICING";
    if (lastIntent?.startsWith("CREW")) return "CREW_PRICING";
    if (lastIntent?.startsWith("VISITING")) return "VISITING_YACHT_AGENCY";
    if (lastIntent?.startsWith("MARINA")) return "MARINA_MANAGEMENT";
  }

  if (match.ambiguous && match.ambiguousKey && !hasContext) {
    const strongCluster = match.matchedClusters.some((c) =>
      [
        "yacht_management",
        "visiting_agency",
        "marina_mgmt",
        "crew_mgmt",
        "yacht_purchase",
        "yacht_sale",
        "yacht_rental",
        "greeting",
        "goodbye",
        "thanks",
        "implementation_probe",
      ].includes(c),
    );
    if (!strongCluster && match.topScore < bundle.intents.threshold) {
      return "CLARIFY";
    }
  }

  if (match.topScore < bundle.intents.threshold) {
    if (hasContext && short) {
      if (match.matchedClusters.includes("address_contact") || signals.concepts.has("address")) return "ADDRESS";
      if (match.matchedClusters.includes("whatsapp_contact") || signals.concepts.has("whatsapp")) return "WHATSAPP";
      if (
        (match.matchedClusters.includes("phone_contact") || signals.concepts.has("phone")) &&
        !signals.concepts.has("whatsapp")
      )
        return "PHONE";
      if (signals.concepts.has("price") || match.matchedClusters.includes("pricing")) {
        if (stackMatches(stack, { prefix: "YACHT" })) return "YACHT_MANAGEMENT_PRICING";
        if (stackMatches(stack, { prefix: "CREW" })) return "CREW_PRICING";
        return lastIntent ?? null;
      }
    }
    return match.topScore > 0 ? match.topIntent : null;
  }

  return match.topIntent;
}

export function evaluateConfidence(
  match: MatchResult,
  resolvedIntent: string | null,
  hasContext: boolean,
  bundle = getStaticKnowledgeBundle(),
): "high" | "medium" | "low" | "unknown" {
  if (!resolvedIntent || resolvedIntent === "UNKNOWN") return "unknown";
  if (resolvedIntent === "CLARIFY") return "medium";
  const threshold = bundle.intents.threshold;
  if (match.topScore >= threshold * 2) return "high";
  if (match.topScore >= threshold) return "medium";
  if (hasContext && match.topScore > 0) return "medium";
  if (match.topScore > 0) return "low";
  return "unknown";
}
