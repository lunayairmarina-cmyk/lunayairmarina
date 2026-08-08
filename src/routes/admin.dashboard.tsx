import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — lunayairmarina Admin" },
      { name: "description", content: "Content management overview for lunayairmarina." },
      { name: "robots", content: "noindex, nofollow, noarchive" },
    ],
  }),
});
