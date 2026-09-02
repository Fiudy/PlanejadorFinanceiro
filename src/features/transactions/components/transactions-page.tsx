import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, CreditCard, FileUp, Plus, ReceiptText, Search } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Card, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Select } from "@/shared/ui/select";
import { Input } from "@/shared/ui/input";
import { useTransactions } from "../hooks/use-transactions";
import { useAccounts } from "@/features/accounts/hooks/use-accounts";
import { useCategories } from "@/features/settings/hooks/use-categories";
import { useAllCardInstallmentsForMonth } from "@/features/cards/hooks/use-cards";
import { useRecurringBillOccurrencesForMonth } from "@/features/recurring-bills/hooks/use-recurring-bill-occurrences";
import { RECURRING_BILL_TRANSACTION_SUFFIX } from "@/domain/entities/recurring-bill";
import { TransactionList } from "./transaction-list";
import { TransactionFormDialog } from "./transaction-form-dialog";
import { ImportStatementDialog } from "./import-statement-dialog";
import { PageSpinner } from "@/shared/ui/spinner";
import { Money } from "@/domain/value-objects/money";
import type { Transaction } from "@/domain/entities/transaction";
import { addMonths, endOfMonth, isSameDay, monthLabelLong, startOfMonth } from "@/shared/lib/date";
import { cn } from "@/shared/lib/cn";

export function TransactionsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [referenceMonth, setReferenceMonth] = useState(() => startOfMonth(new Date()));
  const [typeFilter, setTypeFilter] = useState<"todas" | "despesa" | "receita">("todas");
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "amount-desc" | "amount-asc">("date-desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();

  const monthRange = useMemo(
    () => ({ from: referenceMonth, to: endOfMonth(referenceMonth) }),
    [referenceMonth],
  );
  const { data: transactions, isLoading } = useTransactions(monthRange);
  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();
  const { data: installments = [] } = useAllCardInstallmentsForMonth(referenceMonth);
  const billOccurrences = useRecurringBillOccurrencesForMonth(referenceMonth);

  const isCurrentMonth = referenceMonth.getTime() === startOfMonth(new Date()).getTime();

  const { income, expense } = useMemo(() => {
    const items = transactions ?? [];
    return {
      income: items.filter((t) => t.type === "receita").reduce((sum, t) => sum.add(t.amount), Money.zero()),
      expense: items.filter((t) => t.type === "despesa").reduce((sum, t) => sum.add(t.amount), Money.zero()),
    };
  }, [transactions]);

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const filteredTransactions = useMemo(() => {
    let items = transactions ?? [];
    if (typeFilter !== "todas") items = items.filter((t) => t.type === typeFilter);

    const query = searchQuery.trim().toLowerCase();
    if (query) {
      items = items.filter(
        (t) =>
          t.description.toLowerCase().includes(query) ||
          (categoryById.get(t.categoryId)?.name.toLowerCase().includes(query) ?? false),
      );
    }

    return [...items].sort((a, b) => {
      switch (sortBy) {
        case "date-asc":
          return a.date.getTime() - b.date.getTime();
        case "amount-desc":
          return b.amount.inCents - a.amount.inCents;
        case "amount-asc":
          return a.amount.inCents - b.amount.inCents;
        case "date-desc":
        default:
          return b.date.getTime() - a.date.getTime();
      }
    });
  }, [transactions, typeFilter, searchQuery, sortBy, categoryById]);

  // Contas fixas que ainda não viraram lançamento neste mês (já foram
  // lançadas de verdade aparecem na lista principal, com o selo "Fixa").
  const pendingBillOccurrences = useMemo(() => {
    const items = transactions ?? [];
    return billOccurrences.filter(
      ({ bill, date }) =>
        !items.some(
          (t) =>
            t.categoryId === bill.categoryId &&
            t.description === `${bill.name}${RECURRING_BILL_TRANSACTION_SUFFIX}` &&
            isSameDay(t.date, date),
        ),
    );
  }, [billOccurrences, transactions]);

  const openCreate = () => {
    setEditingTransaction(null);
    setDialogOpen(true);
  };
  const openEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setDialogOpen(true);
  };

  // Atalho do PWA ("Novo lançamento" no ícone do app) chega como ?novo=transacao.
  useEffect(() => {
    if (searchParams.get("novo") === "transacao") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza com o deep link do atalho de PWA, não é estado derivável em render
      openCreate();
      setSearchParams(
        (params) => {
          params.delete("novo");
          return params;
        },
        { replace: true },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);
  const closeDialog = () => {
    setDialogOpen(false);
    setEditingTransaction(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-xl font-semibold text-ink-950 dark:text-paper-50 sm:text-2xl">Lançamentos</h1>
          <p className="text-xs text-muted-500 sm:text-sm">Suas receitas e despesas, mês a mês.</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button onClick={() => setImportOpen(true)} className="oc-soft">
            <FileUp className="h-4 w-4" />
            Importar fatura ou extrato
          </button>
          <Button onClick={openCreate} size="sm" className="sm:h-10 sm:px-4 sm:text-sm">
            <Plus className="h-4 w-4" />
            Novo
          </Button>
        </div>
      </div>

      {/* Navegador de mês */}
      <div className="glass flex items-center justify-between rounded-[var(--radius-control)] px-2 py-1.5">
        <Button variant="ghost" size="icon" aria-label="Mês anterior" onClick={() => setReferenceMonth((m) => addMonths(m, -1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex flex-col items-center">
          <span className="font-display text-sm font-semibold first-letter:uppercase text-ink-950 dark:text-paper-50">
            {monthLabelLong(referenceMonth)}
          </span>
          {!isCurrentMonth && (
            <button
              type="button"
              onClick={() => setReferenceMonth(startOfMonth(new Date()))}
              className="text-[11px] font-medium text-accent-500 hover:underline"
            >
              Voltar para hoje
            </button>
          )}
        </div>
        <Button variant="ghost" size="icon" aria-label="Próximo mês" onClick={() => setReferenceMonth((m) => addMonths(m, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Totais do mês */}
      <div className="grid grid-cols-2 gap-3">
        <Card variant="glass" className="py-3">
          <p className="text-xs text-muted-500">Receitas</p>
          <p className="tabular mt-1 text-lg font-semibold text-accent-500">{income.format()}</p>
        </Card>
        <Card variant="glass" className="py-3">
          <p className="text-xs text-muted-500">Despesas</p>
          <p className="tabular mt-1 text-lg font-semibold text-coral-500">{expense.format()}</p>
        </Card>
      </div>

      <Card className="p-0 sm:p-5">
        <div className="flex flex-col gap-3 px-4 pt-4 sm:px-0 sm:pt-0">
          <CardTitle>Lançamentos</CardTitle>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-500" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Buscar por descrição ou categoria"
              aria-label="Buscar lançamentos"
              className="h-10 pl-9"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Select
              aria-label="Filtrar por tipo"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)}
              className="h-10 pr-8 text-xs"
            >
              <option value="todas">Todos os tipos</option>
              <option value="despesa">Despesas</option>
              <option value="receita">Receitas</option>
            </Select>
            <Select
              aria-label="Ordenar por"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as typeof sortBy)}
              className="h-10 pr-8 text-xs"
            >
              <option value="date-desc">Mais recentes</option>
              <option value="date-asc">Mais antigos</option>
              <option value="amount-desc">Maior valor</option>
              <option value="amount-asc">Menor valor</option>
            </Select>
          </div>
        </div>
        <div className="px-4 pt-3 sm:px-0">
          {isLoading ? (
            <PageSpinner />
          ) : (
            <TransactionList
              transactions={filteredTransactions}
              categories={categories}
              accounts={accounts}
              onEdit={openEdit}
              hasActiveFilters={typeFilter !== "todas" || searchQuery.trim().length > 0}
            />
          )}
        </div>
      </Card>

      {pendingBillOccurrences.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Contas fixas neste mês</CardTitle>
          </CardHeader>
          <ul className="flex flex-col divide-y divide-border-light dark:divide-border-dark">
            {pendingBillOccurrences.map(({ bill, date }) => (
              <li key={`${bill.id}-${date.toISOString()}`} className="flex items-center gap-3 py-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-paper-100 text-muted-500 dark:bg-ink-800">
                  <ReceiptText className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink-950 dark:text-paper-50">{bill.name}</p>
                  <p className="truncate text-xs text-muted-500">
                    {date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                  </p>
                </div>
                <Badge tone="muted">Prevista</Badge>
                <span className="tabular shrink-0 text-sm font-semibold text-coral-500">{bill.amount.format()}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-500">
            Vira um lançamento de verdade (com o selo "Fixa") automaticamente quando o vencimento chegar.
          </p>
        </Card>
      )}

      {installments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Parcelas do cartão neste mês</CardTitle>
          </CardHeader>
          <ul className="flex flex-col divide-y divide-border-light dark:divide-border-dark">
            {installments.map((item) => (
              <li key={`${item.purchase.id}-${item.installmentNumber}`} className="flex items-center gap-3 py-2.5">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${item.cardColor}1A`, color: item.cardColor }}
                >
                  <CreditCard className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink-950 dark:text-paper-50">{item.purchase.description}</p>
                  <p className="truncate text-xs text-muted-500">
                    {item.cardName} · Parcela {item.installmentNumber}/{item.installmentsCount}
                  </p>
                </div>
                <span className="tabular shrink-0 text-sm font-semibold text-coral-500">{item.amount.format()}</span>
              </li>
            ))}
          </ul>
          <p className={cn("mt-3 text-xs text-muted-500")}>
            Não entram no saldo das contas — gerencie compras parceladas na página Cartões.
          </p>
        </Card>
      )}

      <TransactionFormDialog open={dialogOpen} onClose={closeDialog} transaction={editingTransaction ?? undefined} />
      <ImportStatementDialog open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}
