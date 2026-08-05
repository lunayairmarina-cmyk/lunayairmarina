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
import { absoluteUrl, DEFAULT_LOGO_PATH, DEFAULT_OG_IMAGE_PATH, getSiteUrl } from "@/lib/site";
import { ScrollToTop } from "@/components/shared/ScrollToTop";

const siteUrl = getSiteUrl();
const ogCover = absoluteUrl(DEFAULT_OG_IMAGE_PATH, siteUrl);
const brandLogo = absoluteUrl(DEFAULT_LOGO_PATH, siteUrl);

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
      logo: brandLogo,
      sameAs: Object.values(companyInfo.social).filter(Boolean),
      areaServed: ["SA", "AE", "BH", "QA", "KW", "OM"],
    },
    {
      "@type": "LocalBusiness",
      "@id": `${siteUrl}/#localbusiness`,
      name: "lunayairmarina",
      image: ogCover,
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
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "lunayairmarina | إدارة يخوت احترافية — Yacht Management Saudi Arabia" },
      {
        name: "description",
        content:
          "إدارة يخوت ٣٦٠ درجة في جدة والبحر الأحمر والخليج — 360° yacht management, marina ops, visiting yacht agency and crew. lunayairmarina.",
      },
      {
        name: "keywords",
        content:
          "إدارة يخوت السعودية, إدارة يخوت جدة, lunayairmarina, yacht management Saudi Arabia, marina management, Red Sea yacht management",
      },
      { name: "author", content: "lunayairmarina" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "lunayairmarina" },
      { property: "og:locale", content: "ar_SA" },
      { property: "og:locale:alternate", content: "en_US" },
      { property: "og:url", content: siteUrl },
      {
        property: "og:title",
        content: "lunayairmarina | إدارة يخوت احترافية — Yacht Management Saudi Arabia & Gulf",
      },
      {
        property: "og:description",
        content:
          "إدارة يخوت ٣٦٠، تشغيل مارينا، وكالة اليخوت الزائرة وخدمات الطواقم في جدة والخليج. Professional yacht management for Red Sea & Gulf owners.",
      },
      { property: "og:image", content: ogCover },
      { property: "og:image:secure_url", content: ogCover },
      { property: "og:image:alt", content: "lunayairmarina — إدارة يخوت | Yacht Management" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:title",
        content: "lunayairmarina | إدارة يخوت احترافية — Yacht Management Saudi Arabia",
      },
      {
        name: "twitter:description",
        content:
          "إدارة يخوت احترافية في السعودية والخليج — 360° yacht management, marina ops and crew.",
      },
      { name: "twitter:image", content: ogCover },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "canonical", href: siteUrl },
      { rel: "alternate", hrefLang: "en", href: siteUrl },
      { rel: "alternate", hrefLang: "ar", href: siteUrl },
      { rel: "alternate", hrefLang: "x-default", href: siteUrl },
      { rel: "image_src", href: brandLogo },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=Inter:wght@300;400;500;600&family=Noto+Kufi+Arabic:wght@300;400;500;700&display=swap",
      },
      { rel: "icon", href: "/favicon.png?v=7", type: "image/png", sizes: "64x64" },
      { rel: "icon", href: "/favicon-32.png?v=7", type: "image/png", sizes: "32x32" },
      { rel: "shortcut icon", href: "/favicon.ico?v=7" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png?v=7", sizes: "180x180" },
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
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){function scrub(){document.querySelectorAll('a[href*="lovable.dev"],a[href*="lovable.app"],[data-lovable],#lovable-badge,.lovable-badge').forEach(function(n){n.remove();});}scrub();try{new MutationObserver(scrub).observe(document.documentElement,{childList:true,subtree:true});}catch(e){}})();`,
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
          <ScrollToTop />
          <Outlet />
        </LanguageProvider>
      </SiteContentProvider>
    </QueryClientProvider>
  );
}
