import { useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles, Trash2, User } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { EmptyState } from "@/shared/ui/empty-state";
import { isGeminiConfigured } from "@/shared/lib/gemini";
import { useAssistantChat } from "../hooks/use-assistant-chat";
import { cn } from "@/shared/lib/cn";

const SUGGESTIONS = [
  "Com o que eu mais gasto?",
  "Como chego mais rápido na minha meta?",
  "Como está meu mês até agora?",
  "Dá pra cortar algum gasto?",
];

export function AssistantChatPage() {
  const { messages, sendMessage, clearConversation, isContextReady } = useAssistantChat();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sendMessage.isPending]);

  const handleSend = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sendMessage.isPending || !isContextReady) return;
    setInput("");
    sendMessage.mutate(trimmed);
  };

  if (!isGeminiConfigured) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink-950 dark:text-paper-50 sm:text-2xl">Assistente</h1>
          <p className="text-xs text-muted-500 sm:text-sm">Converse com a IA sobre suas finanças.</p>
        </div>
        <EmptyState
          icon={Bot}
          title="Assistente não configurado"
          description='Defina VITE_GEMINI_API_KEY no arquivo .env para ativar o chat com IA.'
        />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-8.5rem)] flex-col gap-3 sm:h-[calc(100dvh-6rem)]">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-xl font-semibold text-ink-950 dark:text-paper-50 sm:text-2xl">Assistente</h1>
          <p className="text-xs text-muted-500 sm:text-sm">Converse com a IA sobre suas finanças.</p>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearConversation} className="shrink-0 text-muted-500">
            <Trash2 className="h-4 w-4" />
            Limpar
          </Button>
        )}
      </div>

      <div className="glass min-h-0 flex-1 overflow-y-auto rounded-[var(--radius-card)] p-3 sm:p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-2 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-100 text-accent-600 dark:bg-accent-600/15 dark:text-accent-400">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-ink-950 dark:text-paper-50">
                {isContextReady ? "Pergunte algo sobre suas finanças" : "Carregando seus dados..."}
              </p>
              <p className="mt-1 text-xs text-muted-500">Respostas curtas, baseadas nos seus lançamentos.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleSend(suggestion)}
                  className="rounded-full border border-border-light px-3 py-1.5 text-xs font-medium text-ink-950 transition-colors hover:border-accent-500 hover:text-accent-600 dark:border-border-dark dark:text-paper-50 dark:hover:text-accent-400"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {messages.map((message) => (
              <li key={message.id} className={cn("flex items-start gap-2", message.role === "user" && "flex-row-reverse")}>
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                    message.role === "user"
                      ? "bg-accent-500 text-white"
                      : "bg-paper-100 text-muted-500 dark:bg-ink-800",
                  )}
                >
                  {message.role === "user" ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                </div>
                <p
                  className={cn(
                    "max-w-[80%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm",
                    message.role === "user"
                      ? "bg-accent-500 text-white"
                      : "bg-paper-100 text-ink-950 dark:bg-ink-800 dark:text-paper-50",
                  )}
                >
                  {message.text}
                </p>
              </li>
            ))}
            {sendMessage.isPending && (
              <li className="flex items-center gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-paper-100 text-muted-500 dark:bg-ink-800">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="flex gap-1 rounded-2xl bg-paper-100 px-3.5 py-3 dark:bg-ink-800">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-500 [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-500 [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-500" />
                </div>
              </li>
            )}
            {sendMessage.isError && (
              <li className="text-sm text-coral-500">
                {sendMessage.error instanceof Error ? sendMessage.error.message : "Não foi possível responder agora."}
              </li>
            )}
            <div ref={scrollRef} />
          </ul>
        )}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          handleSend(input);
        }}
        className="flex items-center gap-2"
      >
        <Input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={isContextReady ? "Pergunte sobre seus gastos, metas..." : "Carregando seus dados..."}
          aria-label="Mensagem para o assistente"
          disabled={sendMessage.isPending || !isContextReady}
          className="h-12 flex-1"
        />
        <Button
          type="submit"
          size="icon"
          className="h-12 w-12 shrink-0"
          disabled={sendMessage.isPending || !isContextReady || !input.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
