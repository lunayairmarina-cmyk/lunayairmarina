import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/why")({
  head: () => ({
    meta: [
      { title: "Why Choose Us — lunayairmarina Admin" },
      { name: "robots", content: "noindex, nofollow, noarchive" },
    ],
  }),
});
