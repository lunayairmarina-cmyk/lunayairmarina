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
import { deepMergeCopy, repairWrongLanguageCopy } from "@/lib/cms-store";
import { useOptionalSiteContent } from "@/providers/SiteContentProvider";

export type Language = "en" | "ar";
export type Direction = "ltr" | "rtl";

const bundledDictionaries: Record<Language, unknown> = { en, ar };
const STORAGE_KEY = "azura.language";
const COOKIE_KEY = "azura.language";
/** Site default — Arabic-first for Lunayair Marina. */
const DEFAULT_LANGUAGE: Language = "ar";

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

function parseLanguage(value: string | null | undefined): Language | null {
  if (value === "ar" || value === "en") return value;
  return null;
}

function readCookieLanguage(): Language | null {
  if (typeof document === "undefined") return null;
  try {
    const match = document.cookie.match(/(?:^|;\s*)azura\.language=(ar|en)(?:;|$)/);
    return parseLanguage(match?.[1]);
  } catch {
    return null;
  }
}

function readStoredLanguage(): Language {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  try {
    const stored = parseLanguage(window.localStorage.getItem(STORAGE_KEY));
    if (stored) return stored;
  } catch {
    // ignore
  }
  return readCookieLanguage() ?? DEFAULT_LANGUAGE;
}

function persistLanguage(next: Language) {
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
    document.cookie = `${COOKIE_KEY}=${next};path=/;max-age=31536000;SameSite=Lax`;
  } catch {
    // ignore
  }
}

function repairString(
  found: string,
  language: Language,
  enBundled: unknown,
  arBundled: unknown,
): string {
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
  // Latin-only text in Arabic mode → prefer bundled Arabic when available.
  if (
    language === "ar" &&
    typeof arBundled === "string" &&
    arBundled.trim() &&
    !/[\u0600-\u06FF]/.test(found) &&
    /[A-Za-z]{3,}/.test(found) &&
    /[\u0600-\u06FF]/.test(arBundled)
  ) {
    return arBundled;
  }
  return found;
}

function repairTree(node: unknown, language: Language, enNode: unknown, arNode: unknown): unknown {
  if (typeof node === "string") {
    return repairString(node, language, enNode, arNode);
  }
  if (Array.isArray(node)) {
    return node.map((item, index) =>
      repairTree(
        item,
        language,
        Array.isArray(enNode) ? enNode[index] : undefined,
        Array.isArray(arNode) ? arNode[index] : undefined,
      ),
    );
  }
  if (node && typeof node === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      result[key] = repairTree(
        value,
        language,
        enNode && typeof enNode === "object" ? (enNode as Record<string, unknown>)[key] : undefined,
        arNode && typeof arNode === "object" ? (arNode as Record<string, unknown>)[key] : undefined,
      );
    }
    return result;
  }
  return node;
}

function LanguageProviderInner({ children }: { children: ReactNode }) {
  const siteContent = useOptionalSiteContent();
  const [language, setLanguageState] = useState<Language>(readStoredLanguage);

  useEffect(() => {
    const dir: Direction = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
    persistLanguage(language);
  }, [language]);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    persistLanguage(next);
  }, []);

  const value = useMemo<LanguageContextValue>(() => {
    const enDict = bundledDictionaries.en as Record<string, unknown>;
    const arDict = bundledDictionaries.ar as Record<string, unknown>;
    const fallbackDict = bundledDictionaries[language] as Record<string, unknown>;
    const remoteRaw = siteContent?.bundle?.copy?.[language];
    const remote =
      remoteRaw && Object.keys(remoteRaw).length > 0
        ? repairWrongLanguageCopy(
            remoteRaw,
            language === "ar" ? arDict : enDict,
            language === "ar" ? enDict : arDict,
          )
        : null;
    const dict = deepMergeCopy(fallbackDict, remote);

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
          return repairString(found, language, enBundled, arBundled);
        }
        if (typeof bundled === "string") return bundled;
        return key;
      },
      tv: <T,>(key: string) => {
        const found = resolve(dict, key);
        const bundled = resolve(fallbackDict, key);
        const value = found !== undefined ? found : bundled;
        const repaired = repairTree(value, language, resolve(enDict, key), resolve(arDict, key));
        return repaired as T;
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
    const dict = bundledDictionaries.ar;
    return {
      language: "ar",
      dir: "rtl",
      isRTL: true,
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
