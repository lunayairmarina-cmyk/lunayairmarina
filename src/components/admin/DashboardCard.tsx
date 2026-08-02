import type { LucideIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { Counter } from "@/components/shared/Counter";
import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  suffix?: string;
  trend?: string;
  hint?: string;
  index?: number;
  to?: string;
  tone?: "default" | "gold" | "alert";
}

export function DashboardCard({
  icon: Icon,
  label,
  value,
  suffix,
  trend,
  hint,
  index = 0,
  to,
  tone = "default",
}: DashboardCardProps) {
  const { t } = useLanguage();
  const body = (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "group relative h-full overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-md",
        tone === "gold" && "border-gold/30 bg-gradient-to-br from-white to-gold/10",
        tone === "alert" && "border-navy/20 bg-gradient-to-br from-white to-navy/[0.04]",
        tone === "default" && "border-navy/8 hover:border-gold/35",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -end-8 -top-8 size-28 rounded-full bg-gold/10 transition-transform duration-500 group-hover:scale-110"
      />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[0.6rem] tracking-[0.22em] text-muted-foreground uppercase">
            {label}
          </p>
          <p className="mt-3 font-display text-4xl text-navy">
            <Counter value={value} suffix={suffix} />
          </p>
          {trend ? <p className="mt-2 text-xs text-gold">{trend}</p> : null}
          {hint ? <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{hint}</p> : null}
        </div>
        <span
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-full transition-colors duration-500",
            tone === "alert"
              ? "bg-gold/20 text-navy group-hover:bg-gold"
              : "bg-navy/5 text-navy group-hover:bg-gold group-hover:text-navy",
          )}
        >
          <Icon className="size-5" strokeWidth={1.4} />
        </span>
      </div>
      {to ? (
        <span className="relative mt-4 inline-flex items-center gap-1 text-[0.65rem] tracking-[0.16em] text-navy/50 uppercase transition-colors group-hover:text-gold">
          {t("admin.dashboard.viewAll")}
          <ArrowUpRight className="size-3.5 rtl:rotate-180" strokeWidth={1.6} />
        </span>
      ) : null}
    </motion.div>
  );

  if (!to) return body;

  return (
    <Link to={to} className="block h-full focus-visible:outline-none">
      {body}
    </Link>
  );
}
