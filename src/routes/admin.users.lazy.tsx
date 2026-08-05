import { createLazyFileRoute } from "@tanstack/react-router";
import { UsersAdminPage } from "@/features/admin/users/UsersAdminPage";

export const Route = createLazyFileRoute("/admin/users")({
  component: UsersAdminPage,
});
