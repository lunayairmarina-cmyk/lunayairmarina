import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/messages")({
  head: () => ({
    meta: [
      { title: "Messages — lunayairmarina Admin" },
      { name: "description", content: "Inbox of website contact requests." },
      { name: "robots", content: "noindex, nofollow, noarchive" },
    ],
  }),
});
