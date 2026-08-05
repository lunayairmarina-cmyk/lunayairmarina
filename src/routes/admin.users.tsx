import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "Users & Roles — lunayairmarina Admin" },
      { name: "description", content: "Manage admin users, roles and permissions." },
      { name: "robots", content: "noindex" },
    ],
  }),
});
