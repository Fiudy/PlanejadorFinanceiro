import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog } from "@/shared/ui/dialog";
import { Field, Input } from "@/shared/ui/input";
import { CurrencyInput } from "@/shared/ui/currency-input";
import { Select } from "@/shared/ui/select";
import { Button } from "@/shared/ui/button";
import { BankPicker } from "@/shared/ui/bank-picker";
import { useCreateCard, useUpdateCard } from "../hooks/use-cards";
import type { Card } from "@/domain/entities/card";
import { CARD_BRAND_LABELS } from "@/domain/entities/card";
import { positiveAmountString, parseAmount, dayOfMonthString } from "@/shared/lib/validators";
import { findBank } from "@/shared/lib/banks";

const schema = z.object({ name: z.string().min(1, "Informe o nome do cartão."), holderName: z.string().min(1, "Informe o nome do titular."), logoUrl: z.string().url("Informe uma URL HTTPS válida.").or(z.literal("")), bankId: z.string().min(1), customBank: z.string().optional(), brand: z.enum(["visa", "mastercard", "elo", "amex", "outra"]), color: z.string().min(1), limit: positiveAmountString, closingDay: dayOfMonthString("o dia de fechamento"), dueDay: dayOfMonthString("o dia de vencimento") }).refine((data) => data.bankId !== "outro" || Boolean(data.customBank?.trim()), { path: ["customBank"], message: "Informe o nome do banco." });
type FormData = z.infer<typeof schema>;
const COLORS = ["#0F7B5C", "#0B1220", "#4B7BEC", "#820AD1", "#E5484D", "#E08E45"];

export function CardFormDialog({ open, onClose, card }: { open: boolean; onClose: () => void; card?: Card }) {
  const createCard = useCreateCard(); const updateCard = useUpdateCard();
  const { register, control, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { color: "#820AD1", brand: "visa", bankId: "nubank" } });
  useEffect(() => { if (!open) return; const bank = card ? findBank(card.bank) : findBank("nubank"); reset(card ? { name: card.name, holderName: card.holderName, logoUrl: card.logoUrl, bankId: bank?.id ?? "outro", customBank: bank ? "" : card.bank, brand: card.brand, color: card.color, limit: String(card.limit.reais), closingDay: String(card.closingDay), dueDay: String(card.dueDay) } : { color: bank?.color ?? "#820AD1", brand: "visa", bankId: "nubank", name: "", holderName: "", logoUrl: "", customBank: "", limit: "", closingDay: "", dueDay: "" }); }, [card, open, reset]);
  const color = watch("color"); const bankId = watch("bankId"); const name = watch("name"); const holderName = watch("holderName"); const logoUrl = watch("logoUrl");
  const selectBank = (id: string) => { setValue("bankId", id, { shouldValidate: true }); const bank = findBank(id); if (bank) setValue("color", bank.color); };
  const onSubmit = async (data: FormData) => { const bank = findBank(data.bankId); const input = { name: data.name.trim(), holderName: data.holderName.trim(), logoUrl: data.logoUrl.trim() || undefined, bank: bank?.name ?? data.customBank!.trim(), brand: data.brand, color: data.color, limitCents: Math.round(parseAmount(data.limit) * 100), closingDay: Number(data.closingDay), dueDay: Number(data.dueDay) }; if (card) await updateCard.mutateAsync({ cardId: card.id, ...input }); else await createCard.mutateAsync(input); onClose(); };

  return <Dialog open={open} onClose={onClose} title={card ? "Editar cartão" : "Novo cartão"} className="sm:max-w-3xl"><form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_280px]">
    <div className="flex flex-col gap-4">
    <p className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">Use somente dados de identificação. Nunca informe número completo, validade ou código de segurança.</p>
    <Field label="Banco" htmlFor="bankId"><BankPicker value={bankId} onChange={selectBank} /><input type="hidden" {...register("bankId")} /></Field>
    {bankId === "outro" && <Field label="Nome do banco" htmlFor="customBank"><Input id="customBank" error={errors.customBank?.message} {...register("customBank")} /></Field>}
    <div className="grid grid-cols-2 gap-3"><Field label="Nome do cartão" htmlFor="name"><Input id="name" placeholder="Ex.: Itaú Platinum" error={errors.name?.message} {...register("name")} /></Field><Field label="Nome do titular" htmlFor="holderName"><Input id="holderName" placeholder="Como aparece no cartão" error={errors.holderName?.message} {...register("holderName")} /></Field></div>
    <div className="grid grid-cols-2 gap-3"><Field label="Bandeira" htmlFor="brand"><Select id="brand" {...register("brand")}>{Object.entries(CARD_BRAND_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></Field><Field label="URL da logo (opcional)" htmlFor="logoUrl"><Input id="logoUrl" type="url" placeholder="https://..." error={errors.logoUrl?.message} {...register("logoUrl")} /></Field></div>
    <Field label="Limite total (R$)" htmlFor="limit"><Controller control={control} name="limit" render={({ field }) => <CurrencyInput id="limit" value={field.value} onChange={field.onChange} onBlur={field.onBlur} error={errors.limit?.message} />} /></Field>
    <div className="grid grid-cols-2 gap-3"><Field label="Fechamento" htmlFor="closingDay"><Input id="closingDay" type="number" min={1} max={28} error={errors.closingDay?.message} {...register("closingDay")} /></Field><Field label="Vencimento" htmlFor="dueDay"><Input id="dueDay" type="number" min={1} max={28} error={errors.dueDay?.message} {...register("dueDay")} /></Field></div>
    <div><p className="mb-1.5 text-sm font-medium">Cor</p><div className="flex gap-2">{COLORS.map((item) => <button key={item} type="button" onClick={() => setValue("color", item)} className="h-8 w-8 rounded-full" style={{ backgroundColor: item, outline: color === item ? `2px solid ${item}` : "none", transform: color === item ? "scale(1.1)" : "none" }} aria-label={`Cor ${item}`} />)}</div></div>
    <Button type="submit" size="lg" disabled={isSubmitting} className="w-full justify-center">{isSubmitting ? "Salvando..." : card ? "Salvar alterações" : "Salvar cartão"}</Button></div>
    <aside className="lg:sticky lg:top-0"><p className="mb-2 text-xs font-semibold uppercase tracking-[.12em] text-muted-500">Pré-visualização</p><div className="rounded-2xl p-5 text-white shadow-lg" style={{ backgroundColor: color }}><div className="flex min-h-10 items-center justify-between"><span className="text-xs uppercase text-white/70">{findBank(bankId)?.name ?? "Seu banco"}</span>{logoUrl ? <span className="flex h-9 w-14 items-center justify-center rounded-lg bg-white/90 p-1.5"><img src={logoUrl} alt="Logo" className="h-full w-full object-contain" /></span> : null}</div><p className="mt-6 font-display text-lg font-semibold">{name || "Nome do cartão"}</p><div className="mt-10"><small className="text-[9px] uppercase tracking-widest text-white/60">Titular</small><p className="mt-1 truncate text-xs font-semibold uppercase tracking-wide">{holderName || "Nome do titular"}</p></div></div><p className="mt-3 text-xs leading-relaxed text-muted-500">A cor e a logo ajudam a reconhecer o cartão nos lançamentos e faturas.</p></aside>
  </form></Dialog>;
}
