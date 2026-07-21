import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardHeader, CardTitle } from "@/shared/ui/card";
import type { CashFlowForecastPoint } from "@/application/use-cases/cash-flow-forecast-use-cases";
import { formatDate } from "@/shared/lib/date";

export function CashFlowForecastChart({ points }: { points: CashFlowForecastPoint[] }) {
  const data = points.map((point, index) => ({
    date: formatDate(point.date).slice(0, 5),
    atual: index === 0 ? point.balance.reais : undefined,
    projetado: point.balance.reais,
  }));

  return (
    <Card variant="glass" className="dash-animate">
      <CardHeader>
        <CardTitle>Previsão de saldo (30 dias)</CardTitle>
      </CardHeader>
      <p className="-mt-2 mb-3 text-xs text-muted-500">
        Combina contas fixas, parcelas de cartão futuras e sua média de gastos variáveis.
      </p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              fontSize={11}
              stroke="currentColor"
              opacity={0.5}
              interval={4}
            />
            <YAxis hide />
            <Tooltip
              formatter={(value) =>
                new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value))
              }
              cursor={{ strokeDasharray: "3 3" }}
            />
            <Line
              type="monotone"
              dataKey="projetado"
              name="Saldo projetado"
              stroke="#26A37C"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="atual"
              name="Saldo atual"
              stroke="#0F7B5C"
              strokeWidth={2}
              dot={{ r: 4 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
