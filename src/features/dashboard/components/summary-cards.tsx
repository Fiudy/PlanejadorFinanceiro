import { ArrowDownRight, ArrowUpRight, Wallet, ShieldCheck } from "lucide-react";
import { Card } from "@/shared/ui/card";
import { Money } from "@/domain/value-objects/money";
import type { Percentage } from "@/domain/value-objects/percentage";
import { cn } from "@/shared/lib/cn";
import { useCountUp } from "@/shared/lib/use-count-up";

const formatMoney = (reais: number) => Money.fromReais(reais).format();

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "default",
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "accent" | "coral" | "gradient";
}) {
  return (
    <Card variant="glass" className="dash-animate flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[.1em] text-muted-500 dark:text-muted-300">{label}</p>
        <p
          className={cn(
            "mt-2 font-display text-2xl font-semibold tabular",
            tone === "accent" && "text-accent-500",
            tone === "coral" && "text-coral-500",
            tone === "gradient" && "text-gradient-accent",
          )}
        >
          {value}
        </p>
        {hint && <p className="mt-1 text-[11px] text-muted-500">{hint}</p>}
      </div>
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          tone === "accent" && "bg-accent-100 text-accent-600 dark:bg-accent-600/15 dark:text-accent-400",
          tone === "coral" && "bg-coral-100 text-coral-600 dark:bg-coral-500/15 dark:text-coral-500",
          tone === "default" && "bg-paper-100 text-muted-500 dark:bg-ink-800",
        )}
      >
        <Icon className="h-4.5 w-4.5" />
      </div>
    </Card>
  );
}

export function SummaryCards({
  balance,
  income,
  expense,
  committedRatio,
}: {
  balance: Money;
  income: Money;
  expense: Money;
  committedRatio: Percentage;
}) {
  const balanceDisplay = useCountUp(balance.reais, formatMoney);
  const incomeDisplay = useCountUp(income.reais, formatMoney);
  const expenseDisplay = useCountUp(expense.reais, formatMoney);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={Wallet}
        label="Saldo consolidado"
        value={balanceDisplay}
        hint="Saldo inicial das contas + todas as movimentações"
        tone="gradient"
      />
      <StatCard icon={ArrowUpRight} label="Receitas do mês" value={incomeDisplay} tone="accent" />
      <StatCard icon={ArrowDownRight} label="Despesas do mês" value={expenseDisplay} tone="coral" />
      <StatCard
        icon={ShieldCheck}
        label="Renda comprometida"
        value={committedRatio.toDisplayString(0)}
        tone={committedRatio.value > 0.7 ? "coral" : "default"}
      />
    </div>
  );
}
