import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHeader } from "@/components/site/PageHeader";
import { Reveal } from "@/components/shared/Reveal";
import { useLanguage } from "@/lib/i18n";
import {
  buildBlogListJsonLd,
  getPublishedPosts,
  tx,
  type BlogPost,
} from "@/data/blog";
import { CMS_UPDATED_EVENT } from "@/lib/cms-store";
import { buildSeoHead } from "@/services/seoService";
import { usePageHeaderImage } from "@/hooks/usePageHeaderImage";
import blogHeader from "@/assets/page-header-blog.jpg";

export const Route = createFileRoute("/blog/")({
  head: () => {
    const seo = buildSeoHead("blog", "/blog");
    return {
      ...seo,
      meta: [...seo.meta, { name: "robots", content: "index,follow" }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(buildBlogListJsonLd(getPublishedPosts())),
        },
      ],
    };
  },
  component: BlogIndexPage,
});

function formatDate(value: string, language: string) {
  return new Intl.DateTimeFormat(language === "ar" ? "ar-SA" : "en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

function BlogIndexPage() {
  const { t, language } = useLanguage();
  const headerImage = usePageHeaderImage("blog", blogHeader);
  const [posts, setPosts] = useState<BlogPost[]>(() => getPublishedPosts());

  useEffect(() => {
    const refresh = () => setPosts(getPublishedPosts());
    refresh();
    window.addEventListener("lunayairmarina-blog-posts", refresh);
    window.addEventListener(CMS_UPDATED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("lunayairmarina-blog-posts", refresh);
      window.removeEventListener(CMS_UPDATED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const featured = posts[0];
  const rest = posts.slice(1);

  return (
    <SiteLayout>
      <PageHeader
        eyebrow={t("blog.eyebrow")}
        title={t("blog.title")}
        subtitle={t("blog.subtitle")}
        image={headerImage}
      />

      <section className="bg-background py-16 sm:py-20 lg:py-24">
        <div className="container-luxe">
          {posts.length === 0 ? (
            <p className="py-16 text-center text-muted-foreground">{t("blog.empty")}</p>
          ) : (
            <div className="space-y-14 lg:space-y-16">
              {featured ? (
                <Reveal>
                  <article className="group grid gap-8 border border-navy/10 bg-[#fbfaf8] p-5 sm:p-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-12 lg:p-8">
                    <Link
                      to="/blog/$slug"
                      params={{ slug: featured.slug }}
                      className="overflow-hidden"
                    >
                      <img
                        src={featured.coverImage}
                        alt={tx(featured.coverAlt, language)}
                        loading="lazy"
                        width={1400}
                        height={900}
                        className="aspect-[16/10] w-full object-cover"
                      />
                    </Link>
                    <div className="flex flex-col justify-center lg:py-2">
                      <div className="flex flex-wrap items-center gap-3 text-[0.65rem] tracking-[0.16em] text-muted-foreground uppercase">
                        <time dateTime={featured.publishedAt}>
                          {formatDate(featured.publishedAt, language)}
                        </time>
                        {tx(featured.focusKeyword, language) ? (
                          <span className="text-gold">{tx(featured.focusKeyword, language)}</span>
                        ) : null}
                      </div>
                      <h2 className="type-display-m mt-4 text-navy transition-colors group-hover:text-gold sm:mt-5">
                        <Link to="/blog/$slug" params={{ slug: featured.slug }}>
                          {tx(featured.title, language)}
                        </Link>
                      </h2>
                      <p className="type-body mt-4 text-muted-foreground sm:mt-5">
                        {tx(featured.excerpt, language)}
                      </p>
                      <Link
                        to="/blog/$slug"
                        params={{ slug: featured.slug }}
                        className="type-cta mt-6 inline-flex text-navy transition-colors hover:text-gold sm:mt-8"
                      >
                        {t("blog.readMore")}
                      </Link>
                    </div>
                  </article>
                </Reveal>
              ) : null}

              {rest.length > 0 ? (
                <div className="grid gap-8 border-t border-border pt-12 sm:gap-10 md:grid-cols-2 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-12 lg:pt-14">
                  {rest.map((post, index) => (
                    <Reveal key={post.id} delay={index * 0.05}>
                      <article className="group flex h-full flex-col">
                        <Link
                          to="/blog/$slug"
                          params={{ slug: post.slug }}
                          className="overflow-hidden"
                        >
                          <img
                            src={post.coverImage}
                            alt={tx(post.coverAlt, language)}
                            loading="lazy"
                            width={900}
                            height={600}
                            className="aspect-[16/10] w-full object-cover"
                          />
                        </Link>
                        <div className="mt-5 flex flex-1 flex-col">
                          <div className="flex flex-wrap items-center gap-3 text-[0.65rem] tracking-[0.16em] text-muted-foreground uppercase">
                            <time dateTime={post.publishedAt}>
                              {formatDate(post.publishedAt, language)}
                            </time>
                            {tx(post.focusKeyword, language) ? (
                              <span className="text-gold">{tx(post.focusKeyword, language)}</span>
                            ) : null}
                          </div>
                          <h2 className="type-display-s mt-3 text-navy transition-colors group-hover:text-gold">
                            <Link to="/blog/$slug" params={{ slug: post.slug }}>
                              {tx(post.title, language)}
                            </Link>
                          </h2>
                          <p className="type-body-sm mt-3 flex-1 text-muted-foreground">
                            {tx(post.excerpt, language)}
                          </p>
                          <Link
                            to="/blog/$slug"
                            params={{ slug: post.slug }}
                            className="type-cta mt-5 text-navy transition-colors hover:text-gold"
                          >
                            {t("blog.readMore")}
                          </Link>
                        </div>
                      </article>
                    </Reveal>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
