export type ChatLanguage = "ar" | "en";

export type ChatRole = "user" | "assistant";

export interface ChatHistoryItem {
  role: ChatRole;
  content: string;
}

export interface ChatRequest {
  message: string;
  language: ChatLanguage;
  sessionId: string;
  history: ChatHistoryItem[];
}

export type ChatErrorCode = "VALIDATION" | "RATE_LIMIT" | "SERVICE" | "CONFIG" | "TIMEOUT";

export interface ChatSuccessResponse {
  ok: true;
  reply: string;
}

export interface ChatErrorResponse {
  ok: false;
  code: ChatErrorCode;
}

export type ChatResponse = ChatSuccessResponse | ChatErrorResponse;
