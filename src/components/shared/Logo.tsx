import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";

/** Canonical site logo: `public/LM-Logo.png` */
const SITE_LOGO = "/LM-Logo.png?v=13";

interface LogoProps {
  /** `dark` = on light surfaces (navbar). `light` = on dark surfaces (footer/admin). */
  tone?: "light" | "dark";
  className?: string;
  compact?: boolean;
  align?: "start" | "center";
}

export function Logo({ tone = "dark", className, compact = false, align = "start" }: LogoProps) {
  const { t } = useLanguage();
  const centered = align === "center";
  void tone;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center",
        centered ? "justify-center" : "justify-start",
        compact ? "h-14 w-28" : "h-16 w-36 sm:h-20 sm:w-44",
        className,
      )}
    >
      <img
        src={SITE_LOGO}
        alt={t("brand.name")}
        width={compact ? 112 : 176}
        height={compact ? 112 : 176}
        className={cn(
          "h-full w-auto max-w-none bg-transparent object-contain",
          centered ? "object-center" : "object-left",
        )}
      />
    </span>
  );
}
