import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [
      { title: "Settings — lunayairmarina Admin" },
      { name: "description", content: "Manage company details and social links." },
      { name: "robots", content: "noindex" },
    ],
  }),
});
