import { createLazyFileRoute } from "@tanstack/react-router";
import { BlogAdminPage } from "@/features/admin/blog/BlogAdminPage";

export const Route = createLazyFileRoute("/admin/blog")({
  component: BlogAdminPage,
});
