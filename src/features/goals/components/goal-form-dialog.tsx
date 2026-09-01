import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog } from "@/shared/ui/dialog";
import { Field, Input } from "@/shared/ui/input";
import { CurrencyInput } from "@/shared/ui/currency-input";
import { Select } from "@/shared/ui/select";
import { Button } from "@/shared/ui/button";
import { useCreateGoal } from "../hooks/use-goals";
import { GOAL_KIND_LABELS } from "@/domain/entities/goal";
import { positiveAmountString, parseAmount } from "@/shared/lib/validators";
import { pickRandomColor } from "@/shared/lib/random";

const schema = z.object({
  name: z.string().min(1, "Informe o nome da meta."),
  kind: z.enum(["reserva", "viagem", "carro", "casa", "investimento", "outro"]),
  targetAmount: positiveAmountString,
  targetDate: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const GOAL_COLORS = ["#0F7B5C", "#4B7BEC", "#9B6BD1", "#E08E45", "#D33A6E"];

export function GoalFormDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createGoal = useCreateGoal();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { kind: "reserva" } });

  const onSubmit = async (data: FormData) => {
    await createGoal.mutateAsync({
      name: data.name,
      kind: data.kind,
      color: pickRandomColor(GOAL_COLORS),
      icon: "piggy-bank",
      targetAmountCents: Math.round(parseAmount(data.targetAmount) * 100),
      targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} title="Nova meta">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Field label="Nome da meta" htmlFor="name">
          <Input id="name" placeholder="Ex: Viagem para o Chile" error={errors.name?.message} {...register("name")} />
        </Field>

        <Field label="Tipo" htmlFor="kind">
          <Select id="kind" {...register("kind")}>
            {Object.entries(GOAL_KIND_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Valor alvo (R$)" htmlFor="targetAmount">
          <Controller control={control} name="targetAmount" render={({ field }) => <CurrencyInput id="targetAmount" value={field.value} onChange={field.onChange} onBlur={field.onBlur} error={errors.targetAmount?.message} />} />
        </Field>

        <Field label="Data alvo (opcional)" htmlFor="targetDate">
          <Input id="targetDate" type="date" {...register("targetDate")} />
        </Field>

        <Button type="submit" size="lg" disabled={isSubmitting} className="mt-2 w-full justify-center">
          {isSubmitting ? "Salvando..." : "Criar meta"}
        </Button>
      </form>
    </Dialog>
  );
}
