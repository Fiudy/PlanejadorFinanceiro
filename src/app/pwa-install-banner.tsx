import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/shared/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "planejador-financeiro:pwa-install-dismissed";

/**
 * Banner de instalação do PWA. O navegador só dispara `beforeinstallprompt`
 * quando o app já satisfaz os critérios de instalabilidade (manifest +
 * service worker registrados) — por isso ele só aparece quando faz
 * sentido, sem verificação manual de suporte.
 */
export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === "true");

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  if (!deferredPrompt || dismissed) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "true");
    setDismissed(true);
  };

  const install = async () => {
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") setDeferredPrompt(null);
  };

  return (
    <div
      role="dialog"
      aria-label="Instalar aplicativo"
      className="glass fixed inset-x-4 bottom-20 z-30 flex items-center gap-3 rounded-2xl p-3 shadow-xl sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-80"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-100 text-accent-600 dark:bg-accent-600/15 dark:text-accent-400">
        <Download className="h-4.5 w-4.5" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink-950 dark:text-paper-50">Instalar o Planejador</p>
        <p className="text-xs text-muted-500">Acesso rápido pela tela inicial, com atalhos.</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <Button size="sm" onClick={install}>
          Instalar
        </Button>
        <button
          onClick={dismiss}
          aria-label="Dispensar sugestão de instalação"
          className="text-xs font-medium text-muted-500 hover:text-ink-950 dark:hover:text-paper-50"
        >
          Agora não
        </button>
      </div>
    </div>
  );
}
