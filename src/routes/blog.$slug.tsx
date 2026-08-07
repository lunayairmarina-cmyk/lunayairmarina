import { useEffect, useMemo, useState } from "react";
import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { BlogContent } from "@/components/site/BlogContent";
import { ResolvedImage } from "@/components/shared/ResolvedImage";
import { useLanguage } from "@/lib/i18n";
import {
  DEFAULT_BLOG_POSTS,
  buildArticleJsonLd,
  getPostBySlug,
  getPublishedPosts,
  tx,
  type BlogPost,
} from "@/data/blog";

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }) => {
    const post =
      getPostBySlug(params.slug, DEFAULT_BLOG_POSTS.filter((item) => item.status === "published")) ??
      getPostBySlug(params.slug);
    if (!post || post.status !== "published") throw notFound();
    return post;
  },
  head: ({ loaderData }) => {
    const post = loaderData as BlogPost | undefined;
    if (!post) return {};
    const url = `https://lunayairmarina.com/blog/${post.slug}`;
    const title = tx(post.seoTitle, "en") || tx(post.title, "en");
    const description = tx(post.seoDescription, "en") || tx(post.excerpt, "en");
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "robots", content: "index,follow,max-image-preview:large" },
        { name: "author", content: tx(post.author, "en") },
        {
          name: "keywords",
          content: [tx(post.focusKeyword, "en"), ...post.tags.map((tag) => tx(tag, "en"))]
            .filter(Boolean)
            .join(", "),
        },
        { property: "og:type", content: "article" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
        { property: "og:image", content: post.coverImage },
        { property: "article:published_time", content: post.publishedAt },
        { property: "article:modified_time", content: post.updatedAt || post.publishedAt },
        { property: "article:author", content: tx(post.author, "en") },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: post.coverImage },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(buildArticleJsonLd(post)),
        },
      ],
    };
  },
  component: BlogPostPage,
});

function formatDate(value: string, language: string) {
  return new Intl.DateTimeFormat(language === "ar" ? "ar-SA" : "en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

function BlogPostPage() {
  const postFromLoader = Route.useLoaderData() as BlogPost;
  const { slug } = Route.useParams();
  const { t, language } = useLanguage();
  const [post, setPost] = useState<BlogPost>(postFromLoader);

  useEffect(() => {
    const refresh = () => {
      const next = getPostBySlug(slug);
      if (next && next.status === "published") setPost(next);
    };
    refresh();
    window.addEventListener("lunayairmarina-blog-posts", refresh);
    return () => window.removeEventListener("lunayairmarina-blog-posts", refresh);
  }, [slug]);

  const related = useMemo(
    () => getPublishedPosts().filter((item) => item.id !== post.id).slice(0, 2),
    [post.id],
  );

  const keyword = tx(post.focusKeyword, language);

  return (
    <SiteLayout>
      <article className="bg-background pb-24">
        <header className="relative overflow-hidden pt-12">
          <div className="absolute inset-0">
            <ResolvedImage
              src={post.coverImage}
              alt={tx(post.coverAlt, language)}
              className="size-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy/65 via-navy/20 to-transparent" />
          </div>
          <div className="container-luxe relative z-10 max-w-3xl py-20 text-white">
            <p className="text-[0.7rem] tracking-[0.22em] text-gold uppercase">
              <Link to="/blog" className="hover:text-gold-soft">
                {t("blog.eyebrow")}
              </Link>
              <span className="mx-3 opacity-40">/</span>
              <time dateTime={post.publishedAt}>{formatDate(post.publishedAt, language)}</time>
            </p>
            <h1 className="mt-5 font-display text-4xl leading-tight text-balance sm:text-5xl lg:text-6xl">
              {tx(post.title, language)}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
              {tx(post.excerpt, language)}
            </p>
            <div className="mt-8 flex flex-wrap gap-4 text-sm text-white/65">
              {tx(post.category, language) ? (
                <span className="rounded-full border border-white/25 px-3 py-1 text-[0.65rem] tracking-[0.14em] text-white/80 uppercase">
                  {tx(post.category, language)}
                </span>
              ) : null}
              <span>
                {t("blog.by")} {tx(post.author, language)}
              </span>
              {keyword ? (
                <span className="rounded-full border border-gold/40 px-3 py-1 text-[0.65rem] tracking-[0.14em] text-gold uppercase">
                  {keyword}
                </span>
              ) : null}
            </div>
          </div>
        </header>

        <div className="container-luxe mt-14 max-w-3xl">
          <BlogContent blocks={post.blocks} language={language} />

          {post.tags.length > 0 ? (
            <div className="mt-12 flex flex-wrap gap-2 border-t border-border pt-8">
              {post.tags.map((tag) => (
                <span
                  key={tx(tag, "en")}
                  className="border border-border px-3 py-1.5 text-[0.65rem] tracking-[0.14em] text-navy/70 uppercase"
                >
                  {tx(tag, language)}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              to="/contact"
              className="border border-navy bg-navy px-6 py-3 text-[0.7rem] tracking-[0.2em] text-navy-foreground uppercase transition-colors hover:border-gold hover:bg-gold hover:text-navy"
            >
              {t("blog.ctaContact")}
            </Link>
            <Link
              to="/blog"
              className="border border-border px-6 py-3 text-[0.7rem] tracking-[0.2em] text-navy uppercase transition-colors hover:border-gold"
            >
              {t("blog.back")}
            </Link>
          </div>
        </div>

        {related.length > 0 ? (
          <section className="container-luxe mt-20 max-w-5xl">
            <h2 className="font-display text-3xl text-navy">{t("blog.related")}</h2>
            <div className="mt-8 grid gap-8 md:grid-cols-2">
              {related.map((item) => (
                <Link
                  key={item.id}
                  to="/blog/$slug"
                  params={{ slug: item.slug }}
                  className="group border border-border p-2 transition-colors hover:border-gold/50"
                >
                  <ResolvedImage
                    src={item.coverImage}
                    alt={tx(item.coverAlt, language)}
                    className="aspect-[16/10] w-full object-cover"
                    loading="lazy"
                  />
                  <h3 className="mt-4 px-2 text-xl text-navy group-hover:text-gold">
                    {tx(item.title, language)}
                  </h3>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </article>
    </SiteLayout>
  );
}
