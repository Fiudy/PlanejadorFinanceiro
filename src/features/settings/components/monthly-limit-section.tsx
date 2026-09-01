import { useEffect, useState } from "react";
import { Gauge as GaugeIcon } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/shared/ui/card";
import { Field } from "@/shared/ui/input";
import { CurrencyInput } from "@/shared/ui/currency-input";
import { Button } from "@/shared/ui/button";
import { Money } from "@/domain/value-objects/money";
import { useUserPreferences, useSetMonthlyExpenseLimit } from "../hooks/use-user-preferences";
import { parseAmount } from "@/shared/lib/validators";

export function MonthlyLimitSection() {
  const { data: preferences } = useUserPreferences();
  const setLimit = useSetMonthlyExpenseLimit();
  const [value, setValue] = useState("");

  useEffect(() => {
    if (preferences?.monthlyExpenseLimitCents !== undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza o campo com a preferência carregada de forma assíncrona, não é estado derivável em render
      setValue(String(Money.fromCents(preferences.monthlyExpenseLimitCents).reais));
    }
  }, [preferences?.monthlyExpenseLimitCents]);

  const handleSave = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setLimit.mutate(null);
      return;
    }
    const amount = parseAmount(trimmed);
    if (!amount || amount <= 0) return;
    setLimit.mutate(Math.round(amount * 100));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <GaugeIcon className="h-3.5 w-3.5" />
          Limite mensal de despesas
        </CardTitle>
      </CardHeader>
      <p className="mb-3 text-xs text-muted-500">
        Defina quanto você planeja gastar por mês. O dashboard mostra um medidor com o quanto já foi usado.
      </p>
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Field label="Limite (R$)" htmlFor="monthlyLimit">
            <CurrencyInput id="monthlyLimit" value={value} onChange={setValue} />
          </Field>
        </div>
        <Button onClick={handleSave} disabled={setLimit.isPending} className="h-11">
          {setLimit.isPending ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </Card>
  );
}
