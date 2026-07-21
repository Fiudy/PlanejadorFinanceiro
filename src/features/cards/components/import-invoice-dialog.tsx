import { useEffect, useRef, useState } from "react";
import { Sparkles, Trash2, Upload } from "lucide-react";
import { Dialog } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Field, Input, Label } from "@/shared/ui/input";
import { Select } from "@/shared/ui/select";
import { PageSpinner } from "@/shared/ui/spinner";
import { AccountSelect } from "@/features/accounts/components/account-select";
import { useAccounts } from "@/features/accounts/hooks/use-accounts";
import { useCategories } from "@/features/settings/hooks/use-categories";
import { useCreateTransaction } from "@/features/transactions/hooks/use-transactions";
import { useAddCardPurchase } from "../hooks/use-cards";
import { Money } from "@/domain/value-objects/money";
import { randomId } from "@/shared/lib/id";
import { statementImportErrorMessage, useParseStatement } from "@/shared/hooks/use-parse-statement";
import type { ParsedStatementItem } from "@/shared/lib/gemini";
import type { Card as CardEntity } from "@/domain/entities/card";

interface EditableItem extends ParsedStatementItem {
  id: string;
}

export function ImportInvoiceDialog({
  open,
  onClose,
  cards,
  defaultCardId,
}: {
  open: boolean;
  onClose: () => void;
  /** Cartões ativos disponíveis — quando há mais de um, o usuário escolhe a qual a fatura pertence. */
  cards: CardEntity[];
  defaultCardId: string;
}) {
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const parseInvoice = useParseStatement();
  const addCardPurchase = useAddCardPurchase();
  const createTransaction = useCreateTransaction();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<EditableItem[] | null>(null);
  const [cardId, setCardId] = useState(defaultCardId);
  const [accountId, setAccountId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza com o cartão selecionado na página ao abrir o diálogo, não é estado derivável em render
      setCardId(defaultCardId);
    }
  }, [open, defaultCardId]);

  const reset = () => {
    setItems(null);
    setError(null);
    setImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const parsed = await parseInvoice.mutateAsync(file);
      if (parsed.length === 0) {
        setError("Não encontramos lançamentos nesse PDF. Verifique se é uma fatura de cartão.");
        return;
      }
      setItems(parsed.map((item) => ({ ...item, id: randomId() })));
    } catch (err) {
      setError(statementImportErrorMessage(err));
    }
  };

  const updateItem = (id: string, patch: Partial<EditableItem>) => {
    setItems((current) => current?.map((item) => (item.id === id ? { ...item, ...patch } : item)) ?? null);
  };

  const removeItem = (id: string) => {
    setItems((current) => current?.filter((item) => item.id !== id) ?? null);
  };

  const defaultCategoryFor = (type: "receita" | "despesa") => {
    if (type === "receita") {
      return categories.find((c) => c.kind === "receita" && c.name === "Outras receitas") ?? categories.find((c) => c.kind === "receita");
    }
    return categories.find((c) => c.kind === "despesa" && c.name === "Outros") ?? categories.find((c) => c.kind === "despesa");
  };

  const hasReceitaItems = items?.some((item) => item.type === "receita") ?? false;

  const handleImport = async () => {
    if (!items || items.length === 0 || !cardId) return;
    if (hasReceitaItems && !accountId) return;
    setImporting(true);
    setError(null);
    try {
      for (const item of items) {
        const category = defaultCategoryFor(item.type);
        if (!category) throw new Error("Nenhuma categoria disponível para atribuir aos lançamentos importados.");
        const date = item.date ? new Date(`${item.date}T12:00:00`) : new Date();

        if (item.type === "despesa") {
          await addCardPurchase.mutateAsync({
            cardId,
            categoryId: category.id,
            description: item.description,
            totalAmountCents: item.amountCents,
            installmentsCount: 1,
            firstInstallmentDate: date,
          });
        } else {
          await createTransaction.mutateAsync({
            accountId,
            categoryId: category.id,
            type: "receita",
            amountCents: item.amountCents,
            description: item.description,
            date,
          });
        }
      }
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível importar os lançamentos.");
      setImporting(false);
    }
  };

  const canImport = items !== null && items.length > 0 && Boolean(cardId) && (!hasReceitaItems || Boolean(accountId));

  return (
    <Dialog open={open} onClose={handleClose} title="Importar fatura em PDF" className="sm:max-w-lg">
      {!items && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-500">
            Envie o PDF da fatura do cartão. Uma IA lê o arquivo e identifica cada lançamento como receita ou
            despesa automaticamente — depois é só revisar e confirmar.
          </p>
          {parseInvoice.isPending ? (
            <PageSpinner />
          ) : (
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-[var(--radius-control)] border-2 border-dashed border-border-light px-4 py-8 text-center transition-colors hover:border-accent-500 dark:border-border-dark">
              <Upload className="h-6 w-6 text-muted-500" />
              <span className="text-sm font-medium text-ink-950 dark:text-paper-50">Selecionar PDF da fatura</span>
              <span className="text-xs text-muted-500">Apenas arquivos .pdf</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(event) => void handleFileChange(event)}
              />
            </label>
          )}
          {error && <p className="text-sm text-coral-500">{error}</p>}
        </div>
      )}

      {items && (
        <div className="flex flex-col gap-4">
          {cards.length > 1 && (
            <Field label="Cartão" htmlFor="importCardId">
              <Select id="importCardId" value={cardId} onChange={(event) => setCardId(event.target.value)}>
                {cards.map((card) => (
                  <option key={card.id} value={card.id}>
                    {card.name} · {card.bank}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          {hasReceitaItems && (
            <Field label="Lançar receitas na conta">
              <AccountSelect accounts={accounts} value={accountId} onChange={setAccountId} />
            </Field>
          )}

          <div className="flex flex-col gap-2">
            <Label>{items.length} lançamento(s) encontrado(s)</Label>
            <ul className="flex max-h-80 flex-col gap-2 overflow-y-auto">
              {items.map((item) => (
                <li key={item.id} className="flex flex-col gap-2 rounded-[var(--radius-control)] border border-border-light p-3 dark:border-border-dark">
                  <div className="flex items-center gap-2">
                    <Input
                      value={item.description}
                      onChange={(event) => updateItem(item.id, { description: event.target.value })}
                      className="flex-1"
                      aria-label="Descrição"
                    />
                    <Button variant="ghost" size="icon" aria-label="Remover lançamento" onClick={() => removeItem(item.id)}>
                      <Trash2 className="h-4 w-4 text-coral-500" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={(item.amountCents / 100).toFixed(2)}
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        if (Number.isFinite(value)) updateItem(item.id, { amountCents: Math.round(value * 100) });
                      }}
                      className="w-28"
                      aria-label="Valor"
                    />
                    <Select
                      value={item.type}
                      onChange={(event) => updateItem(item.id, { type: event.target.value as "receita" | "despesa" })}
                      className="h-11 flex-1"
                      aria-label="Tipo"
                    >
                      <option value="despesa">Despesa</option>
                      <option value="receita">Receita</option>
                    </Select>
                    <span className="tabular shrink-0 text-xs text-muted-500">
                      {Money.fromCents(item.amountCents).format()}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {error && <p className="text-sm text-coral-500">{error}</p>}

          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={reset} disabled={importing}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={() => void handleImport()} disabled={importing || !canImport}>
              <Sparkles className="h-4 w-4" />
              {importing ? "Importando..." : `Importar ${items.length} lançamento(s)`}
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
