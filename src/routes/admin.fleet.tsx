import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/fleet")({
  head: () => ({
    meta: [
      { title: "Fleet — lunayairmarina Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
});
