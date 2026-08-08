import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/team")({
  head: () => ({
    meta: [
      { title: "Team — lunayairmarina Admin" },
      { name: "robots", content: "noindex, nofollow, noarchive" },
    ],
  }),
});
