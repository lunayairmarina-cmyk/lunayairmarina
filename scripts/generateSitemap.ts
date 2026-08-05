/**
 * Regenerates public/sitemap.xml from the public-page registry.
 * Run via: npm run sitemap  (also hooked into npm run build)
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildSitemapXml, listPublicSitemapEntries } from "../src/lib/sitemap";
import { SITE_ORIGIN } from "../src/lib/site";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = resolve(__dirname, "../public/sitemap.xml");

const entries = listPublicSitemapEntries();
const xml = buildSitemapXml(entries, SITE_ORIGIN);

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${xml}\n`, "utf8");

console.log(`Sitemap written: ${outPath}`);
console.log(`Origin: ${SITE_ORIGIN}`);
console.log(`URLs: ${entries.length}`);
for (const entry of entries) {
  console.log(`  - ${entry.path}`);
}
