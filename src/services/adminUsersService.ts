import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
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

function authCode(error: unknown): string {
  if (error && typeof error === "object" && "code" in error) {
    return String((error as { code?: string }).code ?? "");
  }
  return "";
}

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

function buildProfile(uid: string, input: AdminUserInput, email: string): AdminUser {
  return {
    id: uid,
    name: input.name.trim(),
    email,
    role: input.role,
    permissions:
      input.role === "custom" ? input.permissions : permissionsForRole(input.role),
    active: input.active,
  };
}

async function writeAdminProfile(profile: AdminUser) {
  // Always write with the signed-in Super Admin token (primary app).
  await setDoc(
    doc(getDb(), ADMINS_COLLECTION, profile.id),
    {
      ...profile,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );
  if (profile.role === "super_admin") {
    await markBootstrap(profile.id, profile.email);
  }
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

/**
 * Super Admin invites a user:
 * 1) Create (or reclaim) Firebase Auth account with email+password
 * 2) Save role/permissions profile in Firestore admins/{uid}
 */
export async function createAdminUser(input: AdminUserInput): Promise<AdminUser> {
  const email = input.email.trim().toLowerCase();
  const password = input.password?.trim() ?? "";
  if (!email || !input.name.trim()) {
    throw new Error("Name and email are required.");
  }
  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  const primary = getFirebaseAuth().currentUser;
  if (!primary) {
    throw new Error("SUPER_ADMIN_REQUIRED");
  }

  const secondary = getSecondaryAuth();
  let uid = "";

  try {
    try {
      const credential = await createUserWithEmailAndPassword(secondary, email, password);
      uid = credential.user.uid;
      try {
        await updateProfile(credential.user, { displayName: input.name.trim() });
      } catch {
        // Optional.
      }
    } catch (createError) {
      const code = authCode(createError);
      if (!code.includes("email-already-in-use")) throw createError;

      // Auth account already exists — sign in with the password just entered to attach/update profile.
      try {
        const existing = await signInWithEmailAndPassword(secondary, email, password);
        uid = existing.user.uid;
      } catch {
        throw new Error("EMAIL_EXISTS_WRONG_PASSWORD");
      }
    }

    const profile = buildProfile(uid, input, email);
    await writeAdminProfile(profile);
    return profile;
  } finally {
    try {
      await signOut(secondary);
    } catch {
      // ignore
    }
  }
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

  const normalized = email.trim().toLowerCase();
  const pass = password.trim();
  const secondary = getSecondaryAuth();

  try {
    let uid = "";
    try {
      const credential = await createUserWithEmailAndPassword(secondary, normalized, pass);
      uid = credential.user.uid;
      try {
        await updateProfile(credential.user, { displayName: name });
      } catch {
        // Optional.
      }
    } catch (createError) {
      const code = authCode(createError);
      if (code.includes("email-already-in-use")) return null;
      throw createError;
    }

    const profile = buildProfile(
      uid,
      {
        name,
        email: normalized,
        password: pass,
        role: "super_admin",
        permissions: [...ADMIN_PERMISSIONS],
        active: true,
      },
      normalized,
    );

    // First bootstrap: secondary token can create own super_admin profile (rules allow).
    await setDoc(doc(getSecondaryDb(), ADMINS_COLLECTION, profile.id), {
      ...profile,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await markBootstrap(profile.id, profile.email, getSecondaryDb());
    return profile;
  } catch (error) {
    const code = authCode(error);
    if (code.includes("email-already-in-use")) return null;
    throw error;
  } finally {
    try {
      await signOut(secondary);
    } catch {
      // ignore
    }
  }
}

export function mergeUsersCache(users: AdminUser[]) {
  saveAdminUsers(users.length ? users : DEFAULT_ADMIN_USERS);
}
