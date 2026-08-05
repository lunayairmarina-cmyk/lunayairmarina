import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/pages")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/content" });
  },
});
