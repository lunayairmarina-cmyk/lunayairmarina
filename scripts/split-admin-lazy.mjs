/**
 * Split admin route components into *.lazy.tsx for TanStack Router code-splitting.
 * Keeps head/beforeLoad in the critical route file. Does not change URLs.
 */
import fs from "node:fs";
import path from "node:path";

const routesDir = path.resolve("src/routes");
const files = fs
  .readdirSync(routesDir)
  .filter((f) => f.startsWith("admin.") && f.endsWith(".tsx") && !f.includes(".lazy."));

function extractBalanced(src, startIdx) {
  // startIdx points at '{'
  let depth = 0;
  for (let i = startIdx; i < src.length; i++) {
    const ch = src[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return src.slice(startIdx, i + 1);
    }
  }
  throw new Error("Unbalanced braces");
}

for (const file of files) {
  const full = path.join(routesDir, file);
  const src = fs.readFileSync(full, "utf8");
  if (!src.includes("component:")) {
    console.log("skip (no component):", file);
    continue;
  }
  if (fs.existsSync(full.replace(/\.tsx$/, ".lazy.tsx"))) {
    console.log("skip (lazy exists):", file);
    continue;
  }

  const routePathMatch = src.match(/createFileRoute\(\s*(["'`])([^"'`]+)\1\s*\)/);
  if (!routePathMatch) throw new Error(`No route path in ${file}`);
  const routePath = routePathMatch[2];

  const callIdx = src.indexOf("createFileRoute");
  const openParen = src.indexOf("(", callIdx);
  // find the options object '{' after createFileRoute("...")(
  const afterPath = src.indexOf(")", openParen);
  const optionsStart = src.indexOf("{", afterPath);
  const optionsObj = extractBalanced(src, optionsStart);

  // Split options into critical (head, beforeLoad, loader, ...) vs component
  const componentMatch = optionsObj.match(
    /,\s*component:\s*([A-Za-z0-9_]+)\s*$|^\{\s*component:\s*([A-Za-z0-9_]+)\s*$/,
  );
  // More reliable: find `component: Identifier` at top level of options
  let componentName = null;
  let criticalOptions = optionsObj;
  {
    // Find component: Name that is a direct property (simple case used everywhere)
    const m = optionsObj.match(/\bcomponent:\s*([A-Za-z0-9_]+)\s*(,|\})/);
    if (!m) throw new Error(`No simple component prop in ${file}`);
    componentName = m[1];
    // Remove component property including optional preceding comma
    criticalOptions = optionsObj
      .replace(/,?\s*component:\s*[A-Za-z0-9_]+\s*/, (match, offset, str) => {
        // If removing leaves `{,` or trailing comma before `}`, clean later
        return str[offset] === "," || match.startsWith(",") ? "" : "";
      })
      .replace(/\{\s*,/, "{")
      .replace(/,\s*\}/, "}");
  }

  // If critical options is only `{}`, keep empty createFileRoute still (virtual-friendly)
  const criticalFile = `import { createFileRoute } from "@tanstack/react-router";\n\nexport const Route = createFileRoute("${routePath}")(${criticalOptions});\n`;

  // Lazy file: original source with createFileRoute -> createLazyFileRoute and options only { component }
  let lazySrc = src;
  lazySrc = lazySrc.replace(
    /import\s*\{\s*([^}]+)\s*\}\s*from\s*["']@tanstack\/react-router["']/,
    (fullImp, names) => {
      const parts = names
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const filtered = parts.filter(
        (n) => !["createFileRoute", "redirect"].includes(n.split(/\s+as\s+/)[0]),
      );
      if (!filtered.includes("createLazyFileRoute")) filtered.unshift("createLazyFileRoute");
      // Keep Link, useNavigate, Outlet, etc.
      return `import { ${filtered.join(", ")} } from "@tanstack/react-router"`;
    },
  );

  // Replace the Route export block
  const routeExportStart = lazySrc.indexOf("export const Route = createFileRoute");
  if (routeExportStart < 0) {
    // maybe already rewritten import but still createFileRoute call
  }
  lazySrc = lazySrc.replace(
    /export const Route = createFileRoute\([^)]*\)\([\s\S]*?\n\);/,
    `export const Route = createLazyFileRoute("${routePath}")({\n  component: ${componentName},\n});`,
  );

  // If createFileRoute still referenced in import replacement failed path
  lazySrc = lazySrc.replace(/createFileRoute/g, "createLazyFileRoute");
  // Fix double createLazyFileRoute from previous replace
  lazySrc = lazySrc.replace(/createLazyFileRouteLazyFileRoute/g, "createLazyFileRoute");

  // Ensure createLazyFileRoute is imported
  if (!lazySrc.includes("createLazyFileRoute")) {
    lazySrc = `import { createLazyFileRoute } from "@tanstack/react-router";\n` + lazySrc;
  }

  const lazyPath = full.replace(/\.tsx$/, ".lazy.tsx");
  fs.writeFileSync(lazyPath, lazySrc);
  fs.writeFileSync(full, criticalFile);
  console.log("split:", file, "→", path.basename(lazyPath), `(${componentName})`);
}
