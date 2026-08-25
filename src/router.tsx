import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    // Always open pages at the top; do not restore prior scroll offsets.
    scrollRestoration: false,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
