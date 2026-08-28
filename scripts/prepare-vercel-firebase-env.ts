/**
 * Validates local service account + prepares Vercel FIREBASE_SERVICE_ACCOUNT_JSON value.
 * Never prints secrets, private_key, or full client_email.
 */
import { readFileSync, writeFileSync, unlinkSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { config as loadEnv } from "dotenv";
import { parseJsonEnvValue, peekServiceAccountFromEnv } from "../src/server/agent/firebaseAdminDiagnostics";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SA_PATH = resolve(ROOT, "secrets/firebase-service-account.json");
const EXPECTED_PROJECT = "lunayairmarina-2d694";
const TEMP_OUT = resolve(process.env.TEMP || process.env.TMP || "/tmp", `lunayair-vercel-sa-${randomUUID()}.json`);

type PhaseResult = {
  jsonParse: boolean;
  projectMatch: boolean;
  clientEmailPresent: boolean;
  privateKeyPresent: boolean;
  privateKeyHasLiteralNewlines: boolean;
  credentialStructure: boolean;
  vercelStringParse: boolean;
  vercelPeekParse: boolean;
  tempFile: string;
};

function validateStructure(parsed: Record<string, unknown>): boolean {
  const required = ["type", "project_id", "private_key", "client_email", "client_id", "auth_uri", "token_uri"];
  return required.every((k) => typeof parsed[k] === "string" && String(parsed[k]).trim().length > 0);
}

function main(): PhaseResult {
  if (!existsSync(SA_PATH)) {
    console.error("FAIL: secrets/firebase-service-account.json not found");
    process.exit(1);
  }

  let raw: string;
  let parsed: Record<string, unknown>;
  try {
    raw = readFileSync(SA_PATH, "utf8");
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch (error) {
    console.error("FAIL: local JSON.parse");
    console.error(`error=${error instanceof Error ? error.message.split("\n")[0] : "parse error"}`);
    process.exit(1);
  }

  const projectId = String(parsed.project_id ?? "").trim();
  const clientEmail = String(parsed.client_email ?? "").trim();
  const privateKey = String(parsed.private_key ?? "");
  const emailDomain = clientEmail.includes("@") ? clientEmail.split("@")[1] : "";

  const result: PhaseResult = {
    jsonParse: true,
    projectMatch: projectId === EXPECTED_PROJECT,
    clientEmailPresent: clientEmail.length > 0,
    privateKeyPresent: privateKey.length > 0,
    privateKeyHasLiteralNewlines: privateKey.includes("\\n") || privateKey.includes("\n"),
    credentialStructure: validateStructure(parsed),
    vercelStringParse: false,
    vercelPeekParse: false,
    tempFile: TEMP_OUT,
  };

  // Vercel value: compact single-line JSON (JSON.stringify handles private_key escaping)
  const vercelValue = JSON.stringify(parsed);
  writeFileSync(TEMP_OUT, vercelValue, "utf8");

  try {
    parseJsonEnvValue(vercelValue);
    result.vercelStringParse = true;
  } catch {
    result.vercelStringParse = false;
  }

  // Simulate process.env assignment + peek diagnostics (same path as production)
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON = vercelValue;
  delete process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const peek = peekServiceAccountFromEnv();
  result.vercelPeekParse =
    peek.jsonParse && peek.clientEmailPresent && peek.privateKeyPresent && peek.projectId === EXPECTED_PROJECT;

  console.log("LOCAL_JSON_PARSE=PASS");
  console.log(`PROJECT_ID_MATCH=${result.projectMatch ? "PASS" : "FAIL"} expected=${EXPECTED_PROJECT}`);
  console.log(`CLIENT_EMAIL_PRESENT=${result.clientEmailPresent ? "PASS" : "FAIL"}`);
  console.log(`PRIVATE_KEY_PRESENT=${result.privateKeyPresent ? "PASS" : "FAIL"}`);
  console.log(`CREDENTIAL_STRUCTURE=${result.credentialStructure ? "PASS" : "FAIL"}`);
  console.log(`CLIENT_EMAIL_DOMAIN=${emailDomain || "missing"}`);
  console.log(`VERCEL_STRING_PARSE=${result.vercelStringParse ? "PASS" : "FAIL"}`);
  console.log(`VERCEL_PEEK_PARSE=${result.vercelPeekParse ? "PASS" : "FAIL"}`);
  console.log(`TEMP_VALUE_FILE=${TEMP_OUT}`);
  console.log(`TEMP_VALUE_BYTES=${Buffer.byteLength(vercelValue, "utf8")}`);

  writeFileSync(resolve(ROOT, "scripts/.last-vercel-sa-temp"), TEMP_OUT, "utf8");

  if (!result.projectMatch || !result.vercelPeekParse) process.exit(1);
  return result;
}

main();
