import { useEffect, useMemo, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  Anchor,
  ArrowRight,
  ArrowUpRight,
  FileText,
  HelpCircle,
  Image as ImageIcon,
  MessageSquare,
  Newspaper,
  Quote,
  Settings,
  Ship,
  Sparkles,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DashboardCard } from "@/components/admin/DashboardCard";
import { StatusBadge } from "@/components/admin/DataTable";
import { useLanguage } from "@/lib/i18n";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useOptionalSiteContent } from "@/providers/SiteContentProvider";
import {
  faqRecords,
  galleryImages,
  messageRecords,
  serviceRecords,
  testimonialRecords,
  type MessageRecord,
} from "@/data/mock";
import { loadBlogPosts } from "@/data/blog";
import { SERVICE_SLUGS } from "@/data/services";
import { CMS_UPDATED_EVENT, loadCmsStore, type FirebaseSyncStatus } from "@/lib/cms-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — lunayairmarina Admin" },
      { name: "description", content: "Content management overview for lunayairmarina." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

interface LeadRecord {
  name?: string;
  email?: string;
  phone?: string;
  yachtType?: string;
  serviceNeeded?: string;
  message?: string;
  createdAt?: string;
}

function greetingKey(hour: number) {
  if (hour < 12) return "admin.dashboard.greeting.morning";
  if (hour < 18) return "admin.dashboard.greeting.afternoon";
  return "admin.dashboard.greeting.evening";
}

function DashboardPage() {
  const { t, language, isRTL } = useLanguage();
  const { user } = useAdminAuth();
  const site = useOptionalSiteContent();
  const CtaArrow = isRTL ? ArrowRight : ArrowUpRight;

  const [postsCount, setPostsCount] = useState(0);
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [recentInbox, setRecentInbox] = useState<MessageRecord[]>(() => messageRecords.slice(0, 5));
  const [inboxCount, setInboxCount] = useState(messageRecords.length);
  const [newMessageCount, setNewMessageCount] = useState(
    messageRecords.filter((item) => item.status === "new").length,
  );
  const [syncStatus, setSyncStatus] = useState<FirebaseSyncStatus>("unknown");
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const refreshLocal = () => {
      setPostsCount(loadBlogPosts().length);
      const cms = loadCmsStore();
      setSyncStatus(cms.firebaseSync);
      if (cms.messages.length) {
        const mapped: MessageRecord[] = cms.messages.map((item) => ({
          id: item.id,
          name: item.name,
          email: item.email,
          phone: item.phone,
          message: item.message,
          date: item.date,
          status: item.status,
        }));
        setInboxCount(mapped.length);
        setNewMessageCount(mapped.filter((item) => item.status === "new").length);
        setRecentInbox(mapped.slice(0, 5));
        setLeads(
          cms.messages
            .filter((item) => item.source === "contact-form")
            .slice(0, 8)
            .map((item) => ({
              name: item.name,
              email: item.email,
              phone: item.phone,
              yachtType: item.yachtType,
              serviceNeeded: item.serviceNeeded,
              message: item.message,
              createdAt: item.date,
            })),
        );
        return;
      }
      setRecentInbox(messageRecords.slice(0, 5));
      setInboxCount(messageRecords.length);
      setNewMessageCount(messageRecords.filter((item) => item.status === "new").length);
      try {
        const raw = window.localStorage.getItem("lunayairmarina-leads");
        const parsed = raw ? (JSON.parse(raw) as LeadRecord[]) : [];
        setLeads(Array.isArray(parsed) ? parsed.slice(0, 8) : []);
      } catch {
        setLeads([]);
      }
    };
    refreshLocal();
    window.addEventListener(CMS_UPDATED_EVENT, refreshLocal);
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => {
      window.removeEventListener(CMS_UPDATED_EVENT, refreshLocal);
      window.clearInterval(timer);
    };
  }, []);

  const galleryCount = site?.bundle?.gallery?.length || galleryImages.length;
  const servicesCount = site?.bundle?.services?.length || SERVICE_SLUGS.length || serviceRecords.length;
  const testimonialsCount =
    site?.bundle?.testimonials?.length || testimonialRecords.length;
  const faqCount = site?.bundle?.faq?.length || faqRecords.length;
  const newMessages = { length: newMessageCount };
  const firebaseReady = syncStatus === "synced";
  const syncLabel =
    syncStatus === "synced"
      ? t("admin.cms.syncSynced")
      : syncStatus === "error"
        ? t("admin.cms.syncError")
        : syncStatus === "local"
          ? t("admin.cms.syncLocal")
          : t("admin.cms.syncUnknown");

  const dateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(language === "ar" ? "ar-SA" : "en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(now),
    [language, now],
  );

  const quickActions = [
    {
      to: "/admin/content",
      icon: FileText,
      title: t("admin.dashboard.actions.content"),
      body: t("admin.dashboard.actions.contentHint"),
    },
    {
      to: "/admin/blog",
      icon: Newspaper,
      title: t("admin.dashboard.actions.blog"),
      body: t("admin.dashboard.actions.blogHint"),
    },
    {
      to: "/admin/messages",
      icon: MessageSquare,
      title: t("admin.dashboard.actions.messages"),
      body: t("admin.dashboard.actions.messagesHint"),
    },
    {
      to: "/admin/settings",
      icon: Settings,
      title: t("admin.dashboard.actions.settings"),
      body: t("admin.dashboard.actions.settingsHint"),
    },
  ] as const;

  const contentHealth = [
    { label: t("admin.nav.services"), value: servicesCount, to: "/admin/services", icon: Anchor },
    { label: t("admin.nav.blog"), value: postsCount, to: "/admin/blog", icon: Newspaper },
    { label: t("admin.nav.gallery"), value: galleryCount, to: "/admin/gallery", icon: ImageIcon },
    {
      label: t("admin.nav.testimonials"),
      value: testimonialsCount,
      to: "/admin/testimonials",
      icon: Quote,
    },
    { label: t("admin.nav.faq"), value: faqCount, to: "/admin/faq", icon: HelpCircle },
    {
      label: t("admin.dashboard.stats.messages"),
      value: inboxCount,
      to: "/admin/messages",
      icon: MessageSquare,
    },
  ];

  const activity = [
    {
      title: t("admin.dashboard.activityItems.content"),
      meta: t("admin.dashboard.activityItems.contentMeta"),
    },
    {
      title: t("admin.dashboard.activityItems.messages"),
      meta: t("admin.dashboard.activityItems.messagesMeta").replace(
        "{count}",
        String(newMessages.length),
      ),
    },
    {
      title: t("admin.dashboard.activityItems.firebase"),
      meta: firebaseReady
        ? t("admin.dashboard.activityItems.firebaseReady")
        : t("admin.dashboard.activityItems.firebasePending"),
    },
  ];

  return (
    <AdminLayout title={t("admin.dashboard.title")}>
      {/* Welcome band — light admin palette */}
      <section className="relative overflow-hidden rounded-2xl border border-navy/8 bg-white px-6 py-7 sm:px-8 sm:py-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(201,169,110,0.14),transparent_42%)]"
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 text-[0.65rem] tracking-[0.22em] text-navy/45 uppercase">
              <Sparkles className="size-3.5 text-gold" strokeWidth={1.6} />
              {t(greetingKey(now.getHours()))}
            </p>
            <h2 className="mt-3 font-display text-3xl leading-tight text-navy sm:text-4xl">
              {user?.name || t("brand.name")}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-navy/60 sm:text-base">
              {t("admin.dashboard.welcomeLead")}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-navy/50">
              <span className="rounded-full border border-navy/10 bg-[#faf8f4] px-3 py-1.5">
                {dateLabel}
              </span>
              <span className="rounded-full border border-gold/35 bg-gold/10 px-3 py-1.5 text-navy/70">
                {user ? t(`admin.users.roles.${user.role}`) : t("admin.portal")}
              </span>
              <span
                className={cn(
                  "rounded-full border px-3 py-1.5",
                  syncStatus === "synced"
                    ? "border-emerald-500/25 bg-emerald-50 text-emerald-700"
                    : syncStatus === "error"
                      ? "border-red-300/40 bg-red-50 text-red-700"
                      : "border-navy/10 bg-[#faf8f4] text-navy/55",
                )}
              >
                {syncLabel}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-navy bg-navy px-5 py-2.5 text-[0.7rem] tracking-[0.18em] text-white uppercase transition hover:bg-transparent hover:text-navy"
            >
              {t("admin.backToSite")}
              <CtaArrow className="size-3.5 rtl:rotate-180" strokeWidth={1.6} />
            </Link>
            <Link
              to="/admin/messages"
              className="inline-flex items-center gap-2 rounded-full border border-navy/15 bg-[#faf8f4] px-5 py-2.5 text-[0.7rem] tracking-[0.18em] text-navy uppercase transition hover:border-gold hover:bg-gold/10"
            >
              {t("admin.dashboard.actions.reviewInbox")}
              {newMessages.length > 0 ? (
                <span className="rounded-full bg-navy px-2 py-0.5 text-[0.65rem] text-white">
                  {newMessages.length}
                </span>
              ) : null}
            </Link>
          </div>
        </div>
      </section>

      {/* KPI grid */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <DashboardCard
          icon={Newspaper}
          label={t("admin.dashboard.stats.posts")}
          value={postsCount}
          hint={t("admin.dashboard.stats.postsHint")}
          to="/admin/blog"
          index={0}
        />
        <DashboardCard
          icon={Anchor}
          label={t("admin.dashboard.stats.services")}
          value={servicesCount}
          hint={t("admin.dashboard.stats.servicesHint")}
          to="/admin/services"
          index={1}
        />
        <DashboardCard
          icon={ImageIcon}
          label={t("admin.dashboard.stats.images")}
          value={galleryCount}
          hint={t("admin.dashboard.stats.imagesHint")}
          to="/admin/gallery"
          index={2}
        />
        <DashboardCard
          icon={MessageSquare}
          label={t("admin.dashboard.stats.messages")}
          value={inboxCount}
          trend={
            newMessages.length > 0
              ? t("admin.dashboard.stats.newMessages").replace("{count}", String(newMessages.length))
              : undefined
          }
          to="/admin/messages"
          tone={newMessages.length > 0 ? "alert" : "default"}
          index={3}
        />
        <DashboardCard
          icon={Quote}
          label={t("admin.dashboard.stats.testimonials")}
          value={testimonialsCount}
          to="/admin/testimonials"
          index={4}
        />
        <DashboardCard
          icon={Ship}
          label={t("admin.dashboard.stats.leads")}
          value={leads.length}
          hint={t("admin.dashboard.stats.leadsHint")}
          tone="gold"
          index={5}
        />
      </div>

      {/* Quick actions */}
      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-[0.65rem] tracking-[0.2em] text-gold uppercase">
              {t("admin.dashboard.actions.eyebrow")}
            </p>
            <h3 className="mt-1 font-display text-2xl text-navy">
              {t("admin.dashboard.actions.title")}
            </h3>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={action.to}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index, duration: 0.45 }}
              >
                <Link
                  to={action.to}
                  className="group flex h-full flex-col rounded-2xl border border-navy/8 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/40"
                >
                  <span className="grid size-10 place-items-center rounded-full bg-navy/5 text-navy transition-colors group-hover:bg-gold">
                    <Icon className="size-4" strokeWidth={1.5} />
                  </span>
                  <h4 className="mt-4 font-display text-lg text-navy">{action.title}</h4>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {action.body}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-[0.65rem] tracking-[0.16em] text-navy/45 uppercase transition-colors group-hover:text-gold">
                    {t("admin.dashboard.viewAll")}
                    <ArrowUpRight className="size-3.5 rtl:rotate-180" strokeWidth={1.6} />
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      <div className="mt-10 grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        {/* Inbox + leads */}
        <section className="rounded-2xl border border-navy/8 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-navy/8 px-5 py-4">
            <div>
              <h3 className="font-display text-xl text-navy">{t("admin.dashboard.recent")}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("admin.dashboard.recentHint")}
              </p>
            </div>
            <Link
              to="/admin/messages"
              className="inline-flex items-center gap-1 text-[0.65rem] tracking-[0.16em] text-navy/60 uppercase transition-colors hover:text-gold"
            >
              {t("admin.dashboard.viewAll")}
              <ArrowUpRight className="size-3.5 rtl:rotate-180" strokeWidth={1.6} />
            </Link>
          </div>

          <div className="divide-y divide-border/80">
            {recentInbox.map((row, index) => (
              <MessageRow key={row.id} row={row} index={index} />
            ))}
          </div>

          {leads.length > 0 ? (
            <div className="border-t border-navy/8 px-5 py-4">
              <p className="text-[0.65rem] tracking-[0.18em] text-muted-foreground uppercase">
                {t("admin.dashboard.leadsTitle")}
              </p>
              <ul className="mt-3 space-y-3">
                {leads.slice(0, 3).map((lead, index) => (
                  <li
                    key={`${lead.email ?? "lead"}-${index}`}
                    className="rounded-xl border border-navy/8 bg-[#faf8f4] px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-navy">
                          {lead.name || t("admin.dashboard.unknownLead")}
                        </p>
                        <p className="mt-1 truncate text-xs text-muted-foreground" dir="ltr">
                          {lead.email || lead.phone || "—"}
                        </p>
                      </div>
                      <StatusBadge label={t("admin.status.new")} tone="active" />
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-navy/65">
                      {[lead.yachtType, lead.serviceNeeded, lead.message]
                        .filter(Boolean)
                        .join(" · ") || t("admin.dashboard.leadFallback")}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        {/* Side panels */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-navy/8 bg-white p-5 shadow-sm">
            <p className="text-[0.65rem] tracking-[0.2em] text-gold uppercase">
              {t("admin.dashboard.health.eyebrow")}
            </p>
            <h3 className="mt-1 font-display text-xl text-navy">
              {t("admin.dashboard.health.title")}
            </h3>
            <ul className="mt-5 space-y-2">
              {contentHealth.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className="flex items-center justify-between gap-3 rounded-lg border border-transparent px-3 py-2.5 transition-colors hover:border-gold/25 hover:bg-[#faf8f4]"
                    >
                      <span className="inline-flex items-center gap-3 text-sm text-navy">
                        <span className="grid size-8 place-items-center rounded-full bg-navy/5 text-navy">
                          <Icon className="size-3.5" strokeWidth={1.5} />
                        </span>
                        {item.label}
                      </span>
                      <span className="font-display text-lg text-navy/80">{item.value}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="rounded-2xl border border-navy/8 bg-white p-5 shadow-sm">
            <p className="text-[0.65rem] tracking-[0.2em] text-gold uppercase">
              {t("admin.dashboard.activity")}
            </p>
            <h3 className="mt-1 font-display text-xl text-navy">
              {t("admin.dashboard.activityTitle")}
            </h3>
            <ol className="mt-5 space-y-4">
              {activity.map((item, index) => (
                <li key={item.title} className="flex gap-3">
                  <span className="mt-1 flex flex-col items-center">
                    <span className="size-2.5 rounded-full bg-gold" />
                    {index < activity.length - 1 ? (
                      <span className="mt-1 w-px flex-1 bg-border" />
                    ) : null}
                  </span>
                  <div className="pb-1">
                    <p className="text-sm text-navy">{item.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {item.meta}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}

function MessageRow({ row, index }: { row: MessageRecord; index: number }) {
  const { t } = useLanguage();

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-[#faf8f4]"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-navy/5 text-[0.7rem] tracking-wide text-navy">
        {row.name
          .split(" ")
          .slice(0, 2)
          .map((part) => part[0])
          .join("")
          .toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="truncate text-sm font-medium text-navy">{row.name}</p>
          <StatusBadge
            label={row.status === "new" ? t("admin.status.new") : t("admin.status.read")}
            tone={row.status === "new" ? "active" : "draft"}
          />
        </div>
        <p className="mt-1 truncate text-xs text-muted-foreground" dir="ltr">
          {row.email}
        </p>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-navy/70">{row.message}</p>
        <p className="mt-2 text-[0.65rem] tracking-[0.14em] text-muted-foreground uppercase">
          {row.date}
        </p>
      </div>
    </motion.article>
  );
}
