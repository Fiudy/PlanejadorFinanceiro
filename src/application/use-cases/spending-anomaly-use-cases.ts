import { Percentage } from "@/domain/value-objects/percentage";
import type { CategoryRepository, TransactionRepository } from "@/domain/repositories/repositories";
import type { Money } from "@/domain/value-objects/money";
import { startOfMonth } from "@/shared/lib/date";
import { summarizeCategorySpending } from "./shared/category-spending";

export interface SpendingAnomaly {
  categoryId: string;
  categoryName: string;
  color: string;
  currentAmount: Money;
  averageAmount: Money;
  deviation: Percentage;
}

const DEFAULT_THRESHOLD = 0.3;

/**
 * Compara o gasto do mês corrente por categoria com a média dos últimos
 * 3 meses e aponta as categorias cujo desvio para cima passa do limiar.
 */
export class SpendingAnomalyUseCases {
  constructor(
    private readonly categories: CategoryRepository,
    private readonly transactions: TransactionRepository,
  ) {}

  async detect(
    userId: string,
    referenceDate: Date = new Date(),
    threshold: number = DEFAULT_THRESHOLD,
  ): Promise<SpendingAnomaly[]> {
    const [categories, transactions] = await Promise.all([
      this.categories.findAllByUser(userId),
      this.transactions.findAllByUser(userId),
    ]);

    const totals = summarizeCategorySpending(categories, transactions, startOfMonth(referenceDate), 3);

    return totals
      .filter((item) => item.averageAmount.isPositive())
      .map((item) => ({
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        color: item.color,
        currentAmount: item.currentAmount,
        averageAmount: item.averageAmount,
        deviation: Percentage.fromRatio(
          (item.currentAmount.inCents - item.averageAmount.inCents) / item.averageAmount.inCents,
        ),
      }))
      .filter((item) => item.deviation.value >= threshold)
      .sort((a, b) => b.deviation.value - a.deviation.value);
  }
}
