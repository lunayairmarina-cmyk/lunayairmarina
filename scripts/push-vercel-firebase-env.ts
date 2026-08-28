/**
 * Update FIREBASE_SERVICE_ACCOUNT_JSON on the Vercel project that serves www.lunayairmarina.com.
 * Never logs secrets or env values.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const API = "https://api.vercel.com";

function readVercelToken(): string {
  const candidates = [
    resolve(homedir(), "AppData/Roaming/com.vercel.cli/Data/auth.json"),
    resolve(homedir(), ".vercel/auth.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    const parsed = JSON.parse(readFileSync(path, "utf8")) as { token?: string };
    if (parsed.token?.trim()) return parsed.token.trim();
  }
  throw new Error("Vercel auth token not found — run `vercel login` first.");
}

async function api(token: string, path: string, init?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    const msg =
      typeof body === "object" && body && "error" in body
        ? String((body as { error?: { message?: string } }).error?.message ?? res.status)
        : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return body;
}

async function listTeams(token: string) {
  const data = (await api(token, "/v2/teams?limit=20")) as { teams?: Array<{ id: string; slug: string }> };
  return data.teams ?? [];
}

async function listProjects(token: string, teamId?: string) {
  const q = teamId ? `?teamId=${teamId}&limit=50` : "?limit=50";
  const data = (await api(token, `/v9/projects${q}`)) as {
    projects?: Array<{ id: string; name: string; accountId?: string }>;
  };
  return data.projects ?? [];
}

async function listProjectDomains(token: string, projectId: string, teamId?: string) {
  const q = teamId ? `?teamId=${teamId}` : "";
  const data = (await api(token, `/v9/projects/${projectId}/domains${q}`)) as {
    domains?: Array<{ name: string }>;
  };
  return (data.domains ?? []).map((d) => d.name);
}

async function listEnv(token: string, projectId: string, teamId?: string) {
  const q = teamId ? `?teamId=${teamId}` : "";
  const data = (await api(token, `/v9/projects/${projectId}/env${q}`)) as {
    envs?: Array<{ id: string; key: string; target?: string[] }>;
  };
  return data.envs ?? [];
}

async function upsertEnv(
  token: string,
  projectId: string,
  teamId: string | undefined,
  key: string,
  value: string,
  targets: string[],
) {
  const q = teamId ? `?teamId=${teamId}` : "";
  const existing = (await listEnv(token, projectId, teamId)).filter((e) => e.key === key);
  for (const env of existing) {
    await api(token, `/v9/projects/${projectId}/env/${env.id}${q}`, { method: "DELETE" });
    console.log(`removed_old_env id=${env.id} targets=${(env.target ?? []).join(",") || "unknown"}`);
  }
  await api(token, `/v9/projects/${projectId}/env${q}`, {
    method: "POST",
    body: JSON.stringify({
      key,
      value,
      type: "encrypted",
      target: targets,
    }),
  });
  console.log(`upsert_env key=${key} targets=${targets.join(",")} bytes=${Buffer.byteLength(value, "utf8")}`);
}

async function createProductionDeploy(token: string, projectId: string, teamId?: string) {
  const q = teamId ? `?teamId=${teamId}` : "";
  const data = (await api(token, `/v13/deployments${q}`, {
    method: "POST",
    body: JSON.stringify({
      name: "lunayairmarina",
      project: projectId,
      target: "production",
      gitSource: {
        type: "github",
        repo: "lunayairmarina-cmyk/lunayairmarina",
        ref: "master",
      },
    }),
  })) as { id?: string; url?: string; readyState?: string };
  console.log(`deploy_triggered id=${data.id ?? "unknown"} url=${data.url ?? "unknown"} state=${data.readyState ?? "unknown"}`);
  return data;
}

async function main() {
  const tempGlob = readFileSync(resolve(ROOT, "scripts/.last-vercel-sa-temp"), "utf8").trim();
  if (!existsSync(tempGlob)) throw new Error("Prepared temp value file missing — run prepare-vercel-firebase-env.ts first.");
  const value = readFileSync(tempGlob, "utf8").trim();
  if (!value.startsWith("{")) throw new Error("Prepared value does not look like JSON object.");

  const token = readVercelToken();
  const teams = await listTeams(token);
  const userTeam = { id: undefined as string | undefined, slug: "personal" };
  const scopes = [userTeam, ...teams.map((t) => ({ id: t.id, slug: t.slug }))];

  let matched: { projectId: string; teamId?: string; teamSlug: string; domains: string[] } | null = null;

  for (const scope of scopes) {
    const projects = await listProjects(token, scope.id);
    for (const project of projects) {
      const domains = await listProjectDomains(token, project.id, scope.id);
      if (domains.some((d) => d === "lunayairmarina.com" || d === "www.lunayairmarina.com")) {
        matched = {
          projectId: project.id,
          teamId: scope.id,
          teamSlug: scope.slug,
          domains,
        };
        break;
      }
    }
    if (matched) break;
  }

  if (!matched) {
    console.error("FAIL: no Vercel project found with lunayairmarina.com domain in accessible teams.");
    console.error(`accessible_teams=${teams.map((t) => t.slug).join(",") || "none"}`);
    process.exit(1);
  }

  console.log(`matched_project=${matched.projectId} team=${matched.teamSlug}`);
  console.log(`domains=${matched.domains.join(",")}`);

  await upsertEnv(token, matched.projectId, matched.teamId, "FIREBASE_SERVICE_ACCOUNT_JSON", value, [
    "production",
    "preview",
    "development",
  ]);

  try {
    await createProductionDeploy(token, matched.projectId, matched.teamId);
  } catch (error) {
    console.log(`deploy_trigger_skipped reason=${error instanceof Error ? error.message.split("\n")[0] : "unknown"}`);
    console.log("ACTION=Redeploy Production from Vercel Dashboard after env update.");
  }
}

main().catch((error) => {
  console.error(`FAIL=${error instanceof Error ? error.message.split("\n")[0] : "unknown"}`);
  process.exit(1);
});
