import type { Firestore as AdminFirestore } from "firebase-admin/firestore";
import { AI_LEADS_COLLECTION } from "@/lib/agent/types";
import { deleteAllConversationsAdmin } from "@/server/agent/conversationStoreAdmin";

const CHATBOT_CONFIG_DOC = "chatbot";

async function deleteCollectionRoot(
  db: AdminFirestore,
  collectionName: string,
): Promise<number> {
  const snap = await db.collection(collectionName).get();
  if (snap.empty) return 0;
  const batch = db.batch();
  snap.docs.forEach((item) => batch.delete(item.ref));
  await batch.commit();
  return snap.size;
}

export async function bumpChatbotIdentityResetEpoch(db: AdminFirestore): Promise<number> {
  const ref = db.collection("config").doc(CHATBOT_CONFIG_DOC);
  const snap = await ref.get();
  const current =
    snap.exists && typeof snap.data()?.identityResetEpoch === "number"
      ? (snap.data()?.identityResetEpoch as number)
      : 0;
  const next = current + 1;
  await ref.set(
    {
      identityResetEpoch: next,
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );
  return next;
}

export async function clearAllChatbotVisitorDataAdmin(db: AdminFirestore): Promise<{
  conversations: number;
  leads: number;
  identityResetEpoch: number;
}> {
  const conversations = await deleteAllConversationsAdmin(db);
  const leads = await deleteCollectionRoot(db, AI_LEADS_COLLECTION);
  const identityResetEpoch = await bumpChatbotIdentityResetEpoch(db);
  return { conversations, leads, identityResetEpoch };
}
