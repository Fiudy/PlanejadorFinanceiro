import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog } from "@/shared/ui/dialog";
import { Field, Input } from "@/shared/ui/input";
import { CurrencyInput } from "@/shared/ui/currency-input";
import { Select } from "@/shared/ui/select";
import { Button } from "@/shared/ui/button";
import { useCategories } from "@/features/settings/hooks/use-categories";
import { CategorySelect } from "@/features/settings/components/category-select";
import { useCreateRecurringBill } from "../hooks/use-recurring-bills";
import { RECURRENCE_LABELS } from "@/domain/entities/recurring-bill";
import { positiveAmountString, parseAmount } from "@/shared/lib/validators";

const schema = z.object({
  name: z.string().min(1, "Informe o nome da conta."),
  categoryId: z.string().min(1, "Selecione uma categoria."),
  amount: positiveAmountString,
  period: z.enum(["mensal", "bimestral", "trimestral", "semestral", "anual"]),
  nextOccurrence: z.string().min(1, "Informe a próxima data."),
  occurrences: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function RecurringBillFormDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: categories = [] } = useCategories("despesa");
  const createBill = useCreateRecurringBill();
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { period: "mensal", nextOccurrence: new Date().toISOString().slice(0, 10), occurrences: "" },
  });

  const onSubmit = async (data: FormData) => {
    const occurrencesCount = data.occurrences?.trim() ? Number(data.occurrences) : undefined;
    const remainingOccurrences =
      occurrencesCount !== undefined && Number.isInteger(occurrencesCount) && occurrencesCount >= 1
        ? occurrencesCount
        : undefined;

    await createBill.mutateAsync({
      name: data.name,
      categoryId: data.categoryId,
      amountCents: Math.round(parseAmount(data.amount) * 100),
      period: data.period,
      nextOccurrence: new Date(data.nextOccurrence),
      ...(remainingOccurrences !== undefined ? { remainingOccurrences } : {}),
    });
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} title="Nova conta fixa">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Field label="Nome" htmlFor="name">
          <Input id="name" placeholder="Ex: Aluguel" error={errors.name?.message} {...register("name")} />
        </Field>

        <Field label="Categoria" htmlFor="categoryId">
          <Controller
            control={control}
            name="categoryId"
            render={({ field }) => (
              <CategorySelect
                id="categoryId"
                name={field.name}
                categories={categories}
                kind="despesa"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
          {errors.categoryId && <p className="mt-1 text-xs text-coral-500">{errors.categoryId.message}</p>}
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Valor (R$)" htmlFor="amount">
            <Controller control={control} name="amount" render={({ field }) => <CurrencyInput id="amount" value={field.value} onChange={field.onChange} onBlur={field.onBlur} error={errors.amount?.message} />} />
          </Field>
          <Field label="Recorrência" htmlFor="period">
            <Select id="period" {...register("period")}>
              {Object.entries(RECURRENCE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Próximo vencimento" htmlFor="nextOccurrence">
            <Input id="nextOccurrence" type="date" error={errors.nextOccurrence?.message} {...register("nextOccurrence")} />
          </Field>
          <Field label="Quantas vezes" htmlFor="occurrences">
            <Input id="occurrences" type="number" min={1} placeholder="Sempre" {...register("occurrences")} />
          </Field>
        </div>
        <p className="-mt-2 text-xs text-muted-500">Deixe "Quantas vezes" em branco para repetir todo mês, sem data para parar.</p>

        <Button type="submit" size="lg" disabled={isSubmitting} className="mt-2 w-full justify-center">
          {isSubmitting ? "Salvando..." : "Salvar conta fixa"}
        </Button>
      </form>
    </Dialog>
  );
}
