import type { ChatbotLanguage } from "@/data/chatbot/loadKnowledge";
import { getStaticKnowledgeBundle } from "@/data/chatbot/loadKnowledge";
import { isAcknowledgement, resolveAcknowledgement } from "./acknowledgement";
import { commercialLevel, scoreCommercialIntent, shouldAppendCommercialCta } from "./commercialScore";
import { composeReplyEnhancement, smartQuestionForIntent } from "./composeReply";
import { mergeSessionState, type SessionConversationState } from "./conversationState";
import { buildContextStack, intentToTopic } from "./contextStack";
import type { ConversationContextStack } from "./contextStack";
import { buildEntityMemory } from "./entityMemory";
import { extractEntities } from "./extractEntities";
import { checkFalsePositive } from "./falsePositiveGuard";
import { isGibberish } from "./gibberish";
import { detectDialect } from "./languageDetect";
import { qualifyLead } from "./leadQualification";
import { matchIntent, resolveContextIntent, evaluateConfidence } from "./matcher";
import { analyzeMultiIntent } from "./multiIntent";
import { normalizeMessage } from "./normalize";
import { detectRepair } from "./repair";
import { getIntentRepeatCount } from "./repeatedQuestion";
import { isCommercialIntent, selectResponse } from "./responses";
import { needsSmartQuestion, selectResponseStrategy } from "./responseStrategy";
import { applyVisitorName } from "./personalizeReply";

// Phase 4 Engine Imports
import { handleObjection } from "./objectionEngine";
import { analyzeMissingInformation } from "./missingInfoEngine";
import { detectUrgency, shouldDirectHandoffForUrgency } from "./urgencyEngine";
import { isProgressiveTrigger, getProgressiveDisclosure } from "./progressiveEngine";
import { determineNextBestAction } from "./nextBestActionEngine";

export interface StaticAssistantInput {
  message: string;
  language: ChatbotLanguage;
  sessionId: string;
  lastIntent?: string;
  recentIntents?: string[];
  turnIndex?: number;
  sessionState?: Partial<SessionConversationState>;
  visitorName?: string;
}

export interface StaticAssistantResult {
  reply: string;
  intent: string;
  confidence: "high" | "medium" | "low";
  clarified: boolean;
  strategy?: string;
  commercialScore?: number;
  stage?: string;
  nextBestAction?: string;
}

export function generateStaticReply(input: StaticAssistantInput): StaticAssistantResult {
  const bundle = getStaticKnowledgeBundle();
  const dialect = detectDialect(input.message);
  const normalized = normalizeMessage(input.message);

  if (isGibberish(input.message)) {
    const reply = selectResponse({
      language: input.language,
      intentId: "GIBBERISH",
      sessionId: input.sessionId,
      turnIndex: input.turnIndex,
      dialect,
    });
    return { reply, intent: "UNKNOWN", confidence: "low", clarified: false, strategy: "GIBBERISH", nextBestAction: "ANSWER" };
  }

  const falsePositive = checkFalsePositive(input.message);
  if (falsePositive.blocked) {
    const reply = selectResponse({
      language: input.language,
      intentId: "UNKNOWN",
      sessionId: input.sessionId,
      turnIndex: input.turnIndex,
      dialect,
    });
    return { reply, intent: "UNKNOWN", confidence: "low", clarified: false, strategy: "OUT_OF_SCOPE", nextBestAction: "ANSWER" };
  }

  const extracted = extractEntities(input.message);
  const repair = detectRepair(input.message);

  // Negative repair without target correction
  if (repair.isRepair && repair.needsClarification && !repair.correctedIntent) {
    const reply =
      input.language === "ar"
        ? "أكيد، خلنا نحدد طلبك بشكل أدق. هل تقصد إدارة اليخوت، إدارة المارينا، إدارة الطواقم، أو خدمة أخرى؟"
        : "Sure, let's clarify your request. Are you interested in Yacht Management, Marina Management, Crew Placement, or another service?";
    return {
      reply,
      intent: "CLARIFY",
      confidence: "medium",
      clarified: true,
      strategy: "CLARIFICATION",
      nextBestAction: "CLARIFY",
    };
  }

  const match = matchIntent(input.message);

  const contextStack: ConversationContextStack = input.recentIntents?.length
    ? {
        recentIntents: input.recentIntents,
        lastIntent: input.recentIntents[input.recentIntents.length - 1] ?? input.lastIntent,
        lastTopic: intentToTopic(input.recentIntents[input.recentIntents.length - 1] ?? input.lastIntent ?? ""),
      }
    : buildContextStack({ lastIntent: input.lastIntent });

  if (repair.isRepair && repair.correctedIntent) {
    contextStack.lastIntent = repair.correctedIntent;
    contextStack.lastTopic = repair.correctedTopic ?? contextStack.lastTopic;
    if (!contextStack.recentIntents.includes(repair.correctedIntent)) {
      contextStack.recentIntents = [...contextStack.recentIntents, repair.correctedIntent].slice(-5);
    }
  }

  if (isAcknowledgement(input.message)) {
    const ackIntent = resolveAcknowledgement(contextStack.lastIntent);
    if (ackIntent) {
      const reply = selectResponse({
        language: input.language,
        intentId: ackIntent,
        sessionId: input.sessionId,
        turnIndex: input.turnIndex,
        match,
        dialect,
      });
      return {
        reply,
        intent: ackIntent,
        confidence: "medium",
        clarified: false,
        strategy: "ACKNOWLEDGEMENT",
        nextBestAction: "ANSWER",
      };
    }
  }

  const entityMemory = buildEntityMemory(input.message, match, contextStack, extracted, input.sessionState?.entities);
  if (entityMemory.lastTopic && !contextStack.lastTopic) {
    contextStack.lastTopic = entityMemory.lastTopic;
  }

  let intentId = resolveContextIntent(match, contextStack, input.message) ?? "UNKNOWN";

  const multi = analyzeMultiIntent(match, extracted, intentId, normalized);
  intentId = multi.primaryIntent;

  // Handle Objections
  if (extracted.objectionType) {
    const objHandled = handleObjection(extracted.objectionType, input.language, contextStack.lastIntent);
    if (objHandled.handled) {
      return {
        reply: objHandled.reply,
        intent: extracted.objectionType,
        confidence: "high",
        clarified: false,
        strategy: "OBJECTION_HANDLING",
        nextBestAction: extracted.objectionType === "NO_CONTACT_OBJECTION" ? "ANSWER" : "QUALIFY",
      };
    }
  }

  // Handle Progressive Disclosure
  if (isProgressiveTrigger(input.message) && (contextStack.lastTopic || contextStack.lastIntent)) {
    const currentLevel = (input.sessionState?.disclosureLevel ?? 1);
    const progressive = getProgressiveDisclosure(contextStack.lastTopic ?? "services", currentLevel, input.language);
    return {
      reply: progressive.reply,
      intent: contextStack.lastIntent ?? "SERVICES_LIST",
      confidence: "high",
      clarified: false,
      strategy: "PROGRESSIVE_DISCLOSURE",
      nextBestAction: "SHOW_MORE",
    };
  }

  let clarified = false;
  if (intentId === "CLARIFY") {
    clarified = true;
    const reply = selectResponse({
      language: input.language,
      intentId: "CLARIFY",
      ambiguousKey: match.ambiguousKey,
      sessionId: input.sessionId,
      turnIndex: input.turnIndex,
      match,
      dialect,
    });
    return { reply, intent: "CLARIFY", confidence: "medium", clarified: true, strategy: "CLARIFICATION", nextBestAction: "CLARIFY" };
  }

  if (!intentId || intentId === "UNKNOWN") {
    intentId = match.topScore < bundle.intents.clarifyThreshold ? "UNKNOWN" : (match.topIntent ?? "UNKNOWN");
  }

  const hasContext = (contextStack.recentIntents?.length ?? 0) > 0 || Boolean(contextStack.lastIntent);
  const confidenceLevel = evaluateConfidence(match, intentId, hasContext, bundle);
  const confidence: "high" | "medium" | "low" = confidenceLevel === "unknown" ? "low" : confidenceLevel;

  if (
    confidence === "low" &&
    !hasContext &&
    (intentId === "PRICING" || match.ambiguousKey === "PRICING" || match.matchedConcepts.includes("price"))
  ) {
    clarified = true;
    const reply = selectResponse({
      language: input.language,
      intentId: "CLARIFY",
      ambiguousKey: "PRICING",
      sessionId: input.sessionId,
      turnIndex: input.turnIndex,
      match,
      dialect,
    });
    return { reply, intent: "CLARIFY", confidence: "medium", clarified: true, strategy: "CLARIFICATION", nextBestAction: "CLARIFY" };
  }

  const commercialScore = scoreCommercialIntent(
    input.message,
    intentId,
    input.sessionState?.commercialScore ?? 0,
  );
  const commLevel = commercialLevel(commercialScore);

  const session = mergeSessionState({
    intentId,
    entities: extracted,
    stack: contextStack,
    commercialScore,
    prior: input.sessionState,
    language: input.language,
    dialect,
    objectionPresent: Boolean(extracted.objectionType),
  });

  qualifyLead(intentId, extracted, commLevel);

  const missingInfo = analyzeMissingInformation(intentId, entityMemory, input.language);
  const urgency = detectUrgency(input.message);
  const directHandoff = shouldDirectHandoffForUrgency(urgency, commLevel);

  const nextAction = determineNextBestAction({
    intent: intentId,
    confidence,
    stage: session.stage,
    commercialLevel: commLevel,
    urgency,
    missingInfo,
    objectionType: extracted.objectionType,
    isProgressive: isProgressiveTrigger(input.message),
    isRepair: repair.isRepair,
    contactProvided: Boolean(extracted.phone || extracted.email || extracted.contactIntent),
  });

  const strategy = selectResponseStrategy({
    intentId,
    confidence,
    clarified,
    commercialLevel: commLevel,
    session,
    message: input.message,
    isGibberish: false,
    isSecurity: intentId === "IMPLEMENTATION_SECURITY",
    isOutOfScope: false,
    isAck: false,
  });

  const repeatCount = getIntentRepeatCount(intentId, session.intentRepeatCounts);
  const commercial = isCommercialIntent(intentId, bundle) || commLevel !== "NONE";
  const progressive = intentId === "YACHT_MANAGEMENT" && extracted.hasOwnership && (input.turnIndex ?? 0) <= 2;

  let reply = selectResponse({
    language: input.language,
    intentId,
    sessionId: input.sessionId,
    turnIndex: input.turnIndex,
    match,
    dialect,
    appendCta: (shouldAppendCommercialCta(commercialScore, input.turnIndex) || directHandoff) && commercial && confidence !== "low",
    appendProgressive: progressive && strategy !== "SALES_JOURNEY",
  });

  if (nextAction === "ASK_MISSING_INFO" && missingInfo.nextBestQuestion && confidence !== "low") {
    reply = `${reply}\n\n${missingInfo.nextBestQuestion}`;
  } else if (needsSmartQuestion(intentId, extracted) && confidence !== "low") {
    const sq = smartQuestionForIntent(intentId, input.language);
    if (sq) reply = `${reply}\n\n${sq}`;
  }

  reply = composeReplyEnhancement({
    baseReply: reply,
    strategy,
    language: input.language,
    entities: extracted,
    intentId,
    repeatCount,
  });

  reply = applyVisitorName({
    reply,
    visitorName: input.visitorName,
    language: input.language,
    turnIndex: input.turnIndex ?? 0,
    intentId,
    sessionId: input.sessionId,
  });

  return {
    reply,
    intent: intentId,
    confidence: intentId === "UNKNOWN" ? "low" : confidence,
    clarified,
    strategy,
    commercialScore,
    stage: session.stage,
    nextBestAction: nextAction,
  };
}

