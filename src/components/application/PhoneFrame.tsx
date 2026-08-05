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
}: {
  src: string;
  alt?: string;
}) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className="absolute inset-0 size-full object-cover object-top"
    />
  );
}
