import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog } from "@/shared/ui/dialog";
import { CurrencyInput } from "@/shared/ui/currency-input";
import { useAccounts } from "@/features/accounts/hooks/use-accounts";
import { useCategories } from "@/features/settings/hooks/use-categories";
import { useCards } from "@/features/cards/hooks/use-cards";
import { useCreateTransaction, useUpdateTransaction } from "../hooks/use-transactions";
import { useCreateRecurringBill } from "@/features/recurring-bills/hooks/use-recurring-bills";
import type { Transaction, TransactionPriority, TransactionStatus, TransactionType } from "@/domain/entities/transaction";
import type { RecurrencePeriod } from "@/domain/entities/recurring-bill";
import { RECURRENCE_LABELS, RECURRENCE_MONTHS, RECURRING_BILL_TRANSACTION_SUFFIX } from "@/domain/entities/recurring-bill";
import { positiveAmountString, parseAmount } from "@/shared/lib/validators";
import { addMonths } from "@/shared/lib/date";

const schema = z.object({
  type: z.enum(["receita", "despesa"]), accountId: z.string().min(1, "Selecione uma conta."), categoryId: z.string().min(1, "Selecione uma categoria."),
  amount: positiveAmountString, description: z.string().min(1, "Descreva o lançamento."), dueDate: z.string().min(1, "Informe o vencimento."),
  plannedDate: z.string().min(1, "Informe a data planejada."), status: z.enum(["pendente", "pago", "recebido"]), settledAt: z.string(),
  priority: z.enum(["essencial", "importante", "flexivel"]), cardId: z.string(), notes: z.string().max(500),
});
type FormData = z.infer<typeof schema>;
const today = () => new Date().toISOString().slice(0, 10);
const emptyValues = (): FormData => ({ type: "despesa", accountId: "", categoryId: "", amount: "", description: "", dueDate: today(), plannedDate: today(), status: "pendente", settledAt: "", priority: "importante", cardId: "", notes: "" });
const parseDate = (value: string) => new Date(`${value}T12:00:00`);
const inputDate = (value?: Date) => value?.toISOString().slice(0, 10) ?? "";

function toFormValues(transaction: Transaction): FormData {
  return { type: transaction.type, accountId: transaction.accountId, categoryId: transaction.categoryId, amount: String(transaction.amount.reais), description: transaction.description, dueDate: inputDate(transaction.dueDate), plannedDate: inputDate(transaction.plannedDate), status: transaction.status, settledAt: inputDate(transaction.settledAt), priority: transaction.priority ?? "importante", cardId: transaction.cardId ?? "", notes: transaction.notes };
}

export function TransactionFormDialog({ open, onClose, transaction }: { open: boolean; onClose: () => void; transaction?: Transaction }) {
  const { data: accounts = [] } = useAccounts(); const { data: categories = [] } = useCategories(); const { data: cards = [] } = useCards();
  const createTransaction = useCreateTransaction(); const updateTransaction = useUpdateTransaction(); const createRecurringBill = useCreateRecurringBill();
  const [isFixed, setIsFixed] = useState(false); const [period, setPeriod] = useState<RecurrencePeriod>("mensal"); const [occurrences, setOccurrences] = useState("");
  const { register, control, handleSubmit, watch, reset, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: emptyValues() });
  useEffect(() => { if (!open) return; reset(transaction ? toFormValues(transaction) : emptyValues()); setIsFixed(false); setPeriod("mensal"); setOccurrences(""); }, [open, transaction, reset]);
  const type = watch("type") as TransactionType; const status = watch("status") as TransactionStatus;
  const filteredCategories = categories.filter((category) => category.kind === type);
  useEffect(() => { if (type === "receita" && status === "pago") setValue("status", "recebido"); if (type === "despesa" && status === "recebido") setValue("status", "pago"); }, [type, status, setValue]);

  const onSubmit = async (data: FormData) => {
    const plannedDate = parseDate(data.plannedDate);
    const input = { accountId: data.accountId, categoryId: data.categoryId, type: data.type, amountCents: Math.round(parseAmount(data.amount) * 100), description: data.description.trim(), date: plannedDate, dueDate: parseDate(data.dueDate), plannedDate, settledAt: data.status !== "pendente" && data.settledAt ? parseDate(data.settledAt) : undefined, status: data.status as TransactionStatus, priority: data.type === "despesa" ? data.priority as TransactionPriority : undefined, cardId: data.cardId || undefined, notes: data.notes.trim() || undefined };
    if (transaction) await updateTransaction.mutateAsync({ id: transaction.id, ...input });
    else if (isFixed && data.type === "despesa") { const fixedDescription = `${input.description}${RECURRING_BILL_TRANSACTION_SUFFIX}`; await createTransaction.mutateAsync({ ...input, description: fixedDescription }); const count = occurrences.trim() ? Number(occurrences) : undefined; const remainingOccurrences = count !== undefined && Number.isInteger(count) && count >= 1 ? count - 1 : undefined; await createRecurringBill.mutateAsync({ name: input.description, categoryId: input.categoryId, amountCents: input.amountCents, period, nextOccurrence: addMonths(plannedDate, RECURRENCE_MONTHS[period]), ...(remainingOccurrences !== undefined ? { remainingOccurrences } : {}) }); }
    else await createTransaction.mutateAsync(input);
    reset(emptyValues()); onClose();
  };

  return <Dialog open={open} onClose={onClose} title={transaction ? "Editar lançamento" : "Novo lançamento"}>
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="oc-type-toggle"><label><input type="radio" value="despesa" {...register("type")}/> Débito</label><label><input type="radio" value="receita" {...register("type")}/> Entrada</label></div>
      <div className="oc-form-grid">
        <label className="oc-field">Descrição<input placeholder="Ex.: Conta de energia" maxLength={120} {...register("description")}/>{errors.description && <small className="text-coral-500">{errors.description.message}</small>}</label>
        <label className="oc-field">Valor<Controller control={control} name="amount" render={({field})=><CurrencyInput value={field.value} onChange={field.onChange} onBlur={field.onBlur}/>}/>{errors.amount && <small className="text-coral-500">{errors.amount.message}</small>}</label>
        <label className="oc-field">Conta<Controller control={control} name="accountId" render={({field})=><select {...field}><option value="">Selecione uma conta</option>{accounts.filter((item)=>!item.archived).map((item)=><option key={item.id} value={item.id}>{item.name}</option>)}</select>}/>{errors.accountId && <small className="text-coral-500">{errors.accountId.message}</small>}</label>
        <label className="oc-field">Categoria<Controller control={control} name="categoryId" render={({field})=><select {...field}><option value="">Selecione uma categoria</option>{filteredCategories.map((item)=><option key={item.id} value={item.id}>{item.name}</option>)}</select>}/>{errors.categoryId && <small className="text-coral-500">{errors.categoryId.message}</small>}</label>
        <label className="oc-field">{type === "receita" ? "Data de recebimento" : "Data de vencimento"}<input type="date" {...register("dueDate")}/></label>
        <label className="oc-field">{type === "receita" ? "Data que deseja receber" : "Data que deseja pagar"}<input type="date" {...register("plannedDate")}/></label>
        {type === "despesa" && <label className="oc-field">Prioridade no planejamento<select {...register("priority")}><option value="essencial">Essencial</option><option value="importante">Importante</option><option value="flexivel">Flexível</option></select><small className="font-normal text-[var(--oc-muted)]">Usada quando o dinheiro não cobre todas as contas.</small></label>}
        <label className="oc-field">Cartão relacionado<select {...register("cardId")}><option value="">Nenhum cartão</option>{cards.filter((card)=>!card.archived).map((card)=><option key={card.id} value={card.id}>{card.name}</option>)}</select></label>
        <label className="oc-field">Status<select {...register("status")}><option value="pendente">Pendente</option><option value={type === "receita" ? "recebido":"pago"}>{type === "receita" ? "Recebido":"Pago"}</option></select></label>
        <label className="oc-field">Data real do pagamento/recebimento<input type="date" disabled={status === "pendente"} {...register("settledAt")}/></label>
        {!transaction && type === "despesa" && <section className="oc-recurrence oc-full"><label className="oc-recurrence-toggle"><input type="checkbox" checked={isFixed} onChange={(event)=>setIsFixed(event.target.checked)}/><span><b>Repetir esta despesa</b><small>Crie os próximos meses de uma só vez.</small></span></label>{isFixed && <div className="oc-form-grid"><label className="oc-field">Tipo de repetição<select value={period} onChange={(event)=>setPeriod(event.target.value as RecurrencePeriod)}>{Object.entries(RECURRENCE_LABELS).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><label className="oc-field">Total de ocorrências<input type="number" min={1} placeholder="Sempre" value={occurrences} onChange={(event)=>setOccurrences(event.target.value)}/></label></div>}</section>}
        <label className="oc-field oc-full">Observações<textarea maxLength={500} placeholder="Acordos, detalhes ou lembretes" {...register("notes")}/></label>
      </div>
      <div className="oc-modal-actions"><button type="button" className="oc-ghost" onClick={onClose}>Cancelar</button><button type="submit" className="oc-primary" disabled={isSubmitting}>{isSubmitting ? "Salvando..." : transaction ? "Salvar alterações":"Salvar lançamento"}</button></div>
    </form>
  </Dialog>;
}
