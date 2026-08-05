import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/gallery")({
  head: () => ({
    meta: [
      { title: "Gallery — lunayairmarina Admin" },
      { name: "description", content: "Manage gallery images." },
      { name: "robots", content: "noindex" },
    ],
  }),
});
