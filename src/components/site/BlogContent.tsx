import type { BlogBlock, BlogInline } from "@/data/blog";
import { tx } from "@/data/blog";
import type { Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";

function InlineSpans({ spans, language }: { spans: BlogInline[]; language: Language }) {
  return (
    <>
      {spans.map((span, index) =>
        span.type === "keyword" ? (
          <a
            key={`${tx(span.text, language)}-${index}`}
            href={span.href}
            className="font-medium text-gold underline decoration-gold/40 underline-offset-4 transition-colors hover:text-gold-soft hover:decoration-gold"
          >
            {tx(span.text, language)}
          </a>
        ) : (
          <span key={`${tx(span.text, language)}-${index}`}>{tx(span.text, language)}</span>
        ),
      )}
    </>
  );
}

export function BlogContent({
  blocks,
  language,
  className,
}: {
  blocks: BlogBlock[];
  language: Language;
  className?: string;
}) {
  return (
    <div className={cn("space-y-8", className)}>
      {blocks.map((block) => {
        if (block.type === "heading") {
          const Tag = block.level === 2 ? "h2" : "h3";
          return (
            <Tag
              key={block.id}
              className={cn(
                "text-navy",
                block.level === 2 ? "font-display text-3xl sm:text-4xl" : "text-2xl",
              )}
            >
              {tx(block.text, language)}
            </Tag>
          );
        }

        if (block.type === "paragraph") {
          return (
            <p key={block.id} className="text-base leading-relaxed text-navy/80 sm:text-lg">
              <InlineSpans spans={block.spans} language={language} />
            </p>
          );
        }

        if (block.type === "image") {
          return (
            <figure key={block.id} className="overflow-hidden">
              <img
                src={block.src}
                alt={tx(block.alt, language)}
                loading="lazy"
                className="aspect-[16/10] w-full object-cover"
              />
              {block.caption ? (
                <figcaption className="mt-3 text-center text-sm text-muted-foreground">
                  {tx(block.caption, language)}
                </figcaption>
              ) : null}
            </figure>
          );
        }

        return (
          <blockquote
            key={block.id}
            className="border-s-2 border-gold bg-sand px-6 py-5 text-lg leading-relaxed text-navy/85 italic"
          >
            {tx(block.text, language)}
          </blockquote>
        );
      })}
    </div>
  );
}
