import { useMemo } from "react";
import type { RecurringBill } from "@/domain/entities/recurring-bill";
import { RECURRENCE_MONTHS } from "@/domain/entities/recurring-bill";
import { addMonths, isSameMonth, startOfMonth } from "@/shared/lib/date";
import { useRecurringBills } from "./use-recurring-bills";

export interface RecurringBillMonthOccurrence {
  bill: RecurringBill;
  date: Date;
}

/**
 * Projeta, para o mês de referência, em qual data cada conta fixa ativa
 * vai cair — inclusive em meses futuros que ainda não passaram por
 * `runDueBills`. É o que garante que uma conta fixa continue aparecendo
 * "nos demais meses" mesmo antes dela virar um lançamento de verdade.
 */
export function useRecurringBillOccurrencesForMonth(referenceMonth: Date): RecurringBillMonthOccurrence[] {
  const { data: bills = [] } = useRecurringBills();

  return useMemo(() => {
    const monthStart = startOfMonth(referenceMonth);
    const occurrences: RecurringBillMonthOccurrence[] = [];

    for (const bill of bills.filter((b) => b.active)) {
      let occurrence = bill.nextOccurrence;
      let guard = 0;
      while (occurrence < monthStart && guard < 36) {
        occurrence = addMonths(occurrence, RECURRENCE_MONTHS[bill.period]);
        guard += 1;
      }
      if (isSameMonth(occurrence, referenceMonth)) {
        occurrences.push({ bill, date: occurrence });
      }
    }

    return occurrences.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [bills, referenceMonth]);
}
