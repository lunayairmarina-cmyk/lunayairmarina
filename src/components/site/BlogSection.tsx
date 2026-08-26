import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { staggerContainer, staggerItem } from "@/components/shared/Reveal";
import { getPublishedPosts, tx, type BlogPost } from "@/data/blog";
import type { BlogContent, SiteBundle } from "@/types/content";
import { ContentEmpty } from "@/components/shared/ContentState";
import { useOptionalSiteContent } from "@/providers/SiteContentProvider";
import { isUsableBlogSlug } from "@/lib/media";
import { ResolvedImage } from "@/components/shared/ResolvedImage";

function formatDate(value: string, language: string) {
  return new Intl.DateTimeFormat(language === "ar" ? "ar-SA" : "en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function mapRemotePosts(bundle: SiteBundle | null | undefined): BlogPost[] {
  const posts = bundle?.blog ?? [];
  return posts
    .filter((post) => (post.status ?? "published") === "published")
    .filter((post) => isUsableBlogSlug(post.slug))
    .map((post: BlogContent) => {
      if (post.blocks && post.excerpt && typeof post.title === "object") {
        return {
          ...(post as unknown as BlogPost),
          coverImage: (post as unknown as BlogPost).coverImage || post.image,
        };
      }
      const title =
        typeof post.title === "string" ? { en: post.title, ar: post.title } : post.title;
      return {
        id: post.id,
        slug: post.slug,
        title,
        excerpt:
          post.excerpt ??
          (typeof post.content === "string"
            ? { en: post.content.slice(0, 160), ar: post.content.slice(0, 160) }
            : post.content),
        coverImage: post.image,
        coverAlt: title,
        author: post.author ?? { en: "lunayairmarina", ar: "lunayairmarina" },
        publishedAt: post.date,
        updatedAt: post.date,
        status: (post.status as BlogPost["status"]) ?? "published",
        seoTitle: post.seoTitle ?? title,
        seoDescription:
          post.seoDescription ??
          (typeof post.content === "string"
            ? { en: post.content.slice(0, 160), ar: post.content.slice(0, 160) }
            : { en: "", ar: "" }),
        focusKeyword: { en: "yacht management", ar: "إدارة اليخوت" },
        tags: [],
        blocks: (post.blocks as BlogPost["blocks"]) ?? [],
      } satisfies BlogPost;
    });
}

export function BlogSection({ limit = 3 }: { limit?: number }) {
  const { t, language } = useLanguage();
  const site = useOptionalSiteContent();
  const remotePosts = useMemo(() => mapRemotePosts(site?.bundle ?? null), [site?.bundle]);
  const [localPosts, setLocalPosts] = useState<BlogPost[]>(() =>
    getPublishedPosts().slice(0, limit),
  );

  useEffect(() => {
    const refresh = () => setLocalPosts(getPublishedPosts().slice(0, limit));
    refresh();
    window.addEventListener("lunayairmarina-blog-posts", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("lunayairmarina-blog-posts", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [limit]);

  const posts = (remotePosts.length > 0 ? remotePosts : localPosts).slice(0, limit);

  return (
    <section className="border-y border-navy/5 bg-background py-24 lg:py-32">
      <div className="container-luxe">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            eyebrow={t("blog.eyebrow")}
            title={t("blog.title")}
            subtitle={t("blog.subtitle")}
            align="start"
            className="max-w-xl"
          />
          <Link
            to="/blog"
            className="shrink-0 border border-navy px-6 py-3 text-[0.7rem] tracking-[0.2em] text-navy uppercase transition-colors hover:border-gold hover:bg-gold"
          >
            {t("blog.viewAll")}
          </Link>
        </div>

        {posts.length === 0 ? (
          <div className="mt-14">
            <ContentEmpty message={t("blog.title")} />
          </div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="mt-14 grid gap-8 md:grid-cols-3"
          >
            {posts.map((post) => (
              <motion.article key={post.id} variants={staggerItem} className="group flex flex-col">
                <Link to="/blog/$slug" params={{ slug: post.slug }} className="overflow-hidden">
                  <ResolvedImage
                    src={post.coverImage}
                    alt={tx(post.coverAlt, language)}
                    loading="lazy"
                    className="aspect-[16/10] w-full object-cover"
                  />
                </Link>
                <p className="mt-5 text-[0.65rem] tracking-[0.2em] text-muted-foreground uppercase">
                  {formatDate(post.publishedAt, language)}
                </p>
                <h3 className="mt-2 font-display text-xl text-navy transition-colors group-hover:text-gold">
                  <Link to="/blog/$slug" params={{ slug: post.slug }}>
                    {tx(post.title, language)}
                  </Link>
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {tx(post.excerpt, language)}
                </p>
                <Link
                  to="/blog/$slug"
                  params={{ slug: post.slug }}
                  className="mt-5 text-[0.7rem] tracking-[0.18em] text-navy uppercase transition-colors hover:text-gold"
                >
                  {t("blog.readMore")}
                </Link>
              </motion.article>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
