import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — lunayairmarina Admin" },
      { name: "description", content: "Manage frequently asked questions." },
      { name: "robots", content: "noindex" },
    ],
  }),
});
