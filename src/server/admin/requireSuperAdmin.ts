import { getAdminFirestore, getFirebaseAdminApp } from "@/server/agent/firebaseAdmin";

export async function requireSuperAdminFromToken(idToken: string): Promise<string> {
  const { getAuth } = await import("firebase-admin/auth");
  const auth = getAuth(await getFirebaseAdminApp());
  const decoded = await auth.verifyIdToken(idToken);
  const db = await getAdminFirestore();
  const snap = await db.collection("admins").doc(decoded.uid).get();
  if (!snap.exists) throw new Error("FORBIDDEN");
  const data = snap.data();
  if (data?.role !== "super_admin" || data?.active === false) throw new Error("FORBIDDEN");
  return decoded.uid;
}
