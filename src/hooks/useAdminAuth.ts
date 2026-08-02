import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import {
  isSuperAdmin,
  loadAdminUsers,
  SESSION_STORAGE_KEY,
  type AdminPermission,
  type AdminUser,
} from "@/lib/admin-roles";
import { getFirebaseAuth } from "@/lib/firebase";
import {
  bootstrapSuperAdminIfNeeded,
  ensureAdminProfileFromAuth,
  fetchAdminUsersFromFirebase,
  mergeUsersCache,
} from "@/services/adminUsersService";

function authErrorKey(error: unknown): string {
  const code =
    error && typeof error === "object" && "code" in error
      ? String((error as { code?: string }).code)
      : "";

  if (code === "auth/operation-not-allowed") return "admin.authProviderDisabled";
  if (
    code === "auth/invalid-credential" ||
    code === "auth/wrong-password" ||
    code === "auth/invalid-email"
  ) {
    return "admin.authInvalidCredentials";
  }
  if (code === "auth/user-not-found") return "admin.authUserNotFound";
  if (code === "auth/email-already-in-use") return "admin.authEmailInUse";
  if (code === "auth/weak-password") return "admin.authWeakPassword";
  if (code === "auth/too-many-requests") return "admin.authTooManyRequests";
  if (code === "auth/unauthorized-domain") return "admin.authUnauthorizedDomain";
  if (code === "permission-denied") return "admin.authPermissionDenied";
  if (code.includes("network") || code.includes("unavailable")) return "admin.authNetwork";
  return "admin.loginFailed";
}

export function useAdminAuth() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const applyUser = useCallback((next: AdminUser | null) => {
    setUser(next);
    setAuthed(Boolean(next));
    if (next) {
      window.localStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({ userId: next.id, email: next.email }),
      );
    } else {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        try {
          const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
          if (raw) {
            const session = JSON.parse(raw) as { userId: string };
            const local = loadAdminUsers().find(
              (item) => item.id === session.userId && item.active,
            );
            if (local) {
              applyUser(local);
              return;
            }
          }
        } catch {
          // ignore
        }
        applyUser(null);
        return;
      }

      try {
        const profile = await ensureAdminProfileFromAuth(firebaseUser);
        if (!profile) {
          await signOut(auth);
          applyUser(null);
          return;
        }
        applyUser(profile);
        const users = await fetchAdminUsersFromFirebase();
        if (users.length) mergeUsersCache(users);
      } catch {
        applyUser(null);
      }
    });
    return () => unsub();
  }, [applyUser]);

  const login = useCallback(
    async (email?: string, password?: string): Promise<{ ok: boolean; error?: string }> => {
      setAuthError(null);
      const normalized = (email ?? "").trim().toLowerCase();
      const pass = password ?? "";
      if (!normalized || !pass) {
        const error = "admin.authCredentialsRequired";
        setAuthError(error);
        return { ok: false, error };
      }

      const auth = getFirebaseAuth();

      try {
        let credential;
        try {
          // Prefer signing into an existing Firebase Authentication user.
          credential = await signInWithEmailAndPassword(auth, normalized, pass);
        } catch (signInError) {
          const code =
            signInError && typeof signInError === "object" && "code" in signInError
              ? String((signInError as { code?: string }).code)
              : "";

          // User missing in Auth (or privacy-masked invalid-credential): try first-time create.
          const canBootstrap =
            code === "auth/user-not-found" || code === "auth/invalid-credential";

          if (!canBootstrap) throw signInError;

          try {
            const created = await bootstrapSuperAdminIfNeeded(normalized, pass);
            if (!created) throw signInError;
            credential = await signInWithEmailAndPassword(auth, normalized, pass);
          } catch (bootstrapError) {
            const bootstrapCode =
              bootstrapError &&
              typeof bootstrapError === "object" &&
              "code" in bootstrapError
                ? String((bootstrapError as { code?: string }).code)
                : "";
            // Email exists in Auth but password is wrong.
            if (bootstrapCode.includes("email-already-in-use")) throw signInError;
            throw bootstrapError;
          }
        }

        const profile = await ensureAdminProfileFromAuth(credential.user);
        if (!profile) {
          await signOut(auth);
          const error = "admin.authNoProfile";
          setAuthError(error);
          return { ok: false, error };
        }

        applyUser(profile);
        try {
          const users = await fetchAdminUsersFromFirebase();
          if (users.length) mergeUsersCache(users);
        } catch {
          // Profile is enough to enter the portal.
        }
        return { ok: true };
      } catch (error) {
        const code =
          error && typeof error === "object" && "code" in error
            ? String((error as { code?: string }).code)
            : "";

        const message = authErrorKey(error);
        setAuthError(message);
        if (typeof console !== "undefined") {
          console.error("[admin-login]", code || error);
        }
        return { ok: false, error: message };
      }
    },
    [applyUser],
  );

  const logout = useCallback(async () => {
    try {
      await signOut(getFirebaseAuth());
    } catch {
      // ignore
    }
    applyUser(null);
    navigate({ to: "/admin/login" });
  }, [applyUser, navigate]);

  const can = useCallback(
    (permission: AdminPermission) => {
      if (!user?.active) return false;
      if (permission === "users" || permission === "settings") {
        return isSuperAdmin(user);
      }
      return user.permissions.includes(permission);
    },
    [user],
  );

  const refreshUsers = useCallback(async () => {
    try {
      const users = await fetchAdminUsersFromFirebase();
      if (users.length) {
        mergeUsersCache(users);
        window.dispatchEvent(new Event("lunayairmarina-admin-users"));
      }
      return users;
    } catch {
      return loadAdminUsers();
    }
  }, []);

  return {
    authed,
    user,
    login,
    logout,
    can,
    refresh: refreshUsers,
    authError,
    isSuperAdmin: isSuperAdmin(user),
  };
}
