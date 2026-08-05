import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/content")({
  head: () => ({
    meta: [
      { title: "Website Content — lunayairmarina Admin" },
      { name: "description", content: "Edit all website copy, hero media, and about content." },
      { name: "robots", content: "noindex" },
    ],
  }),
});
