import { useRef, useState } from "react";
import { Sparkles, Trash2, Upload } from "lucide-react";
import { Dialog } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Field, Input, Label } from "@/shared/ui/input";
import { CurrencyInput } from "@/shared/ui/currency-input";
import { Select } from "@/shared/ui/select";
import { PageSpinner } from "@/shared/ui/spinner";
import { AccountSelect } from "@/features/accounts/components/account-select";
import { CategorySelect } from "@/features/settings/components/category-select";
import { useAccounts } from "@/features/accounts/hooks/use-accounts";
import { useCategories } from "@/features/settings/hooks/use-categories";
import { useCreateTransaction } from "../hooks/use-transactions";
import { Money } from "@/domain/value-objects/money";
import { randomId } from "@/shared/lib/id";
import { statementImportErrorMessage, useParseStatement } from "@/shared/hooks/use-parse-statement";
import type { ParsedStatementItem } from "@/shared/lib/gemini";

interface EditableItem extends ParsedStatementItem {
  id: string;
  categoryId: string;
}

export function ImportStatementDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const parseStatement = useParseStatement();
  const createTransaction = useCreateTransaction();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<EditableItem[] | null>(null);
  const [accountId, setAccountId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

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
      const parsed = await parseStatement.mutateAsync(file);
      if (parsed.length === 0) {
        setError("Não encontramos lançamentos nesse PDF. Verifique se é um extrato ou fatura.");
        return;
      }
      setItems(parsed.map((item) => {
        const suggested = categories.find((category) => category.kind === item.type && item.categoryName && category.name.toLowerCase() === item.categoryName.toLowerCase());
        return { ...item, id: randomId(), categoryId: suggested?.id ?? defaultCategoryFor(item.type)?.id ?? "" };
      }));
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

  const handleImport = async () => {
    if (!items || items.length === 0 || !accountId) return;
    setImporting(true);
    setError(null);
    try {
      for (const item of items) {
        if (!item.categoryId) throw new Error(`Escolha uma categoria para "${item.description}".`);
        const plannedDate = item.date ? new Date(`${item.date}T12:00:00`) : new Date();
        await createTransaction.mutateAsync({
          accountId,
          categoryId: item.categoryId,
          type: item.type,
          amountCents: item.amountCents,
          description: item.description,
          date: plannedDate,
          plannedDate,
          dueDate: item.dueDate ? new Date(`${item.dueDate}T12:00:00`) : plannedDate,
          settledAt: item.status === "pendente" ? undefined : plannedDate,
          status: item.type === "receita" && item.status === "pago" ? "recebido" : item.type === "despesa" && item.status === "recebido" ? "pago" : item.status,
          priority: item.type === "despesa" ? item.priority : undefined,
          notes: item.notes || undefined,
        });
      }
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível importar os lançamentos.");
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} title="Importar extrato em PDF" className="sm:max-w-3xl">
      {!items && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-500">
            Envie o PDF do extrato consolidado da sua conta. Uma IA lê o arquivo e identifica cada lançamento como
            receita ou despesa automaticamente — depois é só revisar e confirmar.
          </p>
          {parseStatement.isPending ? (
            <PageSpinner />
          ) : (
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-[var(--radius-control)] border-2 border-dashed border-border-light px-4 py-8 text-center transition-colors hover:border-accent-500 dark:border-border-dark">
              <Upload className="h-6 w-6 text-muted-500" />
              <span className="text-sm font-medium text-ink-950 dark:text-paper-50">Selecionar PDF do extrato</span>
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
          <Field label="Lançar na conta">
            <AccountSelect accounts={accounts} value={accountId} onChange={setAccountId} />
          </Field>

          <div className="flex flex-col gap-2">
            <Label>{items.length} lançamento(s) encontrado(s)</Label>
            <ul className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto pr-1">
              {items.map((item) => (
                <li key={item.id} className="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm dark:border-border-dark dark:bg-ink-900">
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
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <CategorySelect categories={categories.filter((category) => category.kind === item.type)} kind={item.type} value={item.categoryId} onChange={(value) => updateItem(item.id, { categoryId: value })} />
                    <Select value={item.status} onChange={(event) => updateItem(item.id, { status: event.target.value as EditableItem["status"] })} aria-label="Status">
                      <option value="pendente">Pendente</option>
                      <option value={item.type === "receita" ? "recebido" : "pago"}>{item.type === "receita" ? "Recebido" : "Pago"}</option>
                    </Select>
                    <Input type="date" value={item.dueDate ?? item.date ?? ""} onChange={(event) => updateItem(item.id, { dueDate: event.target.value || null })} aria-label="Vencimento ou recebimento" />
                    {item.type === "despesa" ? <Select value={item.priority} onChange={(event) => updateItem(item.id, { priority: event.target.value as EditableItem["priority"] })} aria-label="Prioridade"><option value="essencial">Essencial</option><option value="importante">Importante</option><option value="flexivel">Flexível</option></Select> : <div className="hidden sm:block" />}
                  </div>
                  <Input value={item.notes} onChange={(event) => updateItem(item.id, { notes: event.target.value })} placeholder="Observações (opcional)" aria-label="Observações" />
                  <div className="flex items-center gap-2">
                    <CurrencyInput
                      value={(item.amountCents / 100).toFixed(2)}
                      onChange={(value) => updateItem(item.id, { amountCents: Math.round((Number(value) || 0) * 100) })}
                      className="w-32"
                      aria-label="Valor"
                    />
                    <Select
                      value={item.type}
                      onChange={(event) => {
                        const nextType = event.target.value as "receita" | "despesa";
                        updateItem(item.id, { type: nextType, categoryId: defaultCategoryFor(nextType)?.id ?? "", status: nextType === "receita" ? "recebido" : "pago" });
                      }}
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
            <Button
              className="flex-1"
              onClick={() => void handleImport()}
              disabled={importing || items.length === 0 || !accountId}
            >
              <Sparkles className="h-4 w-4" />
              {importing ? "Importando..." : `Importar ${items.length} lançamento(s)`}
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
