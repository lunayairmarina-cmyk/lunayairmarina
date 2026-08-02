import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getSiteContent, clearContentCache } from "@/services/contentService";
import { CMS_UPDATED_EVENT } from "@/lib/cms-store";
import type { LocalizedString, SiteBundle } from "@/types/content";

type Lang = "en" | "ar";
type ContentStatus = "idle" | "loading" | "ready" | "error";

interface SiteContentContextValue {
  status: ContentStatus;
  error: string | null;
  bundle: SiteBundle | null;
  reload: () => Promise<void>;
  localize: (value: LocalizedString | string | undefined, language: Lang) => string;
}

const SiteContentContext = createContext<SiteContentContextValue | null>(null);

export function localizeValue(
  value: LocalizedString | string | undefined,
  language: Lang,
): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[language] || value.en || value.ar || "";
}

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ContentStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [bundle, setBundle] = useState<SiteBundle | null>(null);

  const load = useCallback(async (force = false) => {
    setStatus("loading");
    setError(null);
    try {
      if (force) clearContentCache();
      const next = await getSiteContent({ force });
      setBundle(next);
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load content");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void load(false);
  }, [load]);

  useEffect(() => {
    const onCms = () => {
      void load(true);
    };
    window.addEventListener(CMS_UPDATED_EVENT, onCms);
    return () => window.removeEventListener(CMS_UPDATED_EVENT, onCms);
  }, [load]);

  const value = useMemo<SiteContentContextValue>(
    () => ({
      status,
      error,
      bundle,
      reload: () => load(true),
      localize: localizeValue,
    }),
    [status, error, bundle, load],
  );

  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>;
}

export function useSiteContent(): SiteContentContextValue {
  const ctx = useContext(SiteContentContext);
  if (!ctx) {
    throw new Error("useSiteContent must be used within SiteContentProvider");
  }
  return ctx;
}

export function useOptionalSiteContent(): SiteContentContextValue | null {
  return useContext(SiteContentContext);
}
