import { Link } from "react-router-dom";
import { Gauge as GaugeIcon } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/shared/ui/card";
import { Gauge } from "@/shared/ui/gauge";
import { Button } from "@/shared/ui/button";
import { Money } from "@/domain/value-objects/money";

function colorForUsage(ratio: number): string {
  if (ratio >= 1) return "#E5484D";
  if (ratio >= 0.8) return "#E08E45";
  return "#0F7B5C";
}

export function MonthlyLimitCard({ expense, limitCents }: { expense: Money; limitCents?: number }) {
  if (!limitCents) {
    return (
      <Card className="dash-animate">
        <CardHeader>
          <CardTitle>Limite mensal</CardTitle>
        </CardHeader>
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-paper-100 text-muted-500 dark:bg-ink-800">
            <GaugeIcon className="h-5 w-5" />
          </div>
          <p className="text-sm text-muted-500">
            Defina um limite mensal de despesas em Configurações para acompanhar aqui quanto já foi usado.
          </p>
          <Link to="/config">
            <Button variant="secondary" size="sm">
              Definir limite
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  const ratio = expense.inCents / limitCents;
  const percentage = Math.round(ratio * 100);
  const color = colorForUsage(ratio);
  const remaining = Money.fromCents(Math.max(0, limitCents - expense.inCents));
  const statusLabel = ratio >= 1 ? "Limite estourado" : ratio >= 0.8 ? "Perto do limite" : "Dentro do planejado";

  return (
    <Card className="dash-animate">
      <CardHeader>
        <CardTitle>Limite mensal</CardTitle>
      </CardHeader>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
        <Gauge value={Math.min(100, percentage)} color={color} label={`${percentage}%`} sublabel="utilizado" />
        <div className="flex w-full flex-col gap-3">
          <div>
            <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ backgroundColor: `${color}1a`, color }}>
              {statusLabel}
            </span>
            <p className="mt-1.5 text-sm text-muted-500">
              {ratio >= 1 ? "Você já passou do limite definido este mês." : `${remaining.format()} ainda disponíveis dentro do limite.`}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-500">Despesas</p>
              <p className="tabular font-semibold text-ink-950 dark:text-paper-50">{expense.format()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-500">Limite</p>
              <p className="tabular font-semibold text-ink-950 dark:text-paper-50">{Money.fromCents(limitCents).format()}</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
