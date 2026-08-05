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
          className="absolute -inset-6 rounded-[3rem] bg-gold/20 blur-2xl"
        />
      ) : null}
      <div className="relative overflow-hidden rounded-[2.4rem] border border-white/45 bg-[#0b1220] p-[10px] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.85)] ring-1 ring-white/20">
        <div className="absolute inset-x-0 top-0 z-20 flex justify-center pt-3">
          <div className="h-5 w-24 rounded-full bg-black/80" />
        </div>
        <div className="relative aspect-[9/19] overflow-hidden rounded-[1.9rem] bg-[#07111d]">
          {children}
        </div>
      </div>
    </div>
  );
}

export function PhoneScreenshot({
  src,
  alt = "",
  priority = false,
}: {
  src: string;
  alt?: string;
  priority?: boolean;
}) {
  return (
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      className="block size-full object-cover object-top"
    />
  );
}
