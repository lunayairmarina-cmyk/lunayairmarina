/**
 * Server-only Firebase Admin SDK bootstrap for knowledge ingestion.
 * Bypasses Firestore Security Rules (service account privilege).
 * Never import this module from client/browser code.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

type ServiceAccountJson = {
  project_id?: string;
  client_email?: string;
  private_key?: string;
};

function resolveProjectId(serviceAccount?: ServiceAccountJson): string {
  const fromEnv =
    process.env.FIREBASE_PROJECT_ID?.trim() || process.env.VITE_FIREBASE_PROJECT_ID?.trim();
  if (fromEnv) return fromEnv;
  if (serviceAccount?.project_id?.trim()) return serviceAccount.project_id.trim();
  return "lunayairmarina-2d694";
}

function resolveServiceAccountPath(): string {
  const path =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim() ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  if (!path) {
    throw new Error(
      "[firebase-admin] Missing FIREBASE_SERVICE_ACCOUNT_PATH (or GOOGLE_APPLICATION_CREDENTIALS). " +
        "Download a service account JSON from Firebase Console → Project settings → Service accounts, " +
        "store it outside the repo (or in a gitignored path), and set the env var to that file path.",
    );
  }
  return resolve(path);
}

function loadServiceAccount(path: string): ServiceAccountJson {
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    throw new Error(
      "[firebase-admin] Could not read or parse the service account JSON file. " +
        "Check FIREBASE_SERVICE_ACCOUNT_PATH points to a valid JSON file.",
    );
  }
  if (!parsed || typeof parsed !== "object") {
    throw new Error("[firebase-admin] Service account file must contain a JSON object.");
  }
  const account = parsed as ServiceAccountJson;
  if (!account.client_email || !account.private_key) {
    throw new Error(
      "[firebase-admin] Service account JSON is missing required fields (client_email / private_key).",
    );
  }
  return account;
}

let adminApp: App | undefined;
let adminDb: Firestore | undefined;

export function getFirebaseAdminApp(): App {
  if (adminApp) return adminApp;
  const existing = getApps()[0];
  if (existing) {
    adminApp = existing;
    return adminApp;
  }

  const accountPath = resolveServiceAccountPath();
  const serviceAccount = loadServiceAccount(accountPath);
  const projectId = resolveProjectId(serviceAccount);

  adminApp = initializeApp({
    credential: cert(serviceAccount as Parameters<typeof cert>[0]),
    projectId,
  });
  return adminApp;
}

export function getAdminFirestore(): Firestore {
  if (!adminDb) adminDb = getFirestore(getFirebaseAdminApp());
  return adminDb;
}

/** True when a service account path is configured (does not load the key). */
export function hasFirebaseAdminCredentials(): boolean {
  return Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim() ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim(),
  );
}

/** Soft init — returns null when credentials are missing or invalid (no secrets logged). */
export function tryGetAdminFirestore(): Firestore | null {
  if (!hasFirebaseAdminCredentials()) return null;
  try {
    return getAdminFirestore();
  } catch {
    return null;
  }
}

/** Confirms Admin SDK can initialize without logging secrets. */
export function assertFirebaseAdminReady(): { projectId: string; credentialSource: string } {
  const app = getFirebaseAdminApp();
  const projectId = app.options.projectId ?? resolveProjectId();
  const source = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim()
    ? "FIREBASE_SERVICE_ACCOUNT_PATH"
    : "GOOGLE_APPLICATION_CREDENTIALS";
  return { projectId, credentialSource: source };
}
