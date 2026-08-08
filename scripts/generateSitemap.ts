/**
 * Regenerates public sitemaps for pages + videos.
 * Run via: npm run sitemap  (also hooked into npm run build)
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildSitemapXml, listPublicSitemapEntries } from "../src/lib/sitemap";
import { buildSitemapIndexXml, buildVideoSitemapXml } from "../src/lib/videos";
import { SITE_ORIGIN } from "../src/lib/site";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = resolve(__dirname, "../public/sitemap.xml");
const videoOutPath = resolve(__dirname, "../public/sitemap-video.xml");
const indexOutPath = resolve(__dirname, "../public/sitemap-index.xml");

const entries = listPublicSitemapEntries();
const xml = buildSitemapXml(entries, SITE_ORIGIN);
const videoXml = buildVideoSitemapXml(undefined, SITE_ORIGIN);
const indexXml = buildSitemapIndexXml(SITE_ORIGIN);

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${xml}\n`, "utf8");
writeFileSync(videoOutPath, `${videoXml}\n`, "utf8");
writeFileSync(indexOutPath, `${indexXml}\n`, "utf8");

console.log(`Sitemap written: ${outPath}`);
console.log(`Video sitemap written: ${videoOutPath}`);
console.log(`Sitemap index written: ${indexOutPath}`);
console.log(`Origin: ${SITE_ORIGIN}`);
console.log(`URLs: ${entries.length}`);
for (const entry of entries) {
  console.log(`  - ${entry.path}`);
}
