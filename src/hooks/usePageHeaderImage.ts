import { useMemo } from "react";
import { loadCmsStore, type PageHeaderId } from "@/lib/cms-store";
import { useOptionalSiteContent } from "@/providers/SiteContentProvider";

export function usePageHeaderImage(pageId: PageHeaderId, fallback: string) {
  const site = useOptionalSiteContent();
  return useMemo(() => {
    const fromCms = loadCmsStore().pageHeaders[pageId];
    return fromCms || fallback;
  }, [pageId, fallback, site?.bundle?.fetchedAt]);
}
