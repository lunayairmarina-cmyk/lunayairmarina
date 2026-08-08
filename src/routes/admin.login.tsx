import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Admin Portal — lunayairmarina" },
      { name: "description", content: "Sign in to manage lunayairmarina website content." },
      { name: "robots", content: "noindex, nofollow, noarchive" },
      { property: "og:title", content: "Admin Portal — lunayairmarina" },
      { property: "og:description", content: "Sign in to manage lunayairmarina website content." },
    ],
  }),
});
