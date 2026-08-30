import { createServerFn } from "@tanstack/react-start";
import {
  deleteAllConversationsAdmin,
  deleteConversationAdmin,
} from "@/server/agent/conversationStoreAdmin";
import { getAdminFirestore } from "@/server/agent/firebaseAdmin";
import { runKnowledgeSyncNow } from "@/server/agent/knowledgeSync";

export const triggerKnowledgeSync = createServerFn({ method: "POST" }).handler(async () =>
  runKnowledgeSyncNow("admin_dashboard"),
);

export const deleteAiConversation = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const payload = data as { sessionId?: string; leadId?: string };
    if (!payload?.sessionId?.trim()) throw new Error("sessionId required");
    return { sessionId: payload.sessionId.trim(), leadId: payload.leadId?.trim() };
  })
  .handler(async ({ data }) => {
    try {
      const db = await getAdminFirestore();
      await deleteConversationAdmin(db, data.sessionId, data.leadId);
      return { ok: true as const };
    } catch (error) {
      return {
        ok: false as const,
        error: error instanceof Error ? error.message : "delete_failed",
      };
    }
  });

export const deleteAllAiConversations = createServerFn({ method: "POST" }).handler(async () => {
  try {
    const db = await getAdminFirestore();
    const deleted = await deleteAllConversationsAdmin(db);
    return { ok: true as const, deleted };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "delete_failed",
    };
  }
});
