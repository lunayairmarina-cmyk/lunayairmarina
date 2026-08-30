import { createServerFn } from "@tanstack/react-start";
import { getAdminFirestore, getFirebaseAdminApp } from "@/server/agent/firebaseAdmin";
import { requireSuperAdminFromToken } from "@/server/admin/requireSuperAdmin";

const CREDENTIALS_DOC = "credentials";
const PRIVATE_COLLECTION = "private";

export const setAdminUserPassword = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const payload = data as { idToken?: string; uid?: string; password?: string };
    const password = payload.password?.trim() ?? "";
    const uid = payload.uid?.trim() ?? "";
    const idToken = payload.idToken?.trim() ?? "";
    if (!idToken || !uid || password.length < 6) throw new Error("invalid_payload");
    return { idToken, uid, password };
  })
  .handler(async ({ data }) => {
    try {
      await requireSuperAdminFromToken(data.idToken);
      const { getAuth } = await import("firebase-admin/auth");
      const auth = getAuth(await getFirebaseAdminApp());
      await auth.updateUser(data.uid, { password: data.password });
      const db = await getAdminFirestore();
      await db
        .collection("admins")
        .doc(data.uid)
        .collection(PRIVATE_COLLECTION)
        .doc(CREDENTIALS_DOC)
        .set({
          password: data.password,
          updatedAt: new Date().toISOString(),
        });
      return { ok: true as const };
    } catch (error) {
      return {
        ok: false as const,
        error: error instanceof Error ? error.message : "password_update_failed",
      };
    }
  });
