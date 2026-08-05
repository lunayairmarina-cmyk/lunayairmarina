import { cn } from "@/lib/utils";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  image: string;
  compact?: boolean;
}

/** Above-the-fold header: always visible on first paint (no opacity:0 Motion gate). */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  image,
  compact = false,
}: PageHeaderProps) {
  const webp = image.replace(/\.(jpe?g|png)(\?.*)?$/i, ".webp$2");
  const canWebp =
    webp !== image &&
    (image.includes("/images/") || image.includes("/assets/") || image.startsWith("/"));

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
          {canWebp ? <source srcSet={webp} type="image/webp" /> : null}
          <img
            src={image}
            alt=""
            aria-hidden
            fetchPriority="high"
            decoding="async"
            className="size-full object-cover object-[center_40%] sm:object-center"
          />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-t from-[#050d18]/70 via-[#050d18]/25 to-transparent sm:from-[#050d18]/55 sm:via-transparent" />
      </div>

      <div className="container-luxe relative z-10 w-full">
        <div className="max-w-xl text-start">
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
