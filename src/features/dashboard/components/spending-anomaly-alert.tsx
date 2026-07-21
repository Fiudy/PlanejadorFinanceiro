import { AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/shared/ui/card";
import type { SpendingAnomaly } from "@/application/use-cases/spending-anomaly-use-cases";

export function SpendingAnomalyAlert({ anomalies }: { anomalies: SpendingAnomaly[] }) {
  if (anomalies.length === 0) return null;

  return (
    <Card className="dash-animate border-coral-100 dark:border-coral-500/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-coral-600 dark:text-coral-500">
          <AlertTriangle className="h-4 w-4" />
          Gastos fora do padrão
        </CardTitle>
      </CardHeader>
      <ul className="flex flex-col gap-3">
        {anomalies.map((anomaly) => (
          <li key={anomaly.categoryId} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-sm text-ink-950 dark:text-paper-50">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: anomaly.color }} />
              {anomaly.categoryName}
            </span>
            <div className="flex items-center gap-2 text-right">
              <span className="tabular text-sm font-medium text-ink-950 dark:text-paper-50">
                {anomaly.currentAmount.format()}
              </span>
              <span className="rounded-full bg-coral-100 px-2 py-0.5 text-xs font-semibold text-coral-600 dark:bg-coral-500/15 dark:text-coral-500">
                +{anomaly.deviation.toDisplayString(0)}
              </span>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted-500">Comparado com a média dos últimos 3 meses nessas categorias.</p>
    </Card>
  );
}
