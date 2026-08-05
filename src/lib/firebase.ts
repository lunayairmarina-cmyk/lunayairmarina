import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getAuth, type Auth } from "firebase/auth";

function requiredEnv(name: string): string {
  const value = (import.meta.env as Record<string, string | undefined>)[name];
  if (typeof value === "string" && value.trim()) return value.trim();
  throw new Error(
    `[firebase] Missing ${name}. Set it in .env (see .env.example). Hardcoded Firebase fallbacks were removed.`,
  );
}

const firebaseConfig = {
  apiKey: requiredEnv("VITE_FIREBASE_API_KEY"),
  authDomain: requiredEnv("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: requiredEnv("VITE_FIREBASE_PROJECT_ID"),
  storageBucket: requiredEnv("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: requiredEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: requiredEnv("VITE_FIREBASE_APP_ID"),
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID?.trim() || undefined,
};

let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;
let auth: Auth | undefined;
let secondaryApp: FirebaseApp | undefined;
let secondaryAuth: Auth | undefined;

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
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
      secondaryApp = initializeApp(firebaseConfig, "Secondary");
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

export { firebaseConfig };
