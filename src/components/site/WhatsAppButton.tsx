import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n";
import { useCompanySettings } from "@/hooks/useCompanySettings";

function waitForFirstContentfulPaint(): Promise<void> {
  return new Promise((resolve) => {
    const done = () => resolve();

    try {
      const existing = performance.getEntriesByName("first-contentful-paint");
      if (existing.length > 0) {
        done();
        return;
      }
    } catch {
      // ignore
    }

    if (typeof PerformanceObserver === "undefined") {
      window.setTimeout(done, 400);
      return;
    }

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      try {
        observer.disconnect();
      } catch {
        // ignore
      }
      done();
    };

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === "first-contentful-paint") {
          finish();
          return;
        }
      }
    });

    try {
      observer.observe({ type: "paint", buffered: true });
    } catch {
      window.setTimeout(finish, 400);
      return;
    }

    // Safety: never block the FAB forever if FCP isn't reported.
    window.setTimeout(finish, 2500);
  });
}

export function WhatsAppButton() {
  const { t, isRTL } = useLanguage();
  const settings = useCompanySettings();
  const [ready, setReady] = useState(false);
  const href = `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(t("whatsapp.prefill"))}`;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await waitForFirstContentfulPaint();
      // Small buffer so hero/nav are painted before the FAB draws attention.
      await new Promise((r) => window.setTimeout(r, 350));
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Not in the DOM until after FCP — avoids WhatsApp winning first paint.
  if (!ready) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={t("whatsapp.label")}
      className={`fixed z-50 inline-flex size-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-luxe transition-transform duration-300 hover:-translate-y-0.5 hover:bg-[#1ebe57] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-gold bottom-[max(1rem,env(safe-area-inset-bottom))] sm:size-14 sm:bottom-[max(1.5rem,env(safe-area-inset-bottom))] ${
        isRTL ? "right-4 sm:right-7" : "left-4 sm:left-7"
      }`}
    >
      <svg viewBox="0 0 32 32" aria-hidden="true" className="size-7 fill-current">
        <path d="M16.04 3A12.93 12.93 0 0 0 5.06 22.77L3 30l7.42-2a12.95 12.95 0 1 0 5.62-25Zm0 23.72a10.7 10.7 0 0 1-5.46-1.5l-.39-.23-4.4 1.18 1.17-4.27-.25-.4a10.75 10.75 0 1 1 9.33 5.22Zm5.9-8.03c-.32-.16-1.91-.94-2.2-1.05-.3-.11-.52-.16-.73.16-.22.32-.84 1.05-1.03 1.27-.19.21-.38.24-.7.08-.33-.16-1.37-.5-2.6-1.6a9.76 9.76 0 0 1-1.8-2.24c-.19-.32-.02-.5.14-.66.15-.15.33-.38.49-.57.16-.19.21-.32.32-.54.11-.21.05-.4-.03-.57-.08-.16-.73-1.75-1-2.4-.26-.63-.53-.54-.73-.55h-.62c-.21 0-.56.08-.86.4-.3.33-1.13 1.11-1.13 2.7 0 1.6 1.16 3.14 1.32 3.35.16.22 2.28 3.49 5.53 4.9.77.33 1.38.53 1.85.68.78.25 1.48.21 2.04.13.62-.1 1.91-.79 2.18-1.54.27-.76.27-1.41.19-1.54-.08-.14-.3-.22-.62-.38Z" />
      </svg>
    </a>
  );
}
