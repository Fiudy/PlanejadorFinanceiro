import { Money } from "@/domain/value-objects/money";
import { RECURRENCE_MONTHS, RECURRING_BILL_TRANSACTION_SUFFIX } from "@/domain/entities/recurring-bill";
import type { Transaction } from "@/domain/entities/transaction";
import type { CardRepository, RecurringBillRepository, TransactionRepository } from "@/domain/repositories/repositories";
import { addDays, addMonths, startOfDay, startOfMonth } from "@/shared/lib/date";
import type { DashboardUseCases } from "./dashboard-use-cases";

export interface CashFlowForecastPoint {
  date: Date;
  balance: Money;
  /** false apenas no primeiro ponto (saldo atual); os demais são projeção. */
  projected: boolean;
}

const VARIABLE_SPENDING_WINDOW_MONTHS = 3;

/**
 * Projeta o saldo diário dos próximos `horizonDays` combinando: saldo atual
 * (DashboardUseCases), contas fixas com vencimento futuro, parcelas de
 * cartão futuras e a média histórica diária de gastos variáveis (despesas
 * que não vêm de conta fixa nem de parcela de cartão).
 */
export class CashFlowForecastUseCases {
  constructor(
    private readonly dashboard: DashboardUseCases,
    private readonly recurringBills: RecurringBillRepository,
    private readonly cards: CardRepository,
    private readonly transactions: TransactionRepository,
  ) {}

  async forecast(userId: string, referenceDate: Date = new Date(), horizonDays = 30): Promise<CashFlowForecastPoint[]> {
    const today = startOfDay(referenceDate);
    const horizonEnd = addDays(today, horizonDays);

    const [currentBalance, bills, cardList, allTransactions] = await Promise.all([
      this.dashboard.getConsolidatedBalance(userId),
      this.recurringBills.findAllByUser(userId),
      this.cards.findAllByUser(userId),
      this.transactions.findAllByUser(userId),
    ]);

    const dailyImpactCents = new Map<string, number>();
    const addImpact = (date: Date, cents: number) => {
      const key = startOfDay(date).toISOString();
      dailyImpactCents.set(key, (dailyImpactCents.get(key) ?? 0) + cents);
    };

    for (const bill of bills.filter((b) => b.active)) {
      let occurrence = bill.nextOccurrence;
      let guard = 0;
      while (occurrence <= horizonEnd && guard < 60) {
        if (occurrence >= today) addImpact(occurrence, -bill.amount.inCents);
        occurrence = addMonths(occurrence, RECURRENCE_MONTHS[bill.period]);
        guard += 1;
      }
    }

    for (const card of cardList.filter((c) => !c.archived)) {
      const purchases = await this.cards.findPurchasesByCard(card.id, userId);
      for (const purchase of purchases) {
        purchase.installmentDates().forEach((date) => {
          if (date >= today && date <= horizonEnd) {
            addImpact(date, -purchase.installmentAmount.inCents);
          }
        });
      }
    }

    const variableDailyAverageCents = this.computeVariableDailyAverageCents(allTransactions, today);

    const points: CashFlowForecastPoint[] = [{ date: today, balance: currentBalance, projected: false }];
    let runningBalance = currentBalance;
    for (let dayOffset = 1; dayOffset <= horizonDays; dayOffset += 1) {
      const date = addDays(today, dayOffset);
      const key = date.toISOString();
      const scheduledImpactCents = dailyImpactCents.get(key) ?? 0;
      runningBalance = runningBalance.add(Money.fromCents(scheduledImpactCents - variableDailyAverageCents));
      points.push({ date, balance: runningBalance, projected: true });
    }

    return points;
  }

  /** Média diária de despesas "do dia a dia" — exclui contas fixas e compras no cartão. */
  private computeVariableDailyAverageCents(transactions: Transaction[], today: Date): number {
    const windowStart = addMonths(startOfMonth(today), -VARIABLE_SPENDING_WINDOW_MONTHS);
    const variableExpenses = transactions.filter(
      (t) =>
        t.type === "despesa" &&
        t.date >= windowStart &&
        t.date <= today &&
        !t.cardPurchaseId &&
        !t.description.endsWith(RECURRING_BILL_TRANSACTION_SUFFIX),
    );
    const totalCents = variableExpenses.reduce((sum, t) => sum + t.amount.inCents, 0);
    const windowDays = Math.max(1, Math.round((today.getTime() - windowStart.getTime()) / (24 * 60 * 60 * 1000)));
    return Math.round(totalCents / windowDays);
  }
}
