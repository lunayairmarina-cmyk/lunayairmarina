import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import en from "@/locales/en.json";
import ar from "@/locales/ar.json";
import { deepMergeCopy } from "@/lib/cms-store";
import { useOptionalSiteContent } from "@/providers/SiteContentProvider";

export type Language = "en" | "ar";
export type Direction = "ltr" | "rtl";

const bundledDictionaries: Record<Language, unknown> = { en, ar };
const STORAGE_KEY = "azura.language";

interface LanguageContextValue {
  language: Language;
  dir: Direction;
  isRTL: boolean;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  /** Translate a dot-path key to a string. */
  t: (key: string) => string;
  /** Translate a dot-path key to a typed array/object. */
  tv: <T>(key: string) => T;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function resolve(dict: unknown, key: string): unknown {
  return key.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object" && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, dict);
}

function LanguageProviderInner({ children }: { children: ReactNode }) {
  const siteContent = useOptionalSiteContent();
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "ar" || stored === "en") setLanguageState(stored);
  }, []);

  useEffect(() => {
    const dir: Direction = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
  }, [language]);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const value = useMemo<LanguageContextValue>(() => {
    const remote = siteContent?.bundle?.copy?.[language];
    const dict = deepMergeCopy(
      bundledDictionaries[language] as Record<string, unknown>,
      remote && Object.keys(remote).length > 0 ? remote : null,
    );
    const fallbackDict = bundledDictionaries[language] as Record<string, unknown>;
    const enDict = bundledDictionaries.en as Record<string, unknown>;
    const arDict = bundledDictionaries.ar as Record<string, unknown>;

    return {
      language,
      dir: language === "ar" ? "rtl" : "ltr",
      isRTL: language === "ar",
      setLanguage,
      toggleLanguage: () => setLanguage(language === "en" ? "ar" : "en"),
      t: (key: string) => {
        const found = resolve(dict, key);
        const bundled = resolve(fallbackDict, key);
        const enBundled = resolve(enDict, key);
        const arBundled = resolve(arDict, key);

        if (typeof found === "string" && found.trim() && found !== key) {
          // CMS sometimes saved English into the Arabic copy (or vice versa).
          // Prefer the bundled locale when the overlay matches the wrong language.
          if (
            language === "ar" &&
            typeof enBundled === "string" &&
            typeof arBundled === "string" &&
            found === enBundled &&
            arBundled !== enBundled
          ) {
            return arBundled;
          }
          if (
            language === "en" &&
            typeof arBundled === "string" &&
            typeof enBundled === "string" &&
            found === arBundled &&
            arBundled !== enBundled
          ) {
            return enBundled;
          }
          return found;
        }
        if (typeof bundled === "string") return bundled;
        return key;
      },
      tv: <T,>(key: string) => {
        const found = resolve(dict, key);
        return (found !== undefined ? found : resolve(fallbackDict, key)) as T;
      },
    };
  }, [language, setLanguage, siteContent?.bundle?.copy]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  return <LanguageProviderInner>{children}</LanguageProviderInner>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Fallback during rare route/error remounts so the app doesn't white-screen.
    const dict = bundledDictionaries.en;
    return {
      language: "en",
      dir: "ltr",
      isRTL: false,
      setLanguage: () => undefined,
      toggleLanguage: () => undefined,
      t: (key: string) => {
        const found = resolve(dict, key);
        return typeof found === "string" ? found : key;
      },
      tv: <T,>(key: string) => resolve(dict, key) as T,
    };
  }
  return ctx;
}
