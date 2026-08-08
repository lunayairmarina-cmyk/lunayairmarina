import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/pages")({
  head: () => ({
    meta: [{ name: "robots", content: "noindex, nofollow, noarchive" }],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/admin/content" });
  },
});
