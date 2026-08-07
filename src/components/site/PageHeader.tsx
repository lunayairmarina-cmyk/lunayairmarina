import { cn } from "@/lib/utils";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  image: string;
  compact?: boolean;
  /** Put title on the opposite side (e.g. clear a logo on the right in RTL). */
  alignContent?: "start" | "end";
  /** CSS object-position for the background photo */
  imagePosition?: string;
}

/**
 * Only emit a .webp <source> when a real public WebP sibling exists.
 * Never invent `/assets/name-HASH.webp` — Vite only hashes the files that exist,
 * so a synthetic .webp 404s and <picture> will NOT fall back to the <img> JPG.
 */
function webpSiblingFor(image: string): string | null {
  if (!image || isMediaLike(image)) return null;
  if (!/\.(jpe?g|png)(\?.*)?$/i.test(image)) return null;
  // Stable public folders that ship .webp siblings.
  if (
    image.includes("/images/headers/") ||
    image.includes("/images/hero/") ||
    image.includes("/images/about/") ||
    image.includes("/images/gallery/")
  ) {
    return image.replace(/\.(jpe?g|png)(\?.*)?$/i, ".webp$2");
  }
  return null;
}

function isMediaLike(src: string) {
  return (
    src.startsWith("media:") ||
    src.startsWith("data:") ||
    src.startsWith("blob:")
  );
}

/** Above-the-fold header: always visible on first paint (no opacity:0 Motion gate). */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  image,
  compact = false,
  alignContent = "start",
  imagePosition,
}: PageHeaderProps) {
  const webp = webpSiblingFor(image);

  return (
    <section
      className={cn(
        "relative flex w-full items-end overflow-hidden",
        compact
          ? "min-h-[34vh] pb-10 sm:min-h-[36vh] sm:pb-14"
          : "min-h-[38vh] pb-10 sm:min-h-[44vh] sm:pb-16 lg:min-h-[50vh] lg:pb-20",
      )}
    >
      <div className="absolute inset-0 bg-navy">
        <picture>
          {webp ? <source srcSet={webp} type="image/webp" /> : null}
          <img
            src={image}
            alt=""
            aria-hidden
            fetchPriority="high"
            decoding="async"
            className={cn(
              "size-full object-cover",
              imagePosition ? undefined : "object-[center_40%] sm:object-center",
            )}
            style={imagePosition ? { objectPosition: imagePosition } : undefined}
          />
        </picture>
        <div
          className={cn(
            "absolute inset-0",
            alignContent === "end"
              ? "bg-gradient-to-t from-[#050d18]/75 via-[#050d18]/30 to-transparent sm:bg-gradient-to-l sm:from-transparent sm:via-[#050d18]/35 sm:to-[#050d18]/65"
              : "bg-gradient-to-t from-[#050d18]/70 via-[#050d18]/25 to-transparent sm:from-[#050d18]/55 sm:via-transparent",
          )}
        />
      </div>

      <div className="container-luxe relative z-10 w-full">
        <div
          className={cn(
            "max-w-xl",
            alignContent === "end" ? "ms-auto text-start sm:max-w-lg" : "text-start",
          )}
        >
          {eyebrow ? <span className="eyebrow block">{eyebrow}</span> : null}
          <h1 className="type-display-l mt-3 whitespace-pre-line text-balance text-white sm:mt-4">
            {title}
          </h1>
          <span className="gold-rule mt-4 origin-start sm:mt-6" />
          {subtitle ? (
            <p className="type-body mt-4 max-w-md text-white/80 sm:mt-6 sm:max-w-xl">{subtitle}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
