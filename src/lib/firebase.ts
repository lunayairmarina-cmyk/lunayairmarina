import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getAuth, type Auth } from "firebase/auth";

/**
 * Firebase Web SDK config is public by design (security is Firestore/Auth rules).
 * Prefer VITE_* env on Vercel/local; fall back so SSR does not 500 when env is unset.
 */
const PUBLIC_WEB_FALLBACK = {
  apiKey: "AIzaSyA6rTHWzaQJVPxI9hyViPIv3g0R6d7f6O8",
  authDomain: "lunayairmarina-2d694.firebaseapp.com",
  projectId: "lunayairmarina-2d694",
  storageBucket: "lunayairmarina-2d694.firebasestorage.app",
  messagingSenderId: "640687266007",
  appId: "1:640687266007:web:3effccbfa5897130277892",
  measurementId: "G-VB6Y6RRZFL",
} as const;

type FirebaseWebConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
};

function readEnv(name: string): string | undefined {
  const value = (import.meta.env as Record<string, string | undefined>)[name];
  if (typeof value === "string" && value.trim()) return value.trim();
  return undefined;
}

function resolveFirebaseConfig(): FirebaseWebConfig {
  const fromEnv = {
    apiKey: readEnv("VITE_FIREBASE_API_KEY"),
    authDomain: readEnv("VITE_FIREBASE_AUTH_DOMAIN"),
    projectId: readEnv("VITE_FIREBASE_PROJECT_ID"),
    storageBucket: readEnv("VITE_FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: readEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
    appId: readEnv("VITE_FIREBASE_APP_ID"),
    measurementId: readEnv("VITE_FIREBASE_MEASUREMENT_ID"),
  };

  const requiredOk =
    fromEnv.apiKey &&
    fromEnv.authDomain &&
    fromEnv.projectId &&
    fromEnv.storageBucket &&
    fromEnv.messagingSenderId &&
    fromEnv.appId;

  if (requiredOk) {
    return {
      apiKey: fromEnv.apiKey!,
      authDomain: fromEnv.authDomain!,
      projectId: fromEnv.projectId!,
      storageBucket: fromEnv.storageBucket!,
      messagingSenderId: fromEnv.messagingSenderId!,
      appId: fromEnv.appId!,
      measurementId: fromEnv.measurementId,
    };
  }

  if (import.meta.env.PROD) {
    console.warn(
      "[firebase] VITE_FIREBASE_* env incomplete — using public web config fallback. Set env vars in Vercel for clarity.",
    );
  }

  return { ...PUBLIC_WEB_FALLBACK };
}

let resolvedConfig: FirebaseWebConfig | undefined;
let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;
let auth: Auth | undefined;
let secondaryApp: FirebaseApp | undefined;
let secondaryAuth: Auth | undefined;

export function getFirebaseConfig(): FirebaseWebConfig {
  if (!resolvedConfig) resolvedConfig = resolveFirebaseConfig();
  return resolvedConfig;
}

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = getApps().length ? getApps()[0]! : initializeApp(getFirebaseConfig());
  }
  return app;
}

export function getDb(): Firestore {
  if (!db) db = getFirestore(getFirebaseApp());
  return db;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!storage) storage = getStorage(getFirebaseApp());
  return storage;
}

export function getFirebaseAuth(): Auth {
  if (!auth) auth = getAuth(getFirebaseApp());
  return auth;
}

/** Secondary Auth app — create users without signing out the current Super Admin. */
export function getSecondaryAuth(): Auth {
  if (!secondaryApp) {
    try {
      secondaryApp = getApp("Secondary");
    } catch {
      secondaryApp = initializeApp(getFirebaseConfig(), "Secondary");
    }
  }
  if (!secondaryAuth) secondaryAuth = getAuth(secondaryApp);
  return secondaryAuth;
}

/** Firestore bound to the Secondary app (uses Secondary Auth token). */
export function getSecondaryDb(): Firestore {
  getSecondaryAuth();
  return getFirestore(getApp("Secondary"));
}

/** Lazy-resolved config object for any legacy callers. */
export const firebaseConfig = new Proxy({} as FirebaseWebConfig, {
  get(_target, prop) {
    return Reflect.get(getFirebaseConfig(), prop);
  },
});
