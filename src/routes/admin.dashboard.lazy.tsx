import { createLazyFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/features/admin/dashboard/DashboardPage";

export const Route = createLazyFileRoute("/admin/dashboard")({
  component: DashboardPage,
});
