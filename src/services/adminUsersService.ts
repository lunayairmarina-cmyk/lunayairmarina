import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { getDb, getFirebaseAuth, getSecondaryAuth, getSecondaryDb } from "@/lib/firebase";
import {
  ADMIN_PERMISSIONS,
  DEFAULT_ADMIN_USERS,
  permissionsForRole,
  saveAdminUsers,
  type AdminPermission,
  type AdminRoleId,
  type AdminUser,
} from "@/lib/admin-roles";

const ADMINS_COLLECTION = "admins";

async function markBootstrap(uid: string, email: string, db = getDb()) {
  const ref = doc(db, "config", "bootstrap");
  const snap = await getDoc(ref);
  if (snap.exists()) return;
  await setDoc(ref, {
    uid,
    email,
    createdAt: new Date().toISOString(),
  });
}

async function isBootstrapLocked(db = getDb()): Promise<boolean> {
  const snap = await getDoc(doc(db, "config", "bootstrap"));
  return snap.exists();
}

export type AdminUserInput = {
  name: string;
  email: string;
  password?: string;
  role: AdminRoleId;
  permissions: AdminPermission[];
  active: boolean;
};

function normalizeUser(id: string, data: Record<string, unknown>): AdminUser | null {
  if (typeof data.email !== "string" || typeof data.name !== "string") return null;
  const role = (data.role as AdminRoleId) || "custom";
  const rawPermissions = Array.isArray(data.permissions)
    ? (data.permissions as AdminPermission[])
    : [];
  const permissions =
    role === "super_admin"
      ? [...ADMIN_PERMISSIONS]
      : Array.from(
          new Set([
            ...rawPermissions,
            ...(role === "custom" ? [] : permissionsForRole(role)),
          ]),
        ).filter((permission) => ADMIN_PERMISSIONS.includes(permission));

  return {
    id,
    name: data.name,
    email: data.email.toLowerCase(),
    role,
    permissions,
    active: data.active !== false,
  };
}

export async function fetchAdminUsersFromFirebase(): Promise<AdminUser[]> {
  const snap = await getDocs(collection(getDb(), ADMINS_COLLECTION));
  const users = snap.docs
    .map((item) => normalizeUser(item.id, item.data() as Record<string, unknown>))
    .filter((item): item is AdminUser => Boolean(item));
  if (users.length) {
    saveAdminUsers(users);
    return users;
  }
  return [];
}

export async function getAdminProfile(uid: string): Promise<AdminUser | null> {
  const snap = await getDoc(doc(getDb(), ADMINS_COLLECTION, uid));
  if (!snap.exists()) return null;
  return normalizeUser(snap.id, snap.data() as Record<string, unknown>);
}

export async function createAdminUser(input: AdminUserInput): Promise<AdminUser> {
  const email = input.email.trim().toLowerCase();
  const password = input.password?.trim() ?? "";
  if (!email || !input.name.trim()) {
    throw new Error("Name and email are required.");
  }
  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  const secondary = getSecondaryAuth();
  const credential = await createUserWithEmailAndPassword(secondary, email, password);
  const uid = credential.user.uid;

  try {
    await updateProfile(credential.user, { displayName: input.name.trim() });
  } catch {
    // Optional.
  }

  const profile: AdminUser = {
    id: uid,
    name: input.name.trim(),
    email,
    role: input.role,
    permissions:
      input.role === "custom" ? input.permissions : permissionsForRole(input.role),
    active: input.active,
  };

  const payload = {
    ...profile,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Primary auth (Super Admin creating someone) OR Secondary auth (self bootstrap).
  const db = getFirebaseAuth().currentUser ? getDb() : getSecondaryDb();
  await setDoc(doc(db, ADMINS_COLLECTION, uid), payload);
  if (input.role === "super_admin") {
    await markBootstrap(uid, email, db);
  }

  await signOut(secondary);
  return profile;
}

/**
 * Load admin profile after Auth sign-in.
 * Creates Super Admin only once (first bootstrap). Later Auth users need an invite from Super Admin.
 */
export async function ensureAdminProfileFromAuth(user: User): Promise<AdminUser | null> {
  const existing = await getAdminProfile(user.uid);
  if (existing) {
    if (!existing.active) return null;
    if (existing.role === "super_admin") {
      try {
        await markBootstrap(user.uid, existing.email);
      } catch {
        // Ignore marker failures; profile is enough to enter.
      }
    }
    return existing;
  }

  if (await isBootstrapLocked()) return null;

  const email = (user.email ?? "").trim().toLowerCase();
  if (!email) return null;

  const profile: AdminUser = {
    id: user.uid,
    name: user.displayName?.trim() || email.split("@")[0] || "Admin",
    email,
    role: "super_admin",
    permissions: [...ADMIN_PERMISSIONS],
    active: true,
  };

  await setDoc(doc(getDb(), ADMINS_COLLECTION, user.uid), {
    ...profile,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  await markBootstrap(user.uid, email);
  return profile;
}

export async function updateAdminUser(
  id: string,
  input: Omit<AdminUserInput, "password"> & { password?: string },
): Promise<AdminUser> {
  const profile: AdminUser = {
    id,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    role: input.role,
    permissions:
      input.role === "custom" ? input.permissions : permissionsForRole(input.role),
    active: input.active,
  };

  await updateDoc(doc(getDb(), ADMINS_COLLECTION, id), {
    name: profile.name,
    email: profile.email,
    role: profile.role,
    permissions: profile.permissions,
    active: profile.active,
    updatedAt: new Date().toISOString(),
  });

  // Password for other users cannot be set from client Auth without Admin SDK.
  // Super Admin can trigger a reset email instead.
  if (input.password?.trim()) {
    await sendPasswordResetEmail(getFirebaseAuth(), profile.email);
  }

  return profile;
}

export async function deleteAdminUserProfile(id: string) {
  await deleteDoc(doc(getDb(), ADMINS_COLLECTION, id));
}

export async function sendAdminPasswordReset(email: string) {
  await sendPasswordResetEmail(getFirebaseAuth(), email.trim().toLowerCase());
}

/**
 * If Auth user does not exist yet and bootstrap is unlocked, create the first Super Admin.
 */
export async function bootstrapSuperAdminIfNeeded(
  email: string,
  password: string,
  name = "lunayairmarina Admin",
): Promise<AdminUser | null> {
  try {
    if (await isBootstrapLocked()) return null;
  } catch {
    // Continue if rules/network blocked the read.
  }

  try {
    return await createAdminUser({
      name,
      email,
      password,
      role: "super_admin",
      permissions: [...ADMIN_PERMISSIONS],
      active: true,
    });
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code?: string }).code)
        : "";
    if (code.includes("email-already-in-use")) return null;
    throw error;
  }
}

export function mergeUsersCache(users: AdminUser[]) {
  saveAdminUsers(users.length ? users : DEFAULT_ADMIN_USERS);
}
