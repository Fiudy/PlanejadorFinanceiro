import { forwardRef, useEffect, useState, type InputHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

interface CurrencyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> {
  /** Valor em reais como string decimal (ex.: "1250.5"), compatível com parseAmount/positiveAmountString. Use "" para vazio. */
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

function centsFromReaisString(value: string): number {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.round(Math.abs(amount) * 100) : 0;
}

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Campo de valor monetário com máscara "R$ 0,00" — a entrada é feita dígito a dígito (como em caixas eletrônicos). O valor emitido via onChange é sempre uma string decimal em reais (ponto como separador), para permanecer compatível com os validadores e cálculos existentes. */
export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, onBlur, error, className, ...props }, ref) => {
    const [digits, setDigits] = useState(() => String(centsFromReaisString(value)));

    useEffect(() => {
      setDigits(String(centsFromReaisString(value)));
    }, [value]);

    const cents = Number(digits) || 0;

    return (
      <div className="w-full">
        <input
          ref={ref}
          type="text"
          inputMode="decimal"
          placeholder="R$ 0,00"
          value={cents === 0 ? "" : formatCents(cents)}
          onChange={(event) => {
            const rawDigits = event.target.value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
            setDigits(rawDigits);
            const nextCents = Number(rawDigits) || 0;
            onChange(nextCents ? (nextCents / 100).toFixed(2) : "");
          }}
          onBlur={onBlur}
          className={cn(
            "tabular h-11 w-full rounded-[var(--radius-control)] border border-border-light bg-white px-3.5 text-sm shadow-sm transition-all duration-150",
            "placeholder:text-muted-300 hover:border-muted-300 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-100",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "dark:border-border-dark dark:bg-ink-800 dark:text-paper-50 dark:hover:border-muted-500 dark:focus:ring-accent-600/20",
            error && "border-coral-500 hover:border-coral-500 focus:border-coral-500 focus:ring-coral-100",
            className,
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-coral-500">{error}</p>}
      </div>
    );
  },
);
CurrencyInput.displayName = "CurrencyInput";
