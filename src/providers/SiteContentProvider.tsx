import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getSiteContent, clearContentCache } from "@/services/content";
import { CMS_BROADCAST_CHANNEL, CMS_STORAGE_KEY, CMS_UPDATED_EVENT } from "@/lib/cms-store";
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
  const preferred = value[language];
  if (typeof preferred === "string" && preferred.trim()) return preferred;
  // Do not cross-fill EN↔AR — empty side should fall back via localizeOrFallback / t().
  return "";
}

/** True when a CMS string looks like an i18n key (e.g. hero.title) instead of real copy. */
export function looksLikeI18nKey(value: string | undefined | null): boolean {
  if (!value) return true;
  const trimmed = value.trim();
  if (!trimmed) return true;
  return /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/i.test(trimmed);
}

/** Detect English accidentally stored in an Arabic field (or vice versa). */
export function looksLikeWrongLanguage(value: string, language: Lang): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (looksLikeI18nKey(trimmed)) return true;
  if (language === "ar") {
    // Arabic UI expects Arabic script for marketing copy.
    return !/[\u0600-\u06FF]/.test(trimmed) && /[A-Za-z]{3,}/.test(trimmed);
  }
  // English UI should not be pure Arabic script.
  return /[\u0600-\u06FF]/.test(trimmed) && !/[A-Za-z]{3,}/.test(trimmed);
}

export function localizeOrFallback(
  value: LocalizedString | string | undefined,
  language: Lang,
  fallback: string,
): string {
  const localized = localizeValue(value, language);
  if (!localized || looksLikeWrongLanguage(localized, language)) return fallback;
  return localized;
}

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ContentStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [bundle, setBundle] = useState<SiteBundle | null>(null);

  const load = useCallback(async (force = false, quiet = false) => {
    if (!quiet) {
      setStatus("loading");
      setError(null);
    }
    try {
      if (force) clearContentCache();
      const next = await getSiteContent({ force });
      setBundle(next);
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load content");
      if (!quiet) setStatus("error");
    }
  }, []);

  useEffect(() => {
    void load(false);
  }, [load]);

  useEffect(() => {
    const onCms = () => {
      void load(true, true);
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key && event.key !== CMS_STORAGE_KEY) return;
      onCms();
    };
    window.addEventListener(CMS_UPDATED_EVENT, onCms);
    window.addEventListener("storage", onStorage);

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(CMS_BROADCAST_CHANNEL);
      channel.onmessage = () => onCms();
    } catch {
      // ignore
    }

    const poll = window.setInterval(() => {
      void load(true, true);
    }, 60_000);

    return () => {
      window.removeEventListener(CMS_UPDATED_EVENT, onCms);
      window.removeEventListener("storage", onStorage);
      window.clearInterval(poll);
      channel?.close();
    };
  }, [load]);

  const value = useMemo<SiteContentContextValue>(
    () => ({
      status,
      error,
      bundle,
      reload: () => load(true, true),
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
