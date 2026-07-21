import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardHeader, CardTitle } from "@/shared/ui/card";
import type { CategoryBreakdownItem } from "@/application/use-cases/dashboard-use-cases";
import { EmptyState } from "@/shared/ui/empty-state";
import { PieChart as PieChartIcon } from "lucide-react";

export function CategoryBreakdownChart({ items }: { items: CategoryBreakdownItem[] }) {
  return (
    <Card variant="glass" className="dash-animate">
      <CardHeader>
        <CardTitle>Gastos por categoria (mês atual)</CardTitle>
      </CardHeader>

      {items.length === 0 ? (
        <EmptyState
          icon={PieChartIcon}
          title="Nenhuma despesa este mês"
          description="Assim que você registrar despesas, a distribuição por categoria aparece aqui."
        />
      ) : (
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <div className="h-56 w-56 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={items.map((item) => ({ name: item.categoryName, value: item.amount.reais }))}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {items.map((item) => (
                    <Cell key={item.categoryId} fill={item.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) =>
                    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value))
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="flex w-full flex-col gap-2">
            {items.slice(0, 6).map((item) => (
              <li key={item.categoryId} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-ink-950 dark:text-paper-50">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.categoryName}
                </span>
                <span className="tabular text-muted-500">{item.amount.format()}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
