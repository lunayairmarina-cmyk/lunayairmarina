import { createServerFn } from "@tanstack/react-start";
import { processChatMessage } from "@/server/chatbot/chat";
import { saveChatContact } from "@/server/chatbot/saveContact";

export const sendChatbotMessage = createServerFn({ method: "POST" })
  .validator((data: unknown) => data)
  .handler(async ({ data }) => processChatMessage(data));

export const submitChatbotContact = createServerFn({ method: "POST" })
  .validator((data: unknown) => data)
  .handler(async ({ data }) => saveChatContact(data));
