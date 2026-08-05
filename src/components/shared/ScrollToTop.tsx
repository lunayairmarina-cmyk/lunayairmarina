import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";

/** Always jump to the top when navigating to a new page (ignores hash anchors). */
export function ScrollToTop() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const hash = useRouterState({ select: (state) => state.location.hash });
  const search = useRouterState({ select: (state) => state.location.searchStr });

  useEffect(() => {
    if (hash) return;

    const html = document.documentElement;
    const previous = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto";

    window.scrollTo(0, 0);
    html.scrollTop = 0;
    document.body.scrollTop = 0;

    html.style.scrollBehavior = previous;
  }, [pathname, search, hash]);

  return null;
}
