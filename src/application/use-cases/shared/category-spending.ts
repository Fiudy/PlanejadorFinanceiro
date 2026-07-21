import { Money } from "@/domain/value-objects/money";
import type { Category } from "@/domain/entities/category";
import type { Transaction } from "@/domain/entities/transaction";
import { addMonths, endOfMonth } from "@/shared/lib/date";

export interface CategoryMonthTotal {
  categoryId: string;
  categoryName: string;
  color: string;
  currentAmount: Money;
  averageAmount: Money;
}

/**
 * Para cada categoria de despesa, soma o gasto em `targetMonth` (início do
 * mês) e calcula a média de gasto nos `monthsBack` meses imediatamente
 * anteriores a ele. Usado tanto pelo fechamento mensal quanto pela
 * detecção de anomalias, para não duplicar a agregação por categoria/mês.
 */
export function summarizeCategorySpending(
  categories: Category[],
  transactions: Transaction[],
  targetMonth: Date,
  monthsBack = 3,
): CategoryMonthTotal[] {
  const expenseCategories = categories.filter((category) => category.kind === "despesa");

  const monthExpenses = (monthStart: Date) => {
    const monthEnd = endOfMonth(monthStart);
    return transactions.filter((t) => t.type === "despesa" && t.date >= monthStart && t.date <= monthEnd);
  };

  const currentItems = monthExpenses(targetMonth);
  const priorMonthItems = Array.from({ length: monthsBack }, (_, index) =>
    monthExpenses(addMonths(targetMonth, -(index + 1))),
  );

  return expenseCategories.map((category) => {
    const currentAmount = currentItems
      .filter((t) => t.categoryId === category.id)
      .reduce((sum, t) => sum.add(t.amount), Money.zero());

    const priorTotalCents = priorMonthItems.reduce((sum, monthItems) => {
      const monthTotalCents = monthItems
        .filter((t) => t.categoryId === category.id)
        .reduce((s, t) => s + t.amount.inCents, 0);
      return sum + monthTotalCents;
    }, 0);
    const averageAmount = Money.fromCents(Math.round(priorTotalCents / monthsBack));

    return {
      categoryId: category.id,
      categoryName: category.name,
      color: category.color,
      currentAmount,
      averageAmount,
    };
  });
}
