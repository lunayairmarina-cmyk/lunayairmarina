import { z } from "zod";
import type { QuestionFocus } from "./factSelection";

export const CONVERSATION_STAGES = [
  "DISCOVERY",
  "SERVICE_IDENTIFICATION",
  "QUALIFICATION",
  "CONSIDERATION",
  "OBJECTION",
  "HIGH_INTENT",
  "HANDOFF",
] as const;

export type ConversationStage = (typeof CONVERSATION_STAGES)[number];

export const NEXT_BEST_ACTIONS = [
  "ANSWER",
  "ASK_MISSING_INFO",
  "CLARIFY",
  "SHOW_MORE",
  "QUALIFY",
  "CTA_WHATSAPP",
  "CTA_CONSULTATION",
  "HANDOFF",
] as const;

export type NextBestAction = (typeof NEXT_BEST_ACTIONS)[number];

export const URGENCY_LEVELS = ["LOW", "MEDIUM", "HIGH"] as const;
export type UrgencyLevel = (typeof URGENCY_LEVELS)[number];

export const CTA_TYPES = [
  "NONE",
  "ASK_MISSING_INFO",
  "SOFT_CONTACT",
  "WHATSAPP",
  "CONSULTATION",
  "HANDOFF",
] as const;

export type CtaType = (typeof CTA_TYPES)[number];

export const AGENT_INTENTS = [
  "GREETING",
  "SERVICES",
  "YACHT_MANAGEMENT",
  "YACHT_MANAGEMENT_PRICING",
  "CREW_MANAGEMENT",
  "MARINA_MANAGEMENT",
  "VISITING_YACHT_AGENCY",
  "PRICING",
  "CONTACT",
  "WHATSAPP",
  "OBJECTION",
  "REPAIR",
  "PROGRESSIVE",
  "SECURITY",
  "OUT_OF_SCOPE",
  "GIBBERISH",
  "WEBSITE_ATTRIBUTION",
  "CHATBOT_IDENTITY",
  "YACHT_RENTAL",
  "YACHT_CLARIFY",
  "GENERAL",
] as const;

export type AgentIntentId = (typeof AGENT_INTENTS)[number];

const optionalStringList = z.preprocess((value) => {
  if (value == null) return [];
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}, z.array(z.string()));

const optionalEntity = z.preprocess((value) => {
  if (value == null || value === "") return null;
  return String(value);
}, z.string().nullable().optional());

const optionalScore = z.preprocess((value) => {
  if (value == null || value === "") return undefined;
  const num = Number(value);
  if (Number.isFinite(num)) return Math.max(0, Math.min(100, Math.round(num)));
  return undefined;
}, z.number().min(0).max(100).optional());

const optionalDisclosureLevel = z.preprocess((value) => {
  if (value == null || value === "") return undefined;
  const num = Number(value);
  if (Number.isFinite(num)) return Math.max(0, Math.min(4, Math.round(num)));
  return undefined;
}, z.number().min(0).max(4).optional());

export const geminiAgentOutputSchema = z.object({
  reply: z.preprocess((value) => (value == null ? "" : String(value)), z.string()),
  intent: z.preprocess((value) => (value == null ? "GENERAL" : String(value)), z.string()).optional().default("GENERAL"),
  secondaryIntents: optionalStringList.optional().default([]),
  confidence: z.coerce.number().min(0).max(1).optional().default(0.5),
  conversationStage: z.preprocess((value) => (value == null ? undefined : String(value)), z.string()).optional(),
  commercialScore: optionalScore,
  nextBestAction: z.preprocess((value) => (value == null ? undefined : String(value)), z.string()).optional(),
  urgency: z.preprocess((value) => (value == null ? undefined : String(value).toUpperCase()), z.string()).optional(),
  entities: z
    .object({
      yachtLength: optionalEntity,
      yachtType: optionalEntity,
      location: optionalEntity,
      service: optionalEntity,
      customerGoal: optionalEntity,
    })
    .optional()
    .default({}),
  missingInformation: optionalStringList.optional().default([]),
  leadSignals: optionalStringList.optional().default([]),
  buyingSignals: optionalStringList.optional().default([]),
  objectionTypes: optionalStringList.optional().default([]),
  disclosureLevel: optionalDisclosureLevel,
  ctaType: z.preprocess((value) => (value == null ? undefined : String(value).toUpperCase()), z.string()).optional(),
  handoff: z.preprocess((value) => {
    if (typeof value === "string") return value.toLowerCase() === "true";
    return Boolean(value);
  }, z.boolean().optional().default(false)),
});

export type GeminiAgentOutput = z.infer<typeof geminiAgentOutputSchema>;

export interface AgentEntities {
  yachtLength?: string;
  yachtType?: string;
  location?: string;
  service?: string;
  customerGoal?: string;
}

export interface AgentAnalysis {
  intent: string;
  secondaryIntents: string[];
  conversationStage: ConversationStage;
  commercialScore: number;
  nextBestAction: NextBestAction;
  ctaType?: CtaType;
  urgency: UrgencyLevel;
  entities: AgentEntities;
  missingInformation: string[];
  missingFieldToAsk?: string;
  leadSignals: string[];
  objections: string[];
  buyingSignals: string[];
  handoff: boolean;
  repair: boolean;
  progressive: boolean;
  shortQuery: boolean;
  security: boolean;
  gibberish: boolean;
  disclosureLevel: number;
  disclosureTopic?: string;
  questionFocus: QuestionFocus;
}

export interface AgentTurnResult {
  reply: string;
  analysis: AgentAnalysis;
  geminiParsed: GeminiAgentOutput | null;
  structuredParseFailed: boolean;
  parseStatus: "valid" | "salvaged" | "failed";
  parseErrors: string[];
  salvageMethod?: string;
  /** Raw Gemini text before extraction (diagnostics). */
  rawGeminiText?: string;
  /** True when a near-verbatim KB match triggered one paraphrase retry. */
  paraphraseRetried?: boolean;
  nearVerbatimDetected?: boolean;
}

/** JSON schema for Gemini structured output (responseMimeType: application/json). */
export function geminiResponseJsonSchema(): Record<string, unknown> {
  return {
    type: "object",
    properties: {
      reply: { type: "string", description: "User-facing reply text only" },
      intent: { type: "string" },
      secondaryIntents: { type: "array", items: { type: "string" } },
      confidence: { type: "number" },
      conversationStage: { type: "string" },
      commercialScore: { type: "number" },
      nextBestAction: { type: "string" },
      urgency: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
      entities: {
        type: "object",
        properties: {
          yachtLength: { type: "string", nullable: true },
          yachtType: { type: "string", nullable: true },
          location: { type: "string", nullable: true },
          service: { type: "string", nullable: true },
          customerGoal: { type: "string", nullable: true },
        },
      },
      missingInformation: { type: "array", items: { type: "string" } },
      leadSignals: { type: "array", items: { type: "string" } },
      buyingSignals: { type: "array", items: { type: "string" } },
      objectionTypes: { type: "array", items: { type: "string" } },
      disclosureLevel: { type: "integer" },
      ctaType: { type: "string" },
      handoff: { type: "boolean" },
    },
    required: ["reply"],
  };
}
