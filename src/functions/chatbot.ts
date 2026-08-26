import { createServerFn } from "@tanstack/react-start";
import { processChatMessage } from "@/server/chatbot/chat";

export const sendChatbotMessage = createServerFn({ method: "POST" })
  .validator((data: unknown) => data)
  .handler(async ({ data }) => processChatMessage(data));
