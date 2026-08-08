import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/testimonials")({
  head: () => ({
    meta: [
      { title: "Testimonials — lunayairmarina Admin" },
      { name: "description", content: "Manage client testimonials." },
      { name: "robots", content: "noindex, nofollow, noarchive" },
    ],
  }),
});
