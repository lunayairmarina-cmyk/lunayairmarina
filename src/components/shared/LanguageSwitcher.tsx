import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";

/** Pill language toggle: left = EN, right = Arabic. */
export function LanguageSwitcher({ tone = "dark" }: { tone?: "light" | "dark" }) {
  const { language, setLanguage } = useLanguage();
  const isArabic = language === "ar";

  return (
    <button
      type="button"
      dir="ltr"
      role="switch"
      aria-checked={isArabic}
      aria-label={isArabic ? "Switch to English" : "التبديل إلى العربية"}
      onClick={() => setLanguage(isArabic ? "en" : "ar")}
      className={cn(
        "relative isolate flex h-8 w-[3.625rem] shrink-0 items-center overflow-hidden rounded-full border border-navy/80 bg-[#f3f3f3] p-[3px]",
        tone === "light" && "border-navy-foreground/40 bg-navy-foreground/10",
      )}
    >
      {/* Idle labels on the track */}
      <span
        className={cn(
          "pointer-events-none absolute inset-y-0 left-[3px] z-0 flex w-[1.625rem] items-center justify-center text-[0.58rem] font-semibold tracking-[0.08em] text-navy/40 transition-opacity duration-200",
          !isArabic && "opacity-0",
        )}
      >
        EN
      </span>
      <span
        className={cn(
          "pointer-events-none absolute inset-y-0 right-[3px] z-0 flex w-[1.625rem] items-center justify-center font-arabic text-[0.85rem] font-semibold leading-none text-navy/40 transition-opacity duration-200",
          isArabic && "opacity-0",
        )}
      >
        ع
      </span>

      {/* Knob — letter centered with optical nudge for Arabic glyph */}
      <span
        aria-hidden
        className={cn(
          "relative z-10 grid size-[1.625rem] place-items-center rounded-full bg-navy text-white shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform",
          isArabic ? "translate-x-[1.625rem]" : "translate-x-0",
        )}
      >
        <span
          className={cn(
            "leading-none",
            isArabic
              ? "font-arabic -translate-x-px text-[0.85rem] font-semibold"
              : "text-[0.58rem] font-semibold tracking-[0.08em]",
          )}
        >
          {isArabic ? "ع" : "EN"}
        </span>
      </span>
    </button>
  );
}
