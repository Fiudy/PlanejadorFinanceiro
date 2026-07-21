import { Info } from "lucide-react";
import { AccountsSection } from "./accounts-section";

export function AccountsPage() {
  return (
    <div className="flex flex-col gap-4">
      <header>
        <span className="text-xs font-semibold uppercase tracking-[.16em] text-accent-500">Seu patrimônio</span>
        <h1 className="mt-1 font-display text-xl font-semibold sm:text-2xl">Contas bancárias</h1>
      </header>

      <div className="flex items-start gap-2 rounded-[var(--radius-control)] bg-accent-100/60 px-3 py-2.5 text-xs text-accent-600 dark:bg-accent-600/10 dark:text-accent-400">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p>A conta guarda saldo e recebe lançamentos; o cartão só controla limite e fatura, e não cria conta sozinho.</p>
      </div>

      <div className="max-w-3xl">
        <AccountsSection />
      </div>
    </div>
  );
}
