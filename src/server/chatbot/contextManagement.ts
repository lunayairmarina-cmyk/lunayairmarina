import type { ChatHistoryItem } from "@/lib/chatbot/types";
import { estimateTokens } from "@/server/agent/normalize";
import type { ChatbotConfig } from "./config";

export function trimHistory(history: ChatHistoryItem[], maxItems: number): ChatHistoryItem[] {
  if (history.length <= maxItems) return history;
  return history.slice(-maxItems);
}

/**
 * Select recent turns for Gemini only. Full client history remains unlimited for
 * validation and Firestore persistence; older context is covered via conversation summary.
 */
export function prepareGeminiHistory(
  history: ChatHistoryItem[],
  config: ChatbotConfig,
): ChatHistoryItem[] {
  let selected = trimHistory(history, config.geminiMaxHistoryItems);

  const budget = config.geminiHistoryTokenBudget;
  if (budget <= 0 || selected.length <= 2) return selected;

  while (selected.length > 2 && historyTokenEstimate(selected) > budget) {
    selected = selected.slice(1);
  }

  return selected;
}

function historyTokenEstimate(history: ChatHistoryItem[]): number {
  return history.reduce((sum, item) => sum + estimateTokens(item.content), 0);
}
