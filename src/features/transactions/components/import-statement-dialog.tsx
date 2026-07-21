import { useRef, useState } from "react";
import { Sparkles, Trash2, Upload } from "lucide-react";
import { Dialog } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Field, Input, Label } from "@/shared/ui/input";
import { Select } from "@/shared/ui/select";
import { PageSpinner } from "@/shared/ui/spinner";
import { AccountSelect } from "@/features/accounts/components/account-select";
import { useAccounts } from "@/features/accounts/hooks/use-accounts";
import { useCategories } from "@/features/settings/hooks/use-categories";
import { useCreateTransaction } from "../hooks/use-transactions";
import { Money } from "@/domain/value-objects/money";
import { randomId } from "@/shared/lib/id";
import { statementImportErrorMessage, useParseStatement } from "@/shared/hooks/use-parse-statement";
import type { ParsedStatementItem } from "@/shared/lib/gemini";

interface EditableItem extends ParsedStatementItem {
  id: string;
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

  const handleImport = async () => {
    if (!items || items.length === 0 || !accountId) return;
    setImporting(true);
    setError(null);
    try {
      for (const item of items) {
        const category = defaultCategoryFor(item.type);
        if (!category) throw new Error("Nenhuma categoria disponível para atribuir aos lançamentos importados.");
        await createTransaction.mutateAsync({
          accountId,
          categoryId: category.id,
          type: item.type,
          amountCents: item.amountCents,
          description: item.description,
          date: item.date ? new Date(`${item.date}T12:00:00`) : new Date(),
        });
      }
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível importar os lançamentos.");
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} title="Importar extrato em PDF" className="sm:max-w-lg">
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
