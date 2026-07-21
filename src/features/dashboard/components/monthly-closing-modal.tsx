import type { ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Dialog } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { SwipeableCards } from "@/shared/ui/swipeable-cards";
import type { MonthlyClosingSummary } from "@/application/use-cases/monthly-closing-use-cases";
import { monthLabelLong } from "@/shared/lib/date";
import { cn } from "@/shared/lib/cn";

function ClosingCard({ children }: { children: ReactNode }) {
  return <div className="flex min-h-64 flex-col justify-center gap-4 px-1 py-2 text-center">{children}</div>;
}

function SummaryCard({ summary }: { summary: MonthlyClosingSummary }) {
  const isPositive = !summary.netResult.isNegative();
  return (
    <ClosingCard>
      <p className="text-sm text-muted-500">Resultado de {monthLabelLong(summary.month)}</p>
      <div className="flex items-center justify-center gap-2">
        {isPositive ? (
          <TrendingUp className="h-6 w-6 text-accent-500" />
        ) : (
          <TrendingDown className="h-6 w-6 text-coral-500" />
        )}
        <span
          className={cn(
            "font-display text-3xl font-bold tabular",
            isPositive ? "text-accent-500" : "text-coral-500",
          )}
        >
          {summary.netResult.format()}
        </span>
      </div>
      <div className="mx-auto flex gap-8 text-sm">
        <div>
          <p className="text-muted-500">Receitas</p>
          <p className="font-semibold tabular text-ink-950 dark:text-paper-50">{summary.totalIncome.format()}</p>
        </div>
        <div>
          <p className="text-muted-500">Despesas</p>
          <p className="font-semibold tabular text-ink-950 dark:text-paper-50">{summary.totalExpense.format()}</p>
        </div>
      </div>
    </ClosingCard>
  );
}

function ComparisonCard({ summary }: { summary: MonthlyClosingSummary }) {
  const data = [
    { label: "Média (3 meses)", valor: summary.averageExpenseLast3Months.reais },
    { label: monthLabelLong(summary.month), valor: summary.totalExpense.reais },
  ];
  const isAboveAverage = summary.expenseVsAverage.value > 0;

  return (
    <ClosingCard>
      <p className="text-sm text-muted-500">Despesas frente à média</p>
      <p className={cn("font-display text-2xl font-bold", isAboveAverage ? "text-coral-500" : "text-accent-500")}>
        {isAboveAverage ? "+" : ""}
        {summary.expenseVsAverage.toDisplayString(0)}
      </p>
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.15} />
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="label" tickLine={false} axisLine={false} fontSize={12} width={110} />
            <Tooltip
              formatter={(value) =>
                new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value))
              }
              cursor={{ fill: "transparent" }}
            />
            <Bar dataKey="valor" fill="#E5484D" radius={[0, 4, 4, 0]} barSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ClosingCard>
  );
}

function TopCategoryCard({ summary }: { summary: MonthlyClosingSummary }) {
  const category = summary.topGrowingCategory;
  if (!category) {
    return (
      <ClosingCard>
        <p className="text-sm text-muted-500">Categoria que mais cresceu</p>
        <p className="text-sm text-ink-950 dark:text-paper-50">Nenhum aumento notável este mês.</p>
      </ClosingCard>
    );
  }

  return (
    <ClosingCard>
      <p className="text-sm text-muted-500">Categoria que mais cresceu</p>
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: `${category.color}1a` }}>
        <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: category.color }} />
      </div>
      <p className="font-display text-lg font-semibold text-ink-950 dark:text-paper-50">{category.categoryName}</p>
      <p className="tabular text-sm text-muted-500">
        {category.amount.format()} · <span className="font-medium text-coral-500">+{category.growth.toDisplayString(0)}</span>
      </p>
    </ClosingCard>
  );
}

export function MonthlyClosingModal({
  summary,
  open,
  onClose,
}: {
  summary: MonthlyClosingSummary | undefined;
  open: boolean;
  onClose: () => void;
}) {
  if (!summary) return null;

  return (
    <Dialog open={open} onClose={onClose} title="Seu mês em números">
      <SwipeableCards>
        {[
          <SummaryCard key="summary" summary={summary} />,
          <ComparisonCard key="comparison" summary={summary} />,
          <TopCategoryCard key="top-category" summary={summary} />,
        ]}
      </SwipeableCards>
      <Button variant="primary" size="lg" className="mt-4 w-full justify-center" onClick={onClose}>
        Entendi
      </Button>
    </Dialog>
  );
}
