import "dotenv/config";
import { processChatMessage } from "../src/server/chatbot/chat.ts";

const result = await processChatMessage({
  message: "السلام عليكم",
  language: "ar",
  sessionId: "test-sess-12345678",
  history: [],
});

console.log(JSON.stringify(result, null, 2));
