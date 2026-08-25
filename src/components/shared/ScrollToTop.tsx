import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";

function resetWindowScroll() {
  const html = document.documentElement;
  const previous = html.style.scrollBehavior;
  html.style.scrollBehavior = "auto";

  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  html.scrollTop = 0;
  document.body.scrollTop = 0;

  // Nested scroll containers (admin shell / tables / drawers)
  document.querySelectorAll<HTMLElement>("[data-scroll-container]").forEach((el) => {
    el.scrollTop = 0;
    el.scrollLeft = 0;
  });

  html.style.scrollBehavior = previous;
}

/** Always jump to the top when navigating to a new page (ignores hash anchors). */
export function ScrollToTop() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const hash = useRouterState({ select: (state) => state.location.hash });
  const search = useRouterState({ select: (state) => state.location.searchStr });

  useEffect(() => {
    if (hash) return;

    resetWindowScroll();

    // Run again after paint / layout so late content does not leave mid-page scroll.
    const frame = requestAnimationFrame(() => {
      resetWindowScroll();
      requestAnimationFrame(resetWindowScroll);
    });
    const timer = window.setTimeout(resetWindowScroll, 50);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [pathname, search, hash]);

  return null;
}
