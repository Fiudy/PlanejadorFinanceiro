import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/app/auth-context";
import { sendAssistantMessage, type ChatMessage } from "@/shared/lib/gemini";
import { randomId } from "@/shared/lib/id";
import { useFinancialContext } from "./use-financial-context";

export interface AssistantMessage {
  id: string;
  role: "user" | "model";
  text: string;
}

function storageKey(userId: string) {
  return `planejador-financeiro:assistant-chat:${userId}`;
}

function loadMessages(userId: string): AssistantMessage[] {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? (JSON.parse(raw) as AssistantMessage[]) : [];
  } catch {
    return [];
  }
}

export function useAssistantChat() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const { context, isReady } = useFinancialContext();

  const [messages, setMessages] = useState<AssistantMessage[]>(() => (userId ? loadMessages(userId) : []));

  useEffect(() => {
    if (!userId) return;
    localStorage.setItem(storageKey(userId), JSON.stringify(messages));
  }, [messages, userId]);

  const sendMessage = useMutation({
    mutationFn: async (text: string) => {
      const userMessage: AssistantMessage = { id: randomId(), role: "user", text };
      const history: ChatMessage[] = [...messages, userMessage].map((m) => ({ role: m.role, text: m.text }));
      setMessages((current) => [...current, userMessage]);
      const reply = await sendAssistantMessage(context, history);
      const modelMessage: AssistantMessage = { id: randomId(), role: "model", text: reply };
      setMessages((current) => [...current, modelMessage]);
      return modelMessage;
    },
  });

  const clearConversation = () => {
    setMessages([]);
    if (userId) localStorage.removeItem(storageKey(userId));
  };

  return { messages, sendMessage, clearConversation, isContextReady: isReady };
}
