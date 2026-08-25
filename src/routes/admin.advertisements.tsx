import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/advertisements")({
  head: () => ({
    meta: [
      { title: "Advertising — lunayairmarina Admin" },
      { name: "robots", content: "noindex, nofollow, noarchive" },
    ],
  }),
});
