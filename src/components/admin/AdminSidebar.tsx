import { Link, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import {
  Anchor,
  Award,
  FileText,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Quote,
  Search,
  Settings,
  HelpCircle,
  Users,
  Newspaper,
  Ship,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import type { AdminPermission } from "@/lib/admin-roles";
import { Logo } from "@/components/shared/Logo";

const navItems: {
  to: string;
  key: string;
  icon: typeof LayoutDashboard;
  permission: AdminPermission;
}[] = [
  { to: "/admin/dashboard", key: "admin.nav.dashboard", icon: LayoutDashboard, permission: "dashboard" },
  { to: "/admin/content", key: "admin.nav.content", icon: FileText, permission: "content" },
  { to: "/admin/services", key: "admin.nav.services", icon: Anchor, permission: "services" },
  { to: "/admin/why", key: "admin.nav.why", icon: Award, permission: "why" },
  { to: "/admin/trust", key: "admin.nav.trust", icon: ShieldCheck, permission: "trust" },
  { to: "/admin/team", key: "admin.nav.team", icon: UserRound, permission: "team" },
  { to: "/admin/fleet", key: "admin.nav.fleet", icon: Ship, permission: "fleet" },
  { to: "/admin/blog", key: "admin.nav.blog", icon: Newspaper, permission: "blog" },
  { to: "/admin/gallery", key: "admin.nav.gallery", icon: ImageIcon, permission: "gallery" },
  { to: "/admin/testimonials", key: "admin.nav.testimonials", icon: Quote, permission: "testimonials" },
  { to: "/admin/faq", key: "admin.nav.faq", icon: HelpCircle, permission: "faq" },
  { to: "/admin/messages", key: "admin.nav.messages", icon: MessageSquare, permission: "messages" },
  { to: "/admin/seo", key: "admin.nav.seo", icon: Search, permission: "seo" },
  { to: "/admin/users", key: "admin.nav.users", icon: Users, permission: "users" },
  { to: "/admin/settings", key: "admin.nav.settings", icon: Settings, permission: "settings" },
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "LM";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useLanguage();
  const { logout, can, user } = useAdminAuth();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const visibleItems = navItems.filter((item) => {
    if (item.permission === "content") return can("content") || can("pages");
    return can(item.permission);
  });
  const roleLabel = user ? t(`admin.users.roles.${user.role}`) : t("admin.portal");

  return (
    <div className="flex h-full flex-col bg-[#f4f0e8] text-navy">
      {/* Logo only — no broken truncated brand text */}
      <div className="flex flex-col items-center border-b border-navy/8 px-5 py-6">
        <Logo tone="dark" align="center" className="h-16 w-40" />
        <span className="mt-3 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-[0.6rem] tracking-[0.16em] text-navy/70 uppercase">
          {roleLabel}
        </span>
      </div>

      <nav className="admin-hide-scrollbar flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {visibleItems.map((item) => {
            const active =
              pathname === item.to ||
              (item.to === "/admin/content" && pathname.startsWith("/admin/pages"));
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  onClick={onNavigate}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-300",
                    active
                      ? "bg-navy text-white shadow-sm"
                      : "text-navy/65 hover:bg-white/80 hover:text-navy",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-lg transition-colors",
                      active ? "bg-white/10 text-gold" : "bg-white/70 text-navy/55 group-hover:text-navy",
                    )}
                  >
                    <Icon className="size-4" strokeWidth={1.5} />
                  </span>
                  <span className="truncate font-medium">{t(item.key)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-navy/8 p-3">
        {user ? (
          <div className="mb-2 flex items-center gap-3 rounded-xl bg-white/70 px-3 py-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-navy text-[0.65rem] tracking-wide text-white">
              {initials(user.name)}
            </span>
            <span className="min-w-0">
              <p className="truncate text-xs font-medium text-navy">{user.name}</p>
              <p className="truncate text-[0.65rem] text-navy/45" dir="ltr">
                {user.email}
              </p>
            </span>
          </div>
        ) : null}
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-navy/55 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="size-4 shrink-0 rtl:rotate-180" strokeWidth={1.5} />
          {t("admin.nav.logout")}
        </button>
      </div>
    </div>
  );
}

export function AdminSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      <aside className="admin-hide-scrollbar fixed inset-y-0 right-0 z-40 hidden w-72 overflow-hidden border-l border-navy/10 lg:block">
        <SidebarBody />
      </aside>

      <AnimatePresence>
        {open ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-50 bg-navy/40 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="admin-hide-scrollbar fixed inset-y-0 right-0 z-50 w-72 overflow-hidden shadow-luxe lg:hidden"
            >
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute top-3 left-3 z-10 grid size-11 place-items-center rounded-md text-navy/50 transition-colors hover:bg-navy/5 hover:text-navy"
              >
                <X className="size-5" strokeWidth={1.5} />
              </button>
              <SidebarBody onNavigate={onClose} />
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
