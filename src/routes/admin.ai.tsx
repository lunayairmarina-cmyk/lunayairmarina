import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/ai")({
  head: () => ({
    meta: [
      { title: "AI Agent — lunayairmarina Admin" },
      { name: "description", content: "AI conversations, leads, and knowledge candidates." },
      { name: "robots", content: "noindex, nofollow, noarchive" },
    ],
  }),
});
