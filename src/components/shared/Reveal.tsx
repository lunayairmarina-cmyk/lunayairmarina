import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type RevealDirection = "up" | "left" | "right" | "scale" | "fade";

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: RevealDirection;
  as?: "div" | "section" | "li" | "article" | "span";
}

/**
 * Instant content wrapper — no entrance animation so the homepage paints as one composition.
 * Props kept for call-site compatibility.
 */
export function Reveal({
  children,
  className,
  delay: _delay = 0,
  direction: _direction = "up",
  as = "div",
}: RevealProps) {
  void _delay;
  void _direction;
  const Tag = as;
  return <Tag className={className}>{children}</Tag>;
}

export const staggerContainer = {
  hidden: {},
  show: {},
};

export const staggerItem = {
  hidden: {},
  show: {},
};

export function StaggerGroup({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn(className)}>{children}</div>;
}
