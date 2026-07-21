import { Card, CardHeader, CardTitle } from "@/shared/ui/card";
import { ProgressBar } from "@/shared/ui/progress-bar";
import { Gauge } from "@/shared/ui/gauge";
import type { FinancialHealthScore } from "@/application/use-cases/financial-health-score-use-cases";
import { FINANCIAL_HEALTH_RATING_LABELS } from "@/application/use-cases/financial-health-score-use-cases";

function colorForScore(score: number): string {
  if (score < 40) return "#E5484D";
  if (score < 70) return "#E08E45";
  return "#0F7B5C";
}

export function FinancialHealthScoreCard({ data }: { data: FinancialHealthScore }) {
  return (
    <Card className="dash-animate">
      <CardHeader>
        <CardTitle>Score de saúde financeira</CardTitle>
      </CardHeader>

      <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-start sm:gap-6">
        <Gauge value={data.score} color={colorForScore(data.score)} label={String(data.score)} sublabel="/ 100" />

        <div className="flex w-full flex-col gap-3">
          <div>
            <span
              className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold"
              style={{ backgroundColor: `${colorForScore(data.score)}1a`, color: colorForScore(data.score) }}
            >
              {FINANCIAL_HEALTH_RATING_LABELS[data.rating]}
            </span>
            <p className="mt-1.5 text-sm text-muted-500">{data.headline}</p>
          </div>

          <ul className="flex flex-col gap-2.5">
            {data.factors.map((factor) => (
              <li key={factor.key}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-ink-950 dark:text-paper-50">{factor.label}</span>
                  <span className="tabular text-muted-500">{factor.score.toDisplayString(0)}</span>
                </div>
                <ProgressBar value={factor.score.value} tone={factor.score.value < 0.5 ? "coral" : "accent"} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
