import { ArrowDownRight, ArrowUpRight, Repeat } from "lucide-react";
import { Card } from "@/shared/ui/card";
import { formatDate } from "@/shared/lib/date";
import type { RecentActivityItem } from "@/application/use-cases/dashboard-use-cases";
import type { Money } from "@/domain/value-objects/money";

/** Barra empilhada simples — mais fácil de ler de relance que um anel segmentado. */
function CompositionBar({ income, essential, variable }: { income: Money; essential: Money; variable: Money }) {
  const total = Math.max(income.inCents, essential.inCents + variable.inCents, 1);
  const essentialPct = Math.min(100, (essential.inCents / total) * 100);
  const variablePct = Math.min(100 - essentialPct, (variable.inCents / total) * 100);
  const savingsPct = Math.max(0, 100 - essentialPct - variablePct);

  return (
    <div className="w-full sm:w-64">
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-white/10">
        {essentialPct > 0 && <div className="h-full bg-coral-500" style={{ width: `${essentialPct}%` }} />}
        {variablePct > 0 && <div className="h-full bg-amber-500" style={{ width: `${variablePct}%` }} />}
        {savingsPct > 0 && <div className="h-full bg-accent-500" style={{ width: `${savingsPct}%` }} />}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-300">
        <span><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-accent-500 align-middle" />Poupança {savingsPct.toFixed(0)}%</span>
        <span><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-coral-500 align-middle" />Essencial {essentialPct.toFixed(0)}%</span>
        <span><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-amber-500 align-middle" />Variável {variablePct.toFixed(0)}%</span>
      </div>
    </div>
  );
}

export function RecentActivity({
  items,
  income,
  essential,
  variable,
}: {
  items: RecentActivityItem[];
  income: Money;
  essential: Money;
  variable: Money;
}) {
  return (
    <Card variant="glass" className="dash-animate overflow-hidden p-0">
      <div className="flex flex-col gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <p className="font-display text-lg font-semibold text-ink-950 dark:text-white">Atividade recente</p>
          <p className="mt-1 text-xs text-muted-500 dark:text-muted-300">Seus últimos movimentos, em um só lugar.</p>
        </div>
        <CompositionBar income={income} essential={essential} variable={variable} />
      </div>
      <div className="divide-y divide-border-light dark:divide-white/[.07]">
        {items.length === 0 && <p className="p-8 text-center text-sm text-muted-500 dark:text-muted-300">Nenhum lançamento recente.</p>}
        {items.map((item) => {
          const isIncome = item.type === "receita";
          return (
            <div key={item.id} className="flex items-center gap-3 px-5 py-3.5 transition-colors duration-300 hover:bg-paper-100/60 dark:hover:bg-white/[.025] sm:px-6">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border-light bg-white dark:border-white/10 dark:bg-white/[.045]"
                style={{ color: item.categoryColor }}
              >
                {isIncome ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate text-sm font-medium text-ink-950 dark:text-white">
                  <span className="truncate">{item.description}</span>
                  {item.isFixed && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-paper-100 px-1.5 py-0.5 text-[10px] font-medium text-muted-500 dark:bg-white/10 dark:text-muted-300">
                      <Repeat className="h-2.5 w-2.5" />
                      Fixa
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-muted-500 dark:text-muted-300">
                  {item.categoryName} · {formatDate(item.date)}
                </p>
              </div>
              <p className={`tabular text-sm font-semibold ${isIncome ? "text-accent-500 dark:text-accent-400" : "text-coral-500"}`}>
                {isIncome ? "+" : "−"} {item.amount.format()}
              </p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
