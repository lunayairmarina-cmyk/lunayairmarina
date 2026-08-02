import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";
import { loadCmsStore } from "@/lib/cms-store";
import { useOptionalSiteContent } from "@/providers/SiteContentProvider";
import logoOnLight from "@/assets/lunayairmarina.png";
import logoOnDark from "@/assets/lunayairmarina-on-dark.png";

interface LogoProps {
  /** `dark` = on light surfaces (navbar). `light` = on dark surfaces (footer/admin). */
  tone?: "light" | "dark";
  className?: string;
  compact?: boolean;
  align?: "start" | "center";
}

export function Logo({
  tone = "dark",
  className,
  compact = false,
  align = "start",
}: LogoProps) {
  const { t } = useLanguage();
  const site = useOptionalSiteContent();
  const customLogo = useMemo(() => loadCmsStore().logoUrl, [site?.bundle?.fetchedAt]);
  const src = customLogo || (tone === "light" ? logoOnDark : logoOnLight);
  const centered = align === "center";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center",
        centered ? "justify-center" : "justify-start",
        compact ? "h-14 w-32" : "h-16 w-44 sm:h-20 sm:w-56",
        className,
      )}
    >
      <img
        src={src}
        alt={t("brand.name")}
        width={compact ? 128 : 224}
        height={compact ? 128 : 224}
        className={cn(
          "h-full w-auto max-w-none bg-transparent object-contain",
          centered ? "object-center" : "object-left",
        )}
      />
    </span>
  );
}
