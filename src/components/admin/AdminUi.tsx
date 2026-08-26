import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AdminCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn("rounded-2xl border border-navy/8 bg-white p-4 shadow-sm sm:p-6", className)}
    >
      {children}
    </div>
  );
}

export function AdminPrimaryButton({
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-navy px-5 py-3 text-xs tracking-[0.18em] text-white uppercase transition-colors hover:bg-navy/90 disabled:opacity-50 sm:w-auto",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function AdminToolbar({ children }: { children: ReactNode }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
      {children}
    </div>
  );
}
