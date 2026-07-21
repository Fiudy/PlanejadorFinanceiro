import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog } from "@/shared/ui/dialog";
import { Field, Input } from "@/shared/ui/input";
import { Select } from "@/shared/ui/select";
import { Button } from "@/shared/ui/button";
import { BankPicker } from "@/shared/ui/bank-picker";
import { useCreateAccount, useUpdateAccount } from "../hooks/use-accounts";
import { ACCOUNT_TYPE_LABELS } from "@/domain/entities/account";
import { amountString, parseAmount } from "@/shared/lib/validators";
import { findBank } from "@/shared/lib/banks";
import type { Account } from "@/domain/entities/account";

const schema = z
  .object({
    name: z.string().min(1, "Informe o nome da conta."),
    bankId: z.string().min(1, "Selecione uma instituição."),
    customBank: z.string().optional(),
    type: z.enum(["corrente", "poupanca", "carteira", "investimento"]),
    initialBalance: amountString,
  })
  .refine((data) => data.bankId !== "outro" || Boolean(data.customBank?.trim()), {
    path: ["customBank"],
    message: "Informe o nome da instituição.",
  });
type FormData = z.infer<typeof schema>;

const emptyValues: FormData = { name: "", bankId: "nubank", customBank: "", type: "corrente", initialBalance: "0" };

function toFormValues(account: Account): FormData {
  const isCustom = account.icon.startsWith("custom:");
  return {
    name: account.name,
    bankId: isCustom ? "outro" : account.icon,
    customBank: isCustom ? account.icon.slice(7) : "",
    type: account.type,
    initialBalance: String(account.initialBalance.reais),
  };
}

export function AccountFormDialog({
  open,
  onClose,
  onCreated,
  account,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: (account: Account) => void;
  /** Quando informado, o diálogo edita essa conta em vez de criar uma nova. */
  account?: Account;
}) {
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: emptyValues });
  const bankId = watch("bankId");

  useEffect(() => {
    if (!open) return;
    reset(account ? toFormValues(account) : emptyValues);
  }, [open, account, reset]);

  const onSubmit = async (data: FormData) => {
    const bank = findBank(data.bankId);
    const input = {
      name: data.name,
      type: data.type,
      color: bank?.color ?? "#0F7B5C",
      icon: bank?.id ?? `custom:${data.customBank!.trim()}`,
      initialBalanceCents: Math.round(parseAmount(data.initialBalance) * 100),
    };

    if (account) {
      await updateAccount.mutateAsync({ accountId: account.id, ...input });
    } else {
      const created = await createAccount.mutateAsync(input);
      onCreated?.(created);
    }

    reset(emptyValues);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} title={account ? "Editar conta" : "Nova conta"}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Field label="Instituição financeira" htmlFor="bankId">
          <BankPicker value={bankId} onChange={(id) => setValue("bankId", id, { shouldValidate: true })} />
          <input type="hidden" {...register("bankId")} />
          {errors.bankId && <p className="mt-1 text-xs text-coral-500">{errors.bankId.message}</p>}
        </Field>
        {bankId === "outro" && (
          <Field label="Nome da instituição" htmlFor="customBank">
            <Input id="customBank" placeholder="Ex: Cooperativa local" error={errors.customBank?.message} {...register("customBank")} />
          </Field>
        )}
        <Field label="Nome da conta" htmlFor="name">
          <Input id="name" placeholder="Ex: Conta principal" error={errors.name?.message} {...register("name")} />
        </Field>
        <Field label="Tipo" htmlFor="type">
          <Select id="type" {...register("type")}>
            {Object.entries(ACCOUNT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Saldo inicial (R$)" htmlFor="initialBalance">
          <Input id="initialBalance" type="number" step="0.01" error={errors.initialBalance?.message} {...register("initialBalance")} />
        </Field>
        <Button type="submit" size="lg" disabled={isSubmitting} className="mt-2 w-full justify-center">
          {isSubmitting ? "Salvando..." : account ? "Salvar alterações" : "Salvar conta"}
        </Button>
      </form>
    </Dialog>
  );
}
