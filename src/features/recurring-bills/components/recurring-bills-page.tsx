import { useMemo, useState } from "react";
import { CalendarClock, Plus, ReceiptText, Repeat, Trash2, TrendingDown } from "lucide-react";
import { Card } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { EmptyState } from "@/shared/ui/empty-state";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { Money } from "@/domain/value-objects/money";
import type { RecurringBill } from "@/domain/entities/recurring-bill";
import { RECURRENCE_LABELS, RECURRENCE_MONTHS } from "@/domain/entities/recurring-bill";
import { addMonths, monthLabel, formatDate } from "@/shared/lib/date";
import { useCategories } from "@/features/settings/hooks/use-categories";
import { useDeactivateRecurringBill, useRecurringBills } from "../hooks/use-recurring-bills";
import { RecurringBillFormDialog } from "./recurring-bill-form-dialog";

/** Data prevista da última parcela — só existe para contas com número finito de repetições. */
function payoffDate(bill: RecurringBill): Date | null {
  if (bill.remainingOccurrences === undefined) return null;
  return addMonths(bill.nextOccurrence, (bill.remainingOccurrences - 1) * RECURRENCE_MONTHS[bill.period]);
}

export function RecurringBillsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingDeactivate, setPendingDeactivate] = useState<RecurringBill | null>(null);
  const { data: bills = [], isLoading } = useRecurringBills();
  const { data: categories = [] } = useCategories("despesa");
  const deactivate = useDeactivateRecurringBill();
  const activeBills = useMemo(
    () => bills.filter((bill) => bill.active).sort((a, b) => a.nextOccurrence.getTime() - b.nextOccurrence.getTime()),
    [bills],
  );
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const monthlyCents = activeBills.reduce((sum, bill) => sum + Math.round(bill.amount.inCents / RECURRENCE_MONTHS[bill.period]), 0);
  const sevenDays = new Date();
  sevenDays.setDate(sevenDays.getDate() + 7);
  const dueSoon = activeBills.filter((bill) => bill.nextOccurrence <= sevenDays).length;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[.16em] text-accent-500">Planejamento recorrente</span>
          <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">Contas fixas</h1>
          <p className="mt-1 text-sm text-muted-500">Cadastre despesas recorrentes e acompanhe os próximos vencimentos.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} size="lg">
          <Plus className="h-4 w-4" />
          Adicionar despesa fixa
        </Button>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card variant="glass">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-500">Custo mensal estimado</p>
              <p className="mt-2 tabular text-2xl font-semibold text-coral-500">{Money.fromCents(monthlyCents).format()}</p>
            </div>
            <TrendingDown className="h-6 w-6 text-coral-500" />
          </div>
        </Card>
        <Card variant="glass">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-500">Despesas ativas</p>
              <p className="mt-2 tabular text-2xl font-semibold">{activeBills.length}</p>
            </div>
            <Repeat className="h-6 w-6 text-accent-500" />
          </div>
        </Card>
        <Card variant="glass">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-500">Próximos 7 dias</p>
              <p className="mt-2 tabular text-2xl font-semibold text-amber-500">{dueSoon}</p>
            </div>
            <CalendarClock className="h-6 w-6 text-amber-500" />
          </div>
        </Card>
      </div>

      <Card variant="glass" className="p-0">
        <div className="flex items-center justify-between border-b border-border-light px-5 py-4 dark:border-white/10 sm:px-6">
          <div>
            <h2 className="font-display text-lg font-semibold">Agenda de despesas</h2>
            <p className="text-xs text-muted-500">Ordenada pelo próximo vencimento</p>
          </div>
          <ReceiptText className="h-5 w-5 text-muted-500" />
        </div>
        {isLoading ? (
          <p className="p-8 text-center text-sm text-muted-500">Carregando despesas...</p>
        ) : activeBills.length === 0 ? (
          <EmptyState
            icon={Repeat}
            title="Nenhuma despesa fixa"
            description="Adicione aluguel, internet, assinaturas ou qualquer gasto recorrente."
            action={
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                Adicionar primeira despesa
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-border-light dark:divide-white/10">
            {activeBills.map((bill) => {
              const category = categoryById.get(bill.categoryId);
              const overdue = bill.nextOccurrence < new Date();
              const endsAt = payoffDate(bill);
              return (
                <li key={bill.id} className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-paper-100/60 dark:hover:bg-white/[.025] sm:flex-row sm:items-center sm:px-6">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${category?.color ?? "#64748B"}1A`, color: category?.color ?? "#64748B" }}
                  >
                    <ReceiptText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{bill.name}</p>
                    <p className="mt-0.5 text-xs text-muted-500">
                      {category?.name ?? "Sem categoria"} · {RECURRENCE_LABELS[bill.period]}
                      {endsAt ? (
                        <> · Mais {bill.remainingOccurrences}x, até {monthLabel(endsAt)}</>
                      ) : (
                        <> · Repete sempre</>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <Badge tone={overdue ? "coral" : "neutral"}>{overdue ? "Vencida" : formatDate(bill.nextOccurrence)}</Badge>
                    <span className="tabular min-w-24 text-right text-sm font-semibold text-coral-500">− {bill.amount.format()}</span>
                    <Button variant="ghost" size="icon" aria-label={`Desativar ${bill.name}`} onClick={() => setPendingDeactivate(bill)}>
                      <Trash2 className="h-4 w-4 text-muted-500" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
      <p className="rounded-xl border border-accent-500/20 bg-accent-100/40 px-4 py-3 text-xs text-accent-600 dark:bg-accent-600/10 dark:text-accent-400">
        Quando uma conta fixa vence, o Planejador registra automaticamente a despesa na primeira conta ativa e agenda a próxima ocorrência.
      </p>
      <RecurringBillFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />

      <ConfirmDialog
        open={pendingDeactivate !== null}
        onClose={() => setPendingDeactivate(null)}
        onConfirm={() => {
          if (!pendingDeactivate) return;
          deactivate.mutate(pendingDeactivate.id, { onSuccess: () => setPendingDeactivate(null) });
        }}
        title="Desativar conta fixa"
        description={`"${pendingDeactivate?.name ?? ""}" vai parar de lançar despesas automaticamente. Você pode cadastrá-la de novo quando quiser.`}
        confirmLabel="Desativar"
        isLoading={deactivate.isPending}
      />
    </div>
  );
}
