import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/blog")({
  head: () => ({
    meta: [
      { title: "Blog — lunayairmarina Admin" },
      { name: "description", content: "Create and edit SEO-optimized blog posts." },
      { name: "robots", content: "noindex" },
    ],
  }),
});
