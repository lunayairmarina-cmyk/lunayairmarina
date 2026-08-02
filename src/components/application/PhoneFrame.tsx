import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PhoneFrame({
  children,
  className,
  glow = true,
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div className={cn("relative mx-auto w-[270px] sm:w-[300px]", className)}>
      {glow ? (
        <div
          aria-hidden
          className="absolute -inset-8 rounded-[3rem] bg-gold/15 blur-3xl"
        />
      ) : null}
      <div className="relative overflow-hidden rounded-[2.4rem] border border-white/20 bg-[#0b1220] p-[10px] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.7)]">
        <div className="absolute inset-x-0 top-0 z-20 flex justify-center pt-3">
          <div className="h-6 w-28 rounded-full bg-black/90" />
        </div>
        <div className="relative aspect-[9/19.5] overflow-hidden rounded-[1.9rem] bg-gradient-to-b from-[#102033] to-[#07111d]">
          {children}
        </div>
      </div>
    </div>
  );
}

export function TankRing({
  value,
  color,
  label,
}: {
  value: number;
  color: string;
  label: string;
}) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative size-20">
        <svg viewBox="0 0 72 72" className="size-full -rotate-90">
          <circle cx="36" cy="36" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
          <circle
            cx="36"
            cy="36"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-1000 ease-out"
          />
        </svg>
        <span className="absolute inset-0 grid place-items-center text-sm font-medium text-white">
          {value}%
        </span>
      </div>
      <span className="text-[0.65rem] tracking-[0.14em] text-white/60 uppercase">{label}</span>
    </div>
  );
}
