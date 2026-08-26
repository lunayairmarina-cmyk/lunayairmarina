import { createServerFn } from "@tanstack/react-start";
import { runKnowledgeSyncNow } from "@/server/agent/knowledgeSync";

export const triggerKnowledgeSync = createServerFn({ method: "POST" }).handler(async () =>
  runKnowledgeSyncNow("admin_dashboard"),
);
