export type AgentLanguage = "ar" | "en";

export type KnowledgeDocumentType =
  | "company"
  | "homepage"
  | "service"
  | "faq"
  | "about"
  | "why"
  | "trust"
  | "fleet"
  | "team"
  | "testimonial"
  | "gallery"
  | "blog"
  | "location"
  | "advertisement"
  | "application"
  | "contact";

export type KnowledgeSourceKind = "locale" | "firestore" | "cms" | "static";

export interface KnowledgeDocument {
  id: string;
  type: KnowledgeDocumentType;
  language: AgentLanguage;
  title: string;
  content: string;
  url?: string;
  slug?: string;
  source: KnowledgeSourceKind;
  sourcePath: string;
  keywords: string[];
  published?: boolean;
  updatedAt: string;
  version: number;
}

export const KNOWLEDGE_COLLECTION = "knowledgeDocuments";
export const AI_SERVICE_ACCOUNTS_COLLECTION = "aiServiceAccounts";
export const KNOWLEDGE_SCHEMA_VERSION = 1;

export interface IngestionReport {
  arabicDocuments: number;
  englishDocuments: number;
  totalDocuments: number;
  byType: Record<string, number>;
  skipped: string[];
  coverage: Record<string, boolean>;
}

export const AI_CONVERSATIONS_COLLECTION = "aiConversations";
export const AI_MESSAGES_SUBCOLLECTION = "messages";
export const KNOWLEDGE_CANDIDATES_COLLECTION = "knowledgeCandidates";
export const AI_LEADS_COLLECTION = "aiLeads";
export const AI_USAGE_LOGS_COLLECTION = "aiUsageLogs";
export const KNOWLEDGE_SYNC_COLLECTION = "knowledgeSync";
export const KNOWLEDGE_SYNC_STATUS_ID = "status";

export type KnowledgeCandidateStatus = "pending" | "approved" | "rejected";
export type AiLeadStatus = "new" | "contacted" | "closed";

export interface AiConversationRecord {
  conversationId: string;
  sessionId: string;
  language: AgentLanguage;
  startedAt: string;
  lastMessageAt: string;
  summary: string;
  customerContext: Record<string, unknown>;
  /** Denormalized for admin tables / CRM follow-up. */
  visitorName?: string;
  visitorPhone?: string;
  visitorEmail?: string;
  lastIntent?: string;
  status: "active" | "closed";
  leadStatus: "none" | "potential" | "handoff";
  leadId?: string;
}

export interface AiMessageRecord {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  intent?: string;
  entities?: string[];
  retrievedKnowledgeIds?: string[];
  confidence?: "high" | "medium" | "low";
}

export interface KnowledgeCandidateRecord {
  id: string;
  question: string;
  language: AgentLanguage;
  suggestedAnswer?: string;
  reason: string;
  sourceConversationId: string;
  status: KnowledgeCandidateStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface AiLeadRecord {
  id: string;
  name: string;
  phone: string;
  email: string;
  yachtType: string;
  yachtLength: string;
  location: string;
  serviceInterest: string[];
  conversationId: string;
  source: "ai_agent" | "chatbot";
  status: AiLeadStatus;
  createdAt: string;
  notes?: string;
  normalizedPhone?: string;
  leadScore?: number;
  lastIntent?: string;
  messageCount?: number;
  lastSeenAt?: string;
  updatedAt?: string;
  yachtMentioned?: boolean;
  detectedLanguage?: AgentLanguage;
}

export interface KnowledgeSyncStatus {
  needsReingest: boolean;
  reason?: string;
  requestedAt?: string;
  lastIngestAt?: string;
  lastIngestTotal?: number;
  lastError?: string;
}
