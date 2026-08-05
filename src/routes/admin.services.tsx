import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/services")({
  head: () => ({
    meta: [
      { title: "Services — lunayairmarina Admin" },
      { name: "description", content: "Manage the services shown on the website." },
      { name: "robots", content: "noindex" },
    ],
  }),
});
