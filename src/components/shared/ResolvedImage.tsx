import { useEffect, useState, type ImgHTMLAttributes } from "react";
import { useResolvedMediaSrc } from "@/hooks/useResolvedMediaSrc";

type ResolvedImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src?: string | null;
  fallback?: string;
};

/** `<img>` that resolves `media:` refs and legacy CMS paths. */
export function ResolvedImage({ src, fallback = "", alt = "", ...rest }: ResolvedImageProps) {
  const resolved = useResolvedMediaSrc(src, fallback);
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    setBroken(false);
  }, [src, resolved]);

  const display = broken && fallback ? fallback : resolved;
  if (!display) return null;
  return (
    <img
      src={display}
      alt={alt}
      onError={() => {
        if (fallback && display !== fallback) setBroken(true);
      }}
      {...rest}
    />
  );
}
