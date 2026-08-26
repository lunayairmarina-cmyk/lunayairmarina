import type { ReactNode } from "react";
import { lazy, Suspense } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { VipAdNotice } from "./VipAdNotice";

const ChatbotWidget = lazy(() =>
  import("./ChatbotWidget").then((module) => ({ default: module.ChatbotWidget })),
);

interface SiteLayoutProps {
  children: ReactNode;
}

/**
 * No Motion opacity gates on shell chrome/content.
 * Hiding <main>/<header> until hydration caused chrome-first paint.
 */
export function SiteLayout({ children }: SiteLayoutProps) {
  return (
    <div className="site-shell flex min-h-svh flex-col overflow-x-clip bg-background">
      <Navbar />
      <main className="min-w-0 flex-1 pt-[calc(5rem+env(safe-area-inset-top))]">{children}</main>
      <Footer />
      <Suspense fallback={null}>
        <ChatbotWidget />
      </Suspense>
      <VipAdNotice />
    </div>
  );
}
