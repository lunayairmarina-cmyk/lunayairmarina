# Agents

Project notes for AI coding agents working in this repository.

## Asset strategy (canonical)

Prefer **dual-purpose, non-duplicative** usage:

1. **`public/images/**` + `public/videos/**`**
   - Stable URLs for LCP/preload, CMS paths, OG, and SSR-friendly hero/header media
   - Example: `/images/hero/hero-main.webp`

2. **`src/assets/**`**
   - Vite-bundled images imported by components when hashing/cache-busting is desired
   - Prefer **WebP** imports when both formats exist

Do **not** add new mirrored copies of the same file in both trees without a reason.
Legacy JPG siblings may remain until verified unused; do not mass-delete media.

## Content reads

Site UI should load marketing content through `@/services/content` (via `SiteContentProvider`), not by calling Firestore or `cms-store` directly.
