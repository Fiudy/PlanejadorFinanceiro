import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog } from "@/shared/ui/dialog";
import { Field, Input } from "@/shared/ui/input";
import { Select } from "@/shared/ui/select";
import { Button } from "@/shared/ui/button";
import { useAccounts } from "@/features/accounts/hooks/use-accounts";
import { useCategories } from "@/features/settings/hooks/use-categories";
import { CategorySelect } from "@/features/settings/components/category-select";
import { useCreateTransaction, useUpdateTransaction } from "../hooks/use-transactions";
import { useCreateRecurringBill } from "@/features/recurring-bills/hooks/use-recurring-bills";
import type { Transaction, TransactionType } from "@/domain/entities/transaction";
import type { RecurrencePeriod } from "@/domain/entities/recurring-bill";
import { RECURRENCE_LABELS, RECURRENCE_MONTHS, RECURRING_BILL_TRANSACTION_SUFFIX } from "@/domain/entities/recurring-bill";
import { positiveAmountString, parseAmount } from "@/shared/lib/validators";
import { addMonths } from "@/shared/lib/date";
import { AccountSelect } from "@/features/accounts/components/account-select";

const schema = z.object({
  type: z.enum(["receita", "despesa"]),
  accountId: z.string().min(1, "Selecione uma conta."),
  categoryId: z.string().min(1, "Selecione uma categoria."),
  amount: positiveAmountString,
  description: z.string().min(1, "Descreva o lançamento."),
  date: z.string().min(1, "Informe a data."),
});

type FormData = z.infer<typeof schema>;

const emptyValues: FormData = {
  type: "despesa",
  accountId: "",
  categoryId: "",
  amount: "",
  description: "",
  date: new Date().toISOString().slice(0, 10),
};

function toFormValues(transaction: Transaction): FormData {
  return {
    type: transaction.type,
    accountId: transaction.accountId,
    categoryId: transaction.categoryId,
    amount: String(transaction.amount.reais),
    description: transaction.description,
    date: transaction.date.toISOString().slice(0, 10),
  };
}

export function TransactionFormDialog({
  open,
  onClose,
  transaction,
}: {
  open: boolean;
  onClose: () => void;
  /** Quando informado, o diálogo edita essa transação em vez de criar uma nova. */
  transaction?: Transaction;
}) {
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const createRecurringBill = useCreateRecurringBill();

  const [isFixed, setIsFixed] = useState(false);
  const [period, setPeriod] = useState<RecurrencePeriod>("mensal");
  const [occurrences, setOccurrences] = useState("");

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: emptyValues });

  useEffect(() => {
    if (!open) return;
    reset(transaction ? toFormValues(transaction) : emptyValues);
    setIsFixed(false);
    setPeriod("mensal");
    setOccurrences("");
  }, [open, transaction, reset]);

  const type = watch("type") as TransactionType;
  const filteredCategories = categories.filter((c) => c.kind === type);

  const onSubmit = async (data: FormData) => {
    const input = {
      accountId: data.accountId,
      categoryId: data.categoryId,
      type: data.type,
      amountCents: Math.round(parseAmount(data.amount) * 100),
      description: data.description,
      date: new Date(data.date),
    };

    if (transaction) {
      await updateTransaction.mutateAsync({ id: transaction.id, ...input });
    } else if (isFixed && data.type === "despesa") {
      const fixedDescription = `${input.description}${RECURRING_BILL_TRANSACTION_SUFFIX}`;
      await createTransaction.mutateAsync({ ...input, description: fixedDescription });

      const occurrencesCount = occurrences.trim() ? Number(occurrences) : undefined;
      const remainingOccurrences =
        occurrencesCount !== undefined && Number.isInteger(occurrencesCount) && occurrencesCount >= 1
          ? occurrencesCount - 1
          : undefined;

      await createRecurringBill.mutateAsync({
        name: input.description,
        categoryId: input.categoryId,
        amountCents: input.amountCents,
        period,
        nextOccurrence: addMonths(input.date, RECURRENCE_MONTHS[period]),
        ...(remainingOccurrences !== undefined ? { remainingOccurrences } : {}),
      });
    } else {
      await createTransaction.mutateAsync(input);
    }

    reset(emptyValues);
    setIsFixed(false);
    setOccurrences("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} title={transaction ? "Editar lançamento" : "Novo lançamento"}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Field label="Tipo" htmlFor="type">
          <Select id="type" {...register("type")}>
            <option value="despesa">Despesa</option>
            <option value="receita">Receita</option>
          </Select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Valor (R$)" htmlFor="amount">
            <Input id="amount" type="number" step="0.01" placeholder="0,00" error={errors.amount?.message} {...register("amount")} />
          </Field>
          <Field label="Data" htmlFor="date">
            <Input id="date" type="date" error={errors.date?.message} {...register("date")} />
          </Field>
        </div>

        <Field label="Descrição" htmlFor="description">
          <Input id="description" placeholder="Ex: Supermercado" error={errors.description?.message} {...register("description")} />
        </Field>

        <Field label="Conta" htmlFor="accountId">
          <Controller control={control} name="accountId" render={({ field }) => <AccountSelect accounts={accounts} value={field.value ?? ""} onChange={field.onChange} onBlur={field.onBlur} />} />
          {errors.accountId && <p className="mt-1 text-xs text-coral-500">{errors.accountId.message}</p>}
        </Field>

        <Field label="Categoria" htmlFor="categoryId">
          <Controller
            control={control}
            name="categoryId"
            render={({ field }) => (
              <CategorySelect
                id="categoryId"
                name={field.name}
                categories={filteredCategories}
                kind={type}
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
          {errors.categoryId && <p className="mt-1 text-xs text-coral-500">{errors.categoryId.message}</p>}
        </Field>

        {!transaction && type === "despesa" && (
          <div className="rounded-[var(--radius-control)] border border-border-light bg-paper-50 p-3 dark:border-border-dark dark:bg-ink-800">
            <label className="flex items-center gap-2 text-sm font-medium text-ink-950 dark:text-paper-50">
              <input
                type="checkbox"
                checked={isFixed}
                onChange={(event) => setIsFixed(event.target.checked)}
                className="h-4 w-4 rounded border-border-light accent-accent-500 dark:border-border-dark"
              />
              É uma despesa fixa?
            </label>
            {isFixed && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Field label="Repete a cada" htmlFor="fixedPeriod">
                  <Select id="fixedPeriod" value={period} onChange={(event) => setPeriod(event.target.value as RecurrencePeriod)}>
                    {Object.entries(RECURRENCE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Quantas vezes" htmlFor="occurrences">
                  <Input
                    id="occurrences"
                    type="number"
                    min={1}
                    placeholder="Sempre"
                    value={occurrences}
                    onChange={(event) => setOccurrences(event.target.value)}
                  />
                </Field>
              </div>
            )}
          </div>
        )}

        <Button type="submit" size="lg" disabled={isSubmitting} className="mt-2 w-full justify-center">
          {isSubmitting ? "Salvando..." : transaction ? "Salvar alterações" : "Salvar lançamento"}
        </Button>
      </form>
    </Dialog>
  );
}
