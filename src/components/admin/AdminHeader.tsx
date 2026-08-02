import { Link } from "@tanstack/react-router";
import { ExternalLink, Menu } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { useAdminAuth } from "@/hooks/useAdminAuth";

interface AdminHeaderProps {
  title: string;
  onMenu: () => void;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "LM";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function AdminHeader({ title, onMenu }: AdminHeaderProps) {
  const { t } = useLanguage();
  const { user } = useAdminAuth();
  const initials = getInitials(user?.name || t("brand.name"));

  return (
    <header className="sticky top-0 z-30 border-b border-navy/8 bg-[#faf8f4]/95 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-5 sm:py-4 lg:px-8">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onMenu}
            aria-label="Open menu"
            className="grid size-11 shrink-0 place-items-center rounded-lg text-navy hover:bg-navy/5 lg:hidden"
          >
            <Menu className="size-5" strokeWidth={1.5} />
          </button>
          <h1 className="truncate font-display text-lg text-navy sm:text-xl md:text-2xl">{title}</h1>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>
          <Link
            to="/"
            aria-label={t("admin.backToSite")}
            className="grid size-11 place-items-center rounded-full border border-navy/10 bg-white text-navy/65 transition-colors hover:border-gold hover:text-navy sm:hidden"
          >
            <ExternalLink className="size-4" strokeWidth={1.5} />
          </Link>
          <Link
            to="/"
            className="hidden items-center gap-2 rounded-full border border-navy/10 bg-white px-3 py-2 text-xs text-navy/65 transition-colors hover:border-gold hover:text-navy sm:flex"
          >
            <ExternalLink className="size-3.5" strokeWidth={1.5} />
            {t("admin.backToSite")}
          </Link>
          <span
            title={user?.name ?? t("brand.name")}
            className="grid size-10 place-items-center rounded-full bg-navy text-[0.65rem] tracking-wide text-white sm:size-9"
          >
            {initials}
          </span>
        </div>
      </div>
      <div className="border-t border-navy/6 px-3 py-1 sm:hidden">
        <LanguageSwitcher />
      </div>
    </header>
  );
}
