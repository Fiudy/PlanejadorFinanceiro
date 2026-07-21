import { useState } from "react";
import { Trash2, Pencil, ArrowUpRight, ArrowDownRight, Repeat } from "lucide-react";
import type { Transaction } from "@/domain/entities/transaction";
import type { Category } from "@/domain/entities/category";
import type { Account } from "@/domain/entities/account";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { EmptyState } from "@/shared/ui/empty-state";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { formatDate } from "@/shared/lib/date";
import { RECURRING_BILL_TRANSACTION_SUFFIX } from "@/domain/entities/recurring-bill";
import { useRemoveTransaction } from "../hooks/use-transactions";
import { ArrowLeftRight } from "lucide-react";

export function TransactionList({
  transactions,
  categories,
  accounts,
  onEdit,
  hasActiveFilters = false,
}: {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  onEdit: (transaction: Transaction) => void;
  /** Quando true, indica que a lista vazia é resultado de busca/filtro, não do mês em si. */
  hasActiveFilters?: boolean;
}) {
  const removeTransaction = useRemoveTransaction();
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null);
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const accountById = new Map(accounts.map((a) => [a.id, a]));

  if (transactions.length === 0) {
    return hasActiveFilters ? (
      <EmptyState
        icon={ArrowLeftRight}
        title="Nenhum resultado"
        description="Nenhum lançamento corresponde à busca ou ao filtro aplicado."
      />
    ) : (
      <EmptyState
        icon={ArrowLeftRight}
        title="Nenhum lançamento neste mês"
        description="Cadastre uma receita ou despesa, ou navegue para outro mês."
      />
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-border-light dark:divide-border-dark">
      {transactions.map((transaction) => {
        const category = categoryById.get(transaction.categoryId);
        const account = accountById.get(transaction.accountId);
        const isIncome = transaction.type === "receita";
        const isFixed = transaction.description.endsWith(RECURRING_BILL_TRANSACTION_SUFFIX);

        return (
          <li key={transaction.id} className="flex items-center gap-3 py-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: `${category?.color ?? "#64748B"}1A`, color: category?.color ?? "#64748B" }}
            >
              {isIncome ? <ArrowUpRight className="h-4.5 w-4.5" /> : <ArrowDownRight className="h-4.5 w-4.5" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 truncate text-sm font-medium text-ink-950 dark:text-paper-50">
                <span className="truncate">{transaction.description}</span>
                {isFixed && (
                  <Badge tone="muted" className="shrink-0 gap-1 py-0">
                    <Repeat className="h-2.5 w-2.5" />
                    Fixa
                  </Badge>
                )}
              </p>
              <p className="truncate text-xs text-muted-500">
                {category?.name ?? "Sem categoria"} · {account?.name ?? "Conta removida"} · {formatDate(transaction.date)}
              </p>
            </div>
            <span className={`tabular shrink-0 text-sm font-semibold ${isIncome ? "text-accent-500" : "text-coral-500"}`}>
              {isIncome ? "+" : "-"} {transaction.amount.format()}
            </span>
            <div className="flex shrink-0 items-center">
              <Button variant="ghost" size="icon" aria-label="Editar lançamento" onClick={() => onEdit(transaction)}>
                <Pencil className="h-4 w-4 text-muted-500" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Remover lançamento"
                onClick={() => setPendingDelete(transaction)}
              >
                <Trash2 className="h-4 w-4 text-muted-500" />
              </Button>
            </div>
          </li>
        );
      })}

      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return;
          removeTransaction.mutate(pendingDelete.id, { onSuccess: () => setPendingDelete(null) });
        }}
        title="Remover lançamento"
        description={`Tem certeza que deseja remover "${pendingDelete?.description ?? ""}"? Essa ação não pode ser desfeita.`}
        confirmLabel="Remover"
        isLoading={removeTransaction.isPending}
      />
    </ul>
  );
}
