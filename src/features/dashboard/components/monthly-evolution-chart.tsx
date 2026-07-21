import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardHeader, CardTitle } from "@/shared/ui/card";
import type { MonthlyEvolutionItem } from "@/application/use-cases/dashboard-use-cases";
import { monthLabel } from "@/shared/lib/date";

export function MonthlyEvolutionChart({ items }: { items: MonthlyEvolutionItem[] }) {
  const data = items.map((item) => ({
    month: monthLabel(item.month),
    Receitas: item.income.reais,
    Despesas: item.expense.reais,
  }));

  return (
    <Card variant="glass" className="dash-animate">
      <CardHeader>
        <CardTitle>Evolução mensal</CardTitle>
      </CardHeader>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4}>
            <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} stroke="currentColor" opacity={0.5} />
            <YAxis hide />
            <Tooltip
              formatter={(value) =>
                new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value))
              }
              cursor={{ fill: "transparent" }}
            />
            <Bar dataKey="Receitas" fill="#0F7B5C" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Despesas" fill="#E5484D" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
