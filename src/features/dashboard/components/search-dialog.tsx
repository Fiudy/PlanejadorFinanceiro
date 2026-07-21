import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Search, X, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useTransactions } from "@/features/transactions/hooks/use-transactions";
import { useCategories } from "@/features/settings/hooks/use-categories";
import { formatDate } from "@/shared/lib/date";

/** Busca simples por descrição/categoria nos lançamentos do usuário. */
export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { data: transactions = [] } = useTransactions();
  const { data: categories = [] } = useCategories();

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return transactions
      .filter((t) => t.description.toLowerCase().includes(q) || categoryById.get(t.categoryId)?.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, transactions, categoryById]);

  const handleClose = () => {
    setQuery("");
    onClose();
  };

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-24 sm:pt-32" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm" onClick={handleClose} aria-hidden="true" />
      <div className="glass relative z-10 w-full max-w-lg overflow-hidden rounded-2xl shadow-xl">
        <div className="flex items-center gap-2.5 border-b border-border-light px-4 py-3.5 dark:border-white/10">
          <Search className="h-4 w-4 shrink-0 text-muted-500 dark:text-muted-300" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por descrição ou categoria..."
            aria-label="Buscar lançamentos"
            className="min-w-0 flex-1 bg-transparent text-sm text-ink-950 outline-none placeholder:text-muted-500 dark:text-white dark:placeholder:text-muted-300"
          />
          <button onClick={handleClose} aria-label="Fechar busca" className="shrink-0 text-muted-500 hover:text-ink-950 dark:text-muted-300 dark:hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {query && results.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-500 dark:text-muted-300">Nenhum lançamento encontrado.</p>
          )}
          {!query && (
            <p className="py-8 text-center text-sm text-muted-500 dark:text-muted-300">Digite para buscar nos seus lançamentos.</p>
          )}
          {results.map((transaction) => {
            const isIncome = transaction.type === "receita";
            const category = categoryById.get(transaction.categoryId);
            return (
              <button
                key={transaction.id}
                onClick={() => {
                  handleClose();
                  navigate("/transacoes");
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-paper-100 dark:hover:bg-white/5"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper-100 text-muted-500 dark:bg-white/10 dark:text-muted-300">
                  {isIncome ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink-950 dark:text-white">{transaction.description}</span>
                  <span className="block text-xs text-muted-500 dark:text-muted-300">
                    {category?.name ?? "Sem categoria"} · {formatDate(transaction.date)}
                  </span>
                </span>
                <span className={`tabular shrink-0 text-sm font-semibold ${isIncome ? "text-accent-500" : "text-coral-500"}`}>
                  {transaction.amount.format()}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body,
  );
}
