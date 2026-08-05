import fs from "node:fs";
import path from "node:path";

const dir = "src/routes";

function extractBalanced(src, startIdx) {
  let depth = 0;
  for (let i = startIdx; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") {
      depth--;
      if (depth === 0) return { end: i, text: src.slice(startIdx, i + 1) };
    }
  }
  throw new Error("Unbalanced");
}

for (const f of fs.readdirSync(dir).filter((x) => x.startsWith("admin.") && x.endsWith(".lazy.tsx"))) {
  const p = path.join(dir, f);
  let s = fs.readFileSync(p, "utf8");
  const m = s.match(/createLazyFileRoute\(\s*(["'])([^"']+)\1\s*\)/);
  if (!m) throw new Error("no lazy route " + f);
  const routePath = m[2];
  const comp = s.match(/\bcomponent:\s*([A-Za-z0-9_]+)/)?.[1];
  if (!comp) throw new Error("no component " + f);

  const exportIdx = s.indexOf("export const Route = createLazyFileRoute");
  const optionsStart = s.indexOf("{", s.indexOf(")", exportIdx));
  const { end } = extractBalanced(s, optionsStart);
  // Find closing `);` after options
  let closeEnd = end + 1;
  while (closeEnd < s.length && /\s/.test(s[closeEnd])) closeEnd++;
  if (s[closeEnd] === ")") closeEnd++;
  if (s[closeEnd] === ";") closeEnd++;

  const replacement = `export const Route = createLazyFileRoute("${routePath}")({\n  component: ${comp},\n});`;
  s = s.slice(0, exportIdx) + replacement + s.slice(closeEnd);
  fs.writeFileSync(p, s);
  console.log("lazy cleaned", f);
}

for (const f of fs.readdirSync(dir).filter((x) => x.startsWith("admin.") && x.endsWith(".tsx") && !x.includes(".lazy."))) {
  const p = path.join(dir, f);
  let s = fs.readFileSync(p, "utf8");
  if (!s.includes("createFileRoute")) continue;
  // Fix mangled `]}),` from earlier script (should be `],\n  }),`)
  const next = s.replace(/\]\}\),/g, "],\n  }),");
  if (next !== s) {
    fs.writeFileSync(p, next);
    console.log("critical fixed", f);
  } else {
    console.log("critical ok", f);
  }
}
