import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/trust")({
  head: () => ({
    meta: [
      { title: "Trust — lunayairmarina Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
});
