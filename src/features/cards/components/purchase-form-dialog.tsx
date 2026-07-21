import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog } from "@/shared/ui/dialog";
import { Field, Input } from "@/shared/ui/input";
import { Select } from "@/shared/ui/select";
import { Button } from "@/shared/ui/button";
import { useCategories } from "@/features/settings/hooks/use-categories";
import { CategorySelect } from "@/features/settings/components/category-select";
import { useAddCardPurchase } from "../hooks/use-cards";
import { positiveAmountString, parseAmount } from "@/shared/lib/validators";
import type { Card as CardEntity } from "@/domain/entities/card";

const schema = z.object({
  cardId: z.string().min(1, "Selecione um cartão."),
  description: z.string().min(1, "Descreva a compra."),
  categoryId: z.string().min(1, "Selecione uma categoria."),
  amount: positiveAmountString,
  installments: z
    .string()
    .min(1, "Informe a quantidade de parcelas.")
    .refine((value) => Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 48, "Deve ser entre 1 e 48."),
  firstInstallmentDate: z.string().min(1),
});

type FormData = z.infer<typeof schema>;

export function PurchaseFormDialog({
  open,
  onClose,
  cards,
  defaultCardId,
}: {
  open: boolean;
  onClose: () => void;
  /** Cartões ativos disponíveis — quando há mais de um, o usuário escolhe qual usar. */
  cards: CardEntity[];
  defaultCardId: string;
}) {
  const { data: categories = [] } = useCategories("despesa");
  const addPurchase = useAddCardPurchase();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { cardId: defaultCardId, installments: "1", firstInstallmentDate: new Date().toISOString().slice(0, 10) },
  });

  useEffect(() => {
    if (open) reset({ cardId: defaultCardId, installments: "1", firstInstallmentDate: new Date().toISOString().slice(0, 10) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultCardId]);

  const onSubmit = async (data: FormData) => {
    await addPurchase.mutateAsync({
      cardId: data.cardId,
      categoryId: data.categoryId,
      description: data.description,
      totalAmountCents: Math.round(parseAmount(data.amount) * 100),
      installmentsCount: Number(data.installments),
      firstInstallmentDate: new Date(data.firstInstallmentDate),
    });
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} title="Nova compra no cartão">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {cards.length > 1 && (
          <Field label="Cartão" htmlFor="cardId">
            <Select id="cardId" {...register("cardId")}>
              {cards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.name} · {card.bank}
                </option>
              ))}
            </Select>
            {errors.cardId && <p className="mt-1 text-xs text-coral-500">{errors.cardId.message}</p>}
          </Field>
        )}

        <Field label="Descrição" htmlFor="description">
          <Input id="description" placeholder="Ex: Notebook novo" error={errors.description?.message} {...register("description")} />
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
          <Field label="Valor total (R$)" htmlFor="amount">
            <Input id="amount" type="number" step="0.01" error={errors.amount?.message} {...register("amount")} />
          </Field>
          <Field label="Parcelas" htmlFor="installments">
            <Input id="installments" type="number" min={1} max={48} error={errors.installments?.message} {...register("installments")} />
          </Field>
        </div>

        <Field label="Data da 1ª parcela" htmlFor="firstInstallmentDate">
          <Input id="firstInstallmentDate" type="date" error={errors.firstInstallmentDate?.message} {...register("firstInstallmentDate")} />
        </Field>

        <Button type="submit" size="lg" disabled={isSubmitting} className="mt-2 w-full justify-center">
          {isSubmitting ? "Salvando..." : "Adicionar compra"}
        </Button>
      </form>
    </Dialog>
  );
}
