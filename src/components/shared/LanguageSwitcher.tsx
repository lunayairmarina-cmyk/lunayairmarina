import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";

export function LanguageSwitcher({ tone = "dark" }: { tone?: "light" | "dark" }) {
  const { language, setLanguage } = useLanguage();
  const base = tone === "light" ? "text-navy-foreground/70" : "text-navy/60";

  return (
    <div className={cn("flex items-center gap-2 text-xs tracking-[0.16em]", base)}>
      <button
        type="button"
        onClick={() => setLanguage("en")}
        aria-pressed={language === "en"}
        className={cn(
          "transition-colors hover:text-gold",
          language === "en" && "text-gold",
        )}
      >
        EN
      </button>
      <span aria-hidden className="opacity-40">
        |
      </span>
      <button
        type="button"
        onClick={() => setLanguage("ar")}
        aria-pressed={language === "ar"}
        className={cn(
          "font-arabic transition-colors hover:text-gold",
          language === "ar" && "text-gold",
        )}
      >
        العربية
      </button>
    </div>
  );
}
