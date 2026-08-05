/**
 * Extract largest admin page components into features/admin/* while keeping
 * thin createLazyFileRoute wrappers in src/routes.
 */
import fs from "node:fs";
import path from "node:path";

const targets = [
  {
    lazy: "src/routes/admin.blog.lazy.tsx",
    featureDir: "src/features/admin/blog",
    featureFile: "BlogAdminPage.tsx",
    exportName: "BlogAdminPage",
    routePath: "/admin/blog",
    oldFn: "AdminBlogPage",
  },
  {
    lazy: "src/routes/admin.dashboard.lazy.tsx",
    featureDir: "src/features/admin/dashboard",
    featureFile: "DashboardPage.tsx",
    exportName: "DashboardPage",
    routePath: "/admin/dashboard",
    oldFn: "DashboardPage",
  },
  {
    lazy: "src/routes/admin.users.lazy.tsx",
    featureDir: "src/features/admin/users",
    featureFile: "UsersAdminPage.tsx",
    exportName: "UsersAdminPage",
    routePath: "/admin/users",
    oldFn: "AdminUsersPage",
  },
];

for (const t of targets) {
  const src = fs.readFileSync(t.lazy, "utf8");
  const exportIdx = src.indexOf("export const Route = createLazyFileRoute");
  if (exportIdx < 0) throw new Error("missing route export " + t.lazy);

  // Everything after the Route export block is page code; imports are above.
  const afterRoute = src.indexOf("\n", src.indexOf("});", exportIdx)) + 1;
  const importsBlock = src
    .slice(0, exportIdx)
    .split("\n")
    .filter((line) => !line.includes("createLazyFileRoute"))
    .join("\n")
    .trim();

  let pageBody = src.slice(afterRoute).trim();
  // Rename page function to exportName if needed
  if (t.oldFn !== t.exportName) {
    pageBody = pageBody.replace(
      new RegExp(`function\\s+${t.oldFn}\\b`),
      `export function ${t.exportName}`,
    );
  } else {
    pageBody = pageBody.replace(
      new RegExp(`function\\s+${t.exportName}\\b`),
      `export function ${t.exportName}`,
    );
  }

  // Also export nested helpers that stay in the same file (StatCard etc. for dashboard)
  // Keep non-exported helpers as-is.

  const featurePath = path.join(t.featureDir, t.featureFile);
  fs.mkdirSync(t.featureDir, { recursive: true });
  fs.writeFileSync(featurePath, `${importsBlock}\n\n${pageBody}\n`);

  const lazyWrapper = `import { createLazyFileRoute } from "@tanstack/react-router";
import { ${t.exportName} } from "@/features/admin/${path.basename(t.featureDir)}/${t.featureFile.replace(/\\.tsx$/, "")}";

export const Route = createLazyFileRoute("${t.routePath}")({
  component: ${t.exportName},
});
`;
  fs.writeFileSync(t.lazy, lazyWrapper);
  console.log("extracted", t.lazy, "→", featurePath);
}
