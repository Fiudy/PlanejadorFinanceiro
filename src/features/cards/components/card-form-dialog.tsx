import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog } from "@/shared/ui/dialog";
import { Field, Input } from "@/shared/ui/input";
import { Select } from "@/shared/ui/select";
import { Button } from "@/shared/ui/button";
import { BankPicker } from "@/shared/ui/bank-picker";
import { useCreateCard, useUpdateCard } from "../hooks/use-cards";
import type { Card } from "@/domain/entities/card";
import { CARD_BRAND_LABELS } from "@/domain/entities/card";
import { positiveAmountString, parseAmount, dayOfMonthString } from "@/shared/lib/validators";
import { findBank } from "@/shared/lib/banks";

const schema = z.object({ name: z.string().min(1, "Informe o nome do cartão."), bankId: z.string().min(1), customBank: z.string().optional(), brand: z.enum(["visa", "mastercard", "elo", "amex", "outra"]), color: z.string().min(1), limit: positiveAmountString, closingDay: dayOfMonthString("o dia de fechamento"), dueDay: dayOfMonthString("o dia de vencimento") }).refine((data) => data.bankId !== "outro" || Boolean(data.customBank?.trim()), { path: ["customBank"], message: "Informe o nome do banco." });
type FormData = z.infer<typeof schema>;
const COLORS = ["#0F7B5C", "#0B1220", "#4B7BEC", "#820AD1", "#E5484D", "#E08E45"];

export function CardFormDialog({ open, onClose, card }: { open: boolean; onClose: () => void; card?: Card }) {
  const createCard = useCreateCard(); const updateCard = useUpdateCard();
  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { color: "#820AD1", brand: "visa", bankId: "nubank" } });
  useEffect(() => { if (!open) return; const bank = card ? findBank(card.bank) : findBank("nubank"); reset(card ? { name: card.name, bankId: bank?.id ?? "outro", customBank: bank ? "" : card.bank, brand: card.brand, color: card.color, limit: String(card.limit.reais), closingDay: String(card.closingDay), dueDay: String(card.dueDay) } : { color: bank?.color ?? "#820AD1", brand: "visa", bankId: "nubank", name: "", customBank: "", limit: "", closingDay: "", dueDay: "" }); }, [card, open, reset]);
  const color = watch("color"); const bankId = watch("bankId");
  const selectBank = (id: string) => { setValue("bankId", id, { shouldValidate: true }); const bank = findBank(id); if (bank) setValue("color", bank.color); };
  const onSubmit = async (data: FormData) => { const bank = findBank(data.bankId); const input = { name: data.name, bank: bank?.name ?? data.customBank!.trim(), brand: data.brand, color: data.color, limitCents: Math.round(parseAmount(data.limit) * 100), closingDay: Number(data.closingDay), dueDay: Number(data.dueDay) }; if (card) await updateCard.mutateAsync({ cardId: card.id, ...input }); else await createCard.mutateAsync(input); onClose(); };

  return <Dialog open={open} onClose={onClose} title={card ? "Editar cartão" : "Novo cartão"}><form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
    <Field label="Banco" htmlFor="bankId"><BankPicker value={bankId} onChange={selectBank} /><input type="hidden" {...register("bankId")} /></Field>
    {bankId === "outro" && <Field label="Nome do banco" htmlFor="customBank"><Input id="customBank" error={errors.customBank?.message} {...register("customBank")} /></Field>}
    <div className="grid grid-cols-2 gap-3"><Field label="Nome do cartão" htmlFor="name"><Input id="name" error={errors.name?.message} {...register("name")} /></Field><Field label="Bandeira" htmlFor="brand"><Select id="brand" {...register("brand")}>{Object.entries(CARD_BRAND_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></Field></div>
    <Field label="Limite total (R$)" htmlFor="limit"><Input id="limit" type="number" step="0.01" error={errors.limit?.message} {...register("limit")} /></Field>
    <div className="grid grid-cols-2 gap-3"><Field label="Fechamento" htmlFor="closingDay"><Input id="closingDay" type="number" min={1} max={28} error={errors.closingDay?.message} {...register("closingDay")} /></Field><Field label="Vencimento" htmlFor="dueDay"><Input id="dueDay" type="number" min={1} max={28} error={errors.dueDay?.message} {...register("dueDay")} /></Field></div>
    <div><p className="mb-1.5 text-sm font-medium">Cor</p><div className="flex gap-2">{COLORS.map((item) => <button key={item} type="button" onClick={() => setValue("color", item)} className="h-8 w-8 rounded-full" style={{ backgroundColor: item, outline: color === item ? `2px solid ${item}` : "none", transform: color === item ? "scale(1.1)" : "none" }} aria-label={`Cor ${item}`} />)}</div></div>
    <Button type="submit" size="lg" disabled={isSubmitting} className="w-full justify-center">{isSubmitting ? "Salvando..." : card ? "Salvar alterações" : "Salvar cartão"}</Button>
  </form></Dialog>;
}
