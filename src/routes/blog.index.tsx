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
import blogHeader from "@/assets/gallery-2.jpg";

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
    <SiteLayout transparentNav>
      <PageHeader
        eyebrow={t("blog.eyebrow")}
        title={t("blog.title")}
        subtitle={t("blog.subtitle")}
        image={headerImage}
        crumb={t("nav.blog")}
      />

      <section className="bg-background py-20 lg:py-28">
        <div className="container-luxe">
          {posts.length === 0 ? (
            <p className="text-center text-muted-foreground">{t("blog.empty")}</p>
          ) : (
            <div className="space-y-16 lg:space-y-20">
              {featured ? (
                <Reveal>
                  <article className="group grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-14">
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
                        className="aspect-[16/10] w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                      />
                    </Link>
                    <div>
                      <div className="flex flex-wrap items-center gap-3 text-[0.65rem] tracking-[0.16em] text-muted-foreground uppercase">
                        <time dateTime={featured.publishedAt}>
                          {formatDate(featured.publishedAt, language)}
                        </time>
                        {tx(featured.focusKeyword, language) ? (
                          <span className="text-gold">{tx(featured.focusKeyword, language)}</span>
                        ) : null}
                      </div>
                      <h2 className="mt-5 font-display text-3xl leading-tight text-navy transition-colors group-hover:text-gold sm:text-4xl">
                        <Link to="/blog/$slug" params={{ slug: featured.slug }}>
                          {tx(featured.title, language)}
                        </Link>
                      </h2>
                      <p className="mt-5 text-base leading-relaxed text-muted-foreground">
                        {tx(featured.excerpt, language)}
                      </p>
                      <Link
                        to="/blog/$slug"
                        params={{ slug: featured.slug }}
                        className="mt-8 inline-flex text-[0.7rem] tracking-[0.2em] text-navy uppercase transition-colors hover:text-gold"
                      >
                        {t("blog.readMore")}
                      </Link>
                    </div>
                  </article>
                </Reveal>
              ) : null}

              {rest.length > 0 ? (
                <div className="grid gap-12 border-t border-border pt-14 md:grid-cols-2 lg:grid-cols-3 lg:gap-x-10 lg:gap-y-16">
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
                            className="aspect-[16/10] w-full object-cover transition-transform duration-700 group-hover:scale-105"
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
                          <h2 className="mt-3 font-display text-2xl text-navy transition-colors group-hover:text-gold">
                            <Link to="/blog/$slug" params={{ slug: post.slug }}>
                              {tx(post.title, language)}
                            </Link>
                          </h2>
                          <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                            {tx(post.excerpt, language)}
                          </p>
                          <Link
                            to="/blog/$slug"
                            params={{ slug: post.slug }}
                            className="mt-5 text-[0.7rem] tracking-[0.2em] text-navy uppercase transition-colors hover:text-gold"
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
