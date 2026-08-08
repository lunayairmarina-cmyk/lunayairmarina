import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/seo")({
  head: () => ({
    meta: [
      { title: "SEO — lunayairmarina Admin" },
      { name: "description", content: "Manage SEO titles, descriptions and OG images." },
      { name: "robots", content: "noindex, nofollow, noarchive" },
    ],
  }),
});
