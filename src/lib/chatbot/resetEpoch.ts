import { doc, getDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase";

const CHATBOT_CONFIG_DOC = "chatbot";

export async function fetchChatbotIdentityResetEpoch(): Promise<number> {
  try {
    const snap = await getDoc(doc(getDb(), "config", CHATBOT_CONFIG_DOC));
    if (!snap.exists()) return 0;
    const epoch = snap.data()?.identityResetEpoch;
    return typeof epoch === "number" && Number.isFinite(epoch) ? epoch : 0;
  } catch {
    return 0;
  }
}
