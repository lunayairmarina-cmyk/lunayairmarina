import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getAuth, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "AIzaSyA6rTHWzaQJVPxI9hyViPIv3g0R6d7f6O8",
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "lunayairmarina-2d694.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "lunayairmarina-2d694",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "lunayairmarina-2d694.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "640687266007",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "1:640687266007:web:3effccbfa5897130277892",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? "G-VB6Y6RRZFL",
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
