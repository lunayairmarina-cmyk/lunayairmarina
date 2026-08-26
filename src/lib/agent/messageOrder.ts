import type { AiMessageRecord } from "@/lib/agent/types";

/** Oldest → newest. Ties: user before assistant, then message id. */
export function sortMessagesChronologically(
  messages: AiMessageRecord[],
): AiMessageRecord[] {
  const roleRank = (role: AiMessageRecord["role"]) => (role === "user" ? 0 : 1);
  return [...messages].sort((a, b) => {
    const byTime = a.timestamp.localeCompare(b.timestamp);
    if (byTime !== 0) return byTime;
    const byRole = roleRank(a.role) - roleRank(b.role);
    if (byRole !== 0) return byRole;
    return a.id.localeCompare(b.id);
  });
}

/** ISO timestamps for a user→assistant pair so sort never flips them. */
export function pairedMessageTimestamps(base = new Date()): {
  userAt: string;
  assistantAt: string;
} {
  const userMs = base.getTime();
  return {
    userAt: new Date(userMs).toISOString(),
    assistantAt: new Date(userMs + 1).toISOString(),
  };
}
