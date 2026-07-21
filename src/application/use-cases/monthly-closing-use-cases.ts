import { Money } from "@/domain/value-objects/money";
import { Percentage } from "@/domain/value-objects/percentage";
import type { CategoryRepository, TransactionRepository } from "@/domain/repositories/repositories";
import { addMonths, endOfMonth, startOfMonth } from "@/shared/lib/date";
import { summarizeCategorySpending } from "./shared/category-spending";

export interface MonthlyClosingCategoryGrowth {
  categoryId: string;
  categoryName: string;
  color: string;
  amount: Money;
  growth: Percentage;
}

export interface MonthlyClosingSummary {
  month: Date;
  totalIncome: Money;
  totalExpense: Money;
  netResult: Money;
  averageExpenseLast3Months: Money;
  expenseVsAverage: Percentage;
  topGrowingCategory: MonthlyClosingCategoryGrowth | null;
}

/**
 * Monta o "seu mês em números" do mês que acabou de fechar. Não depende de
 * nenhum agendamento no backend: é chamado ao abrir o app, sempre que o mês
 * calendário mudou desde a última vez que o usuário viu o resumo.
 */
export class MonthlyClosingUseCases {
  constructor(
    private readonly categories: CategoryRepository,
    private readonly transactions: TransactionRepository,
  ) {}

  async getClosingSummary(userId: string, referenceDate: Date = new Date()): Promise<MonthlyClosingSummary> {
    const closedMonth = addMonths(startOfMonth(referenceDate), -1);

    const [categories, allTransactions] = await Promise.all([
      this.categories.findAllByUser(userId),
      this.transactions.findAllByUser(userId),
    ]);

    const closedMonthItems = allTransactions.filter(
      (t) => t.date >= closedMonth && t.date <= endOfMonth(closedMonth),
    );

    const totalIncome = closedMonthItems
      .filter((t) => t.type === "receita")
      .reduce((sum, t) => sum.add(t.amount), Money.zero());
    const totalExpense = closedMonthItems
      .filter((t) => t.type === "despesa")
      .reduce((sum, t) => sum.add(t.amount), Money.zero());

    const priorMonths = [1, 2, 3].map((offset) => addMonths(closedMonth, -offset));
    const priorExpenseTotals = priorMonths.map((month) =>
      allTransactions
        .filter((t) => t.type === "despesa" && t.date >= month && t.date <= endOfMonth(month))
        .reduce((sum, t) => sum + t.amount.inCents, 0),
    );
    const averageExpenseLast3Months = Money.fromCents(
      Math.round(priorExpenseTotals.reduce((sum, cents) => sum + cents, 0) / priorExpenseTotals.length),
    );

    const expenseVsAverage = averageExpenseLast3Months.isPositive()
      ? Percentage.fromRatio(
          (totalExpense.inCents - averageExpenseLast3Months.inCents) / averageExpenseLast3Months.inCents,
        )
      : Percentage.fromRatio(0);

    const categoryTotals = summarizeCategorySpending(categories, allTransactions, closedMonth, 3).filter((item) =>
      item.currentAmount.isPositive(),
    );

    const growthItems: MonthlyClosingCategoryGrowth[] = categoryTotals.map((item) => ({
      categoryId: item.categoryId,
      categoryName: item.categoryName,
      color: item.color,
      amount: item.currentAmount,
      growth: item.averageAmount.isPositive()
        ? Percentage.fromRatio((item.currentAmount.inCents - item.averageAmount.inCents) / item.averageAmount.inCents)
        : Percentage.fromRatio(1),
    }));

    const topGrowingCategory =
      growthItems.length === 0
        ? null
        : growthItems.reduce((max, item) => (item.growth.value > max.growth.value ? item : max));

    return {
      month: closedMonth,
      totalIncome,
      totalExpense,
      netResult: totalIncome.subtract(totalExpense),
      averageExpenseLast3Months,
      expenseVsAverage,
      topGrowingCategory,
    };
  }
}
