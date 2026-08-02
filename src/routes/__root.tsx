import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

import appCss from "../styles.css?url";
import { LanguageProvider } from "@/lib/i18n";
import { SiteContentProvider } from "@/providers/SiteContentProvider";
import { companyInfo } from "@/data/mock";

const siteUrl = "https://lunayairmarina.com";

const organizationSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "lunayairmarina",
      url: siteUrl,
      email: companyInfo.email,
      telephone: companyInfo.phoneDisplay,
      logo: `${siteUrl}/favicon.png`,
      sameAs: Object.values(companyInfo.social),
      areaServed: ["SA", "AE", "BH", "QA", "KW", "OM"],
    },
    {
      "@type": "LocalBusiness",
      "@id": `${siteUrl}/#localbusiness`,
      name: "lunayairmarina",
      image: `${siteUrl}/favicon.png`,
      url: siteUrl,
      telephone: companyInfo.phoneDisplay,
      email: companyInfo.email,
      address: {
        "@type": "PostalAddress",
        streetAddress: "Al Murjan Tower, Prince Sultan Road, Al Rawdah",
        addressLocality: "Jeddah",
        addressCountry: "SA",
      },
      priceRange: "$$$$",
      description:
        "Professional yacht management solutions for yacht owners in Saudi Arabia and the Gulf region.",
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "lunayairmarina",
      publisher: { "@id": `${siteUrl}/#organization` },
      inLanguage: ["en", "ar"],
    },
    {
      "@type": "Service",
      "@id": `${siteUrl}/#yacht-management`,
      name: "360° Yacht Management",
      serviceType: "Yacht Management",
      provider: { "@id": `${siteUrl}/#organization` },
      areaServed: ["Saudi Arabia", "Arabian Gulf", "Red Sea"],
      description:
        "Integrated operational, technical and financial yacht management for owners.",
    },
  ],
};

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Yacht Management Saudi Arabia & Gulf | lunayairmarina" },
      {
        name: "description",
        content:
          "Lunay Air Marina provides professional yacht management solutions for yacht owners in Saudi Arabia and the Gulf — 360° management, marina ops, agency and crew.",
      },
      { name: "author", content: "lunayairmarina" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "lunayairmarina" },
      { property: "og:locale", content: "en_US" },
      { property: "og:locale:alternate", content: "ar_SA" },
      { property: "og:url", content: siteUrl },
      {
        property: "og:title",
        content: "Yacht Management Saudi Arabia & Gulf | lunayairmarina",
      },
      {
        property: "og:description",
        content:
          "Professional yacht management for owners across Jeddah, the Red Sea and the Arabian Gulf.",
      },
      { property: "og:image", content: `${siteUrl}/apple-touch-icon.png` },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:title",
        content: "Yacht Management Saudi Arabia & Gulf | lunayairmarina",
      },
      {
        name: "twitter:description",
        content:
          "Professional yacht management for owners across Jeddah, the Red Sea and the Arabian Gulf.",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "canonical", href: siteUrl },
      { rel: "alternate", hrefLang: "en", href: siteUrl },
      { rel: "alternate", hrefLang: "ar", href: siteUrl },
      { rel: "alternate", hrefLang: "x-default", href: siteUrl },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=Inter:wght@300;400;500;600&family=Noto+Kufi+Arabic:wght@300;400;500;700&display=swap",
      },
      { rel: "icon", href: "/favicon.png?v=6", type: "image/png", sizes: "64x64" },
      { rel: "icon", href: "/favicon-32.png?v=6", type: "image/png", sizes: "32x32" },
      { rel: "shortcut icon", href: "/favicon.ico?v=6" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png?v=6", sizes: "180x180" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(organizationSchema),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var l=localStorage.getItem('azura.language');if(l==='ar'||l==='en'){document.documentElement.lang=l;document.documentElement.dir=l==='ar'?'rtl':'ltr';}}catch(e){}})();`,
          }}
        />
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <SiteContentProvider>
        <LanguageProvider>
          <Outlet />
        </LanguageProvider>
      </SiteContentProvider>
    </QueryClientProvider>
  );
}
