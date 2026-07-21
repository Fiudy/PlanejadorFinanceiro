import { z } from "zod";

/**
 * Campos numéricos vindos de <input> chegam como string ao React Hook
 * Form. Validamos como string aqui (em vez de z.coerce.number(), que
 * gera inferências de tipo incompatíveis entre input/output no zod v4
 * + @hookform/resolvers) e convertemos para number manualmente no
 * onSubmit de cada formulário.
 */
export const positiveAmountString = z
  .string()
  .min(1, "Informe um valor.")
  .refine((value) => !Number.isNaN(parseAmount(value)) && parseAmount(value) > 0, "Informe um valor maior que zero.");

export const amountString = z
  .string()
  .min(1, "Informe um valor.")
  .refine((value) => !Number.isNaN(parseAmount(value)), "Valor inválido.");

export function parseAmount(value: string): number {
  return Number(value.replace(",", "."));
}

export function dayOfMonthString(label: string) {
  return z
    .string()
    .min(1, `Informe ${label}.`)
    .refine((value) => {
      const day = Number(value);
      return Number.isInteger(day) && day >= 1 && day <= 28;
    }, "Deve ser um dia entre 1 e 28.");
}
