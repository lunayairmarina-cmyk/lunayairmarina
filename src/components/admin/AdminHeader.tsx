import { Link } from "@tanstack/react-router";
import { Bell, ExternalLink, Menu, Search } from "lucide-react";
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
    <header className="sticky top-0 z-30 border-b border-navy/8 bg-[#faf8f4]/90 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4 px-5 py-4 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenu}
            aria-label="Open menu"
            className="rounded-lg p-2 text-navy lg:hidden"
          >
            <Menu className="size-5" strokeWidth={1.5} />
          </button>
          <h1 className="truncate font-display text-xl text-navy sm:text-2xl">{title}</h1>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-navy/10 bg-white px-3 py-2 md:flex">
            <Search className="size-4 text-navy/40" strokeWidth={1.5} />
            <input
              type="search"
              placeholder={t("admin.search")}
              className="w-36 bg-transparent text-sm outline-none"
            />
          </div>
          <LanguageSwitcher />
          <button
            type="button"
            aria-label="Notifications"
            className="relative grid size-9 place-items-center rounded-full border border-navy/10 bg-white text-navy/60 transition-colors hover:text-navy"
          >
            <Bell className="size-4" strokeWidth={1.5} />
            <span className="absolute top-2 end-2 size-1.5 rounded-full bg-gold" />
          </button>
          <Link
            to="/"
            className="hidden items-center gap-2 rounded-full border border-navy/10 bg-white px-3 py-2 text-xs text-navy/65 transition-colors hover:border-gold hover:text-navy sm:flex"
          >
            <ExternalLink className="size-3.5" strokeWidth={1.5} />
            {t("admin.backToSite")}
          </Link>
          <span
            title={user?.name ?? t("brand.name")}
            className="grid size-9 place-items-center rounded-full bg-navy text-[0.65rem] tracking-wide text-white"
          >
            {initials}
          </span>
        </div>
      </div>
    </header>
  );
}
