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
import { AdminAuthProvider } from "@/hooks/useAdminAuth";
import { companyInfo } from "@/data/mock";
import { absoluteUrl, DEFAULT_LOGO_PATH, DEFAULT_OG_IMAGE_PATH, getSiteUrl } from "@/lib/site";
import { ScrollToTop } from "@/components/shared/ScrollToTop";

const siteUrl = getSiteUrl();
const ogCover = absoluteUrl(DEFAULT_OG_IMAGE_PATH, siteUrl);
const brandLogo = absoluteUrl(DEFAULT_LOGO_PATH, siteUrl);
const customPhone = "+966531561212";

const organizationSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "lunayairmarina",
      url: siteUrl,
      email: companyInfo.email,
      telephone: customPhone,
      logo: brandLogo,
      sameAs: Object.values(companyInfo.social).filter(Boolean),
      areaServed: ["SA", "AE", "BH", "QA", "KW", "OM", "EG", "Red Sea", "Mediterranean", "Europe"],
    },
    {
      "@type": "LocalBusiness",
      "@id": `${siteUrl}/#localbusiness`,
      name: "lunayairmarina",
      image: ogCover,
      url: siteUrl,
      telephone: customPhone,
      email: companyInfo.email,
      address: {
        "@type": "PostalAddress",
        streetAddress: "Al Murjan Tower, Prince Sultan Road, Al Rawdah",
        addressLocality: "Jeddah",
        addressCountry: "SA",
      },
      priceRange: "$$$$",
      areaServed: ["Saudi Arabia", "GCC", "Egypt", "Red Sea", "Mediterranean", "Europe"],
      description:
        "Premier 360° yacht management and superyacht support across Saudi Arabia, the GCC, Egypt, Red Sea, Mediterranean, and Europe.",
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
      name: "360° Yacht Management & Regional Operations",
      serviceType: "Yacht Management & Superyacht Support",
      provider: { "@id": `${siteUrl}/#organization` },
      areaServed: [
        "Saudi Arabia",
        "United Arab Emirates",
        "Qatar",
        "Bahrain",
        "Kuwait",
        "Oman",
        "Egypt",
        "Red Sea",
        "Arabian Gulf",
        "Mediterranean",
        "Europe"
      ],
      description:
        "Comprehensive operational, technical, crew, and financial yacht management focusing on Saudi Arabia and the GCC, Egypt, expanding to the Red Sea, Mediterranean, and Europe.",
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
      { 
        title: "lunayairmarina | إدارة يخوت فاخرة في السعودية والخليج — Yacht Management Saudi Arabia & GCC" 
      },
      {
        name: "description",
        content:
          "إدارة يخوت ٣٦٠ درجة في السعودية ودول الخليج، مصر، البحر الأحمر، المتوسط وأوروبا. خدمات الطواقم، تشغيل المارينا، ودعم اليخوت الفاخرة بمعايير عالمية. تواصل معنا: +966531561212",
      },
      {
        name: "keywords",
        content:
          "إدارة يخوت السعودية, إدارة يخوت دبي, إدارة يخوت مصر, yacht management Saudi Arabia, superyacht management GCC, Egypt yacht services, Red Sea yacht agency, Mediterranean yacht management, European yacht management, تشغيل مارينا, وكالة يخوت زائرة, خدمات طواقم اليخوت, lunayairmarina",
      },
      { name: "author", content: "lunayairmarina" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "lunayairmarina" },
      { property: "og:locale", content: "ar_SA" },
      { property: "og:locale:alternate", content: "en_US" },
      { property: "og:url", content: siteUrl },
      {
        property: "og:title",
        content: "lunayairmarina | إدارة يخوت فاخرة — Yacht Management Saudi Arabia & GCC",
      },
      {
        property: "og:description",
        content:
          "الوجهة الأولى لإدارة اليخوت وتشغيل المارينا في السعودية ودول الخليج، مصر، البحر الأحمر، المتوسط وأوروبا. حلول متكاملة ٣٦٠ درجة لمالكي اليخوت الفاخرة.",
      },
      { property: "og:image", content: ogCover },
      { property: "og:image:secure_url", content: ogCover },
      { property: "og:image:alt", content: "lunayairmarina — إدارة يخوت فاخرة | Luxury Yacht Management" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:title",
        content: "lunayairmarina | إدارة يخوت احترافية — Yacht Management Saudi Arabia & GCC",
      },
      {
        name: "twitter:description",
        content:
          "خدمات إدارة اليخوت الفاخرة الشاملة في السعودية والخليج، مصر، البحر الأحمر، المتوسط وأوروبا. Discover elite yacht solutions.",
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
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&family=Inter:wght@400;500;600&family=Noto+Kufi+Arabic:wght@400;500;700&family=Great+Vibes&display=swap",
      },
      { rel: "icon", href: "/favicon.ico?v=12", sizes: "any" },
      { rel: "icon", href: "/favicon-48.png?v=12", type: "image/png", sizes: "48x48" },
      { rel: "icon", href: "/favicon.png?v=12", type: "image/png", sizes: "64x64" },
      { rel: "icon", href: "/favicon-32.png?v=12", type: "image/png", sizes: "32x32" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png?v=12", sizes: "180x180" },
      { rel: "manifest", href: "/site.webmanifest?v=9" },
    ],
    scripts: [
      {
        async: true,
        src: "https://www.googletagmanager.com/gtag/js?id=G-VLSMRG4M9M",
      },
      {
        children: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-VLSMRG4M9M');`,
      },
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
            __html: `(function(){try{var l=localStorage.getItem('azura.language');if(l==='ar'||l==='en'){document.documentElement.lang=l;document.documentElement.dir=l==='ar'?'rtl':'ltr';document.cookie='azura.language='+l+';path=/;max-age=31536000;SameSite=Lax';}}catch(e){}})();`,
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
          <AdminAuthProvider>
            <ScrollToTop />
            <Outlet />
          </AdminAuthProvider>
        </LanguageProvider>
      </SiteContentProvider>
    </QueryClientProvider>
  );
}
