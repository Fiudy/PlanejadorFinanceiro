import { CalendarClock } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { EmptyState } from "@/shared/ui/empty-state";
import type { UpcomingDueItem } from "@/application/use-cases/dashboard-use-cases";
import { formatDate } from "@/shared/lib/date";

export function UpcomingDueList({ items }: { items: UpcomingDueItem[] }) {
  return (
    <Card className="dash-animate">
      <CardHeader>
        <CardTitle>Próximos vencimentos</CardTitle>
      </CardHeader>

      {items.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="Nada por vir"
          description="Contas fixas e faturas de cartão vão aparecer aqui conforme forem cadastradas."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {items.slice(0, 6).map((item) => (
            <li key={item.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ink-950 dark:text-paper-50">{item.label}</p>
                <p className="text-xs text-muted-500">{formatDate(item.dueDate)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={item.kind === "fatura-cartao" ? "coral" : "muted"}>
                  {item.kind === "fatura-cartao" ? "Cartão" : "Conta fixa"}
                </Badge>
                <span className="tabular text-sm font-medium">{item.amount.format()}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
