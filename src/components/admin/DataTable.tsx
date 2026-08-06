import type { ReactNode } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  actions?: (row: T) => ReactNode;
}

export function DataTable<T>({ columns, rows, getRowId, actions }: DataTableProps<T>) {
  const { t } = useLanguage();

  return (
    <div className="overflow-hidden rounded-2xl border border-navy/8 bg-white shadow-sm">
      {/* Mobile card list */}
      <div className="divide-y divide-navy/8 md:hidden">
        {rows.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-navy/45">{t("admin.table.empty")}</p>
        ) : (
          rows.map((row, index) => (
            <motion.article
              key={getRowId(row)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03, duration: 0.35 }}
              className="space-y-2.5 p-3.5 sm:p-4"
            >
              {columns.map((column) => (
                <div key={column.key} className="min-w-0">
                  <p className="text-[0.6rem] tracking-[0.18em] text-navy/40 uppercase">
                    {column.header}
                  </p>
                  <div className="mt-1 text-sm text-navy">{column.render(row)}</div>
                </div>
              ))}
              {actions ? (
                <div className="flex flex-wrap gap-2 border-t border-navy/6 pt-3">
                  {actions(row)}
                </div>
              ) : null}
            </motion.article>
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="admin-table-scroll hidden overflow-x-auto md:block">
        <table className="w-full min-w-[640px] text-start text-sm">
          <thead>
            <tr className="border-b border-navy/8 bg-[#faf8f4]">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "px-4 py-4 text-start text-[0.6rem] font-medium tracking-[0.2em] text-navy/40 uppercase lg:px-5",
                    column.className,
                  )}
                >
                  {column.header}
                </th>
              ))}
              {actions ? (
                <th className="px-4 py-4 text-end text-[0.6rem] font-medium tracking-[0.2em] text-navy/40 uppercase lg:px-5">
                  {t("admin.table.actions")}
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-5 py-12 text-center text-sm text-navy/45"
                >
                  {t("admin.table.empty")}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <motion.tr
                  key={getRowId(row)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04, duration: 0.4 }}
                  className="border-b border-navy/6 transition-colors last:border-0 hover:bg-[#faf8f4]/80"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn("px-4 py-4 align-middle lg:px-5", column.className)}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                  {actions ? (
                    <td className="px-4 py-4 text-end lg:px-5">
                      <div className="flex justify-end gap-2">{actions(row)}</div>
                    </td>
                  ) : null}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function StatusBadge({ label, tone }: { label: string; tone: "active" | "draft" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.65rem] tracking-[0.14em] uppercase",
        tone === "active" ? "bg-gold/15 text-navy/80" : "bg-navy/6 text-navy/55",
      )}
    >
      <span
        className={cn("size-1.5 rounded-full", tone === "active" ? "bg-gold" : "bg-navy/35")}
      />
      {label}
    </span>
  );
}

export function RowAction({
  icon: Icon,
  label,
  onClick,
  tone = "default",
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  onClick: () => void;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "grid size-11 place-items-center rounded-xl border transition-colors",
        tone === "danger"
          ? "border-red-200 text-red-500 hover:border-red-400 hover:bg-red-50"
          : "border-navy/10 text-navy/55 hover:border-navy/25 hover:bg-[#faf8f4] hover:text-navy",
      )}
    >
      <Icon className="size-4" strokeWidth={1.5} />
    </button>
  );
}
