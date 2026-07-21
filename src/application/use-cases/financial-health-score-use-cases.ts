import { Percentage } from "@/domain/value-objects/percentage";
import type { RecurringBillRepository, TransactionRepository } from "@/domain/repositories/repositories";
import { endOfMonth, isSameMonth, startOfMonth } from "@/shared/lib/date";
import type { DashboardUseCases } from "./dashboard-use-cases";

export type FinancialHealthFactorKey = "committedIncome" | "savingsRate" | "billPunctuality";
export type FinancialHealthRating = "critico" | "atencao" | "saudavel" | "otimo";

export interface FinancialHealthFactor {
  key: FinancialHealthFactorKey;
  label: string;
  /** 0..1 — quanto maior, melhor esse fator contribui para a saúde financeira. */
  score: Percentage;
  detail: string;
}

export interface FinancialHealthScore {
  score: number; // 0-100
  rating: FinancialHealthRating;
  factors: FinancialHealthFactor[];
  headline: string;
}

const WEIGHTS: Record<FinancialHealthFactorKey, number> = {
  committedIncome: 0.4,
  savingsRate: 0.35,
  billPunctuality: 0.25,
};

export function ratingFor(score: number): FinancialHealthRating {
  if (score < 40) return "critico";
  if (score < 60) return "atencao";
  if (score < 80) return "saudavel";
  return "otimo";
}

export const FINANCIAL_HEALTH_RATING_LABELS: Record<FinancialHealthRating, string> = {
  critico: "Crítico",
  atencao: "Atenção",
  saudavel: "Saudável",
  otimo: "Ótimo",
};

/**
 * Combina três sinais já disponíveis no app — nenhum dado novo precisa ser
 * coletado do usuário: % de renda comprometida e receita/despesa do mês
 * vêm do DashboardUseCases; a pontualidade de contas fixas é calculada
 * aqui comparando contas ativas vencidas neste mês com transações lançadas.
 */
export class FinancialHealthScoreUseCases {
  constructor(
    private readonly dashboard: DashboardUseCases,
    private readonly recurringBills: RecurringBillRepository,
    private readonly transactions: TransactionRepository,
  ) {}

  async calculate(userId: string, referenceDate: Date = new Date()): Promise<FinancialHealthScore> {
    const summary = await this.dashboard.getSummary(userId, referenceDate);

    const committedRatio = Math.min(1, summary.committedIncomeRatio.value);
    const committedScore = Percentage.fromRatio(1 - committedRatio);

    const savingsRatio = summary.monthlyIncome.isPositive()
      ? Percentage.fromParts(
          summary.monthlyIncome.subtract(summary.monthlyExpense).inCents,
          summary.monthlyIncome.inCents,
        )
      : Percentage.fromRatio(0);
    const savingsScore = Percentage.fromRatio(Math.max(0, Math.min(1, savingsRatio.value)));

    const punctuality = await this.calculatePunctuality(userId, referenceDate);

    const factors: FinancialHealthFactor[] = [
      {
        key: "committedIncome",
        label: "Renda comprometida",
        score: committedScore,
        detail: `${summary.committedIncomeRatio.toDisplayString(0)} da renda do mês já está comprometida com despesas.`,
      },
      {
        key: "savingsRate",
        label: "Taxa de poupança",
        score: savingsScore,
        detail:
          savingsRatio.value >= 0
            ? `Você guardou ${savingsRatio.toDisplayString(0)} da renda este mês.`
            : `Você gastou ${Percentage.fromRatio(Math.abs(savingsRatio.value)).toDisplayString(0)} a mais do que ganhou este mês.`,
      },
      {
        key: "billPunctuality",
        label: "Pontualidade de contas",
        score: punctuality.score,
        detail:
          punctuality.overdueCount === 0
            ? "Nenhuma conta fixa vencida sem pagamento registrado."
            : `${punctuality.overdueCount} conta(s) fixa(s) vencida(s) sem lançamento correspondente.`,
      },
    ];

    const weightedScore = factors.reduce((sum, factor) => sum + factor.score.value * WEIGHTS[factor.key], 0);
    const score = Math.round(weightedScore * 100);
    const worst = [...factors].sort((a, b) => a.score.value - b.score.value)[0];

    return { score, rating: ratingFor(score), factors, headline: worst.detail };
  }

  private async calculatePunctuality(userId: string, referenceDate: Date) {
    const bills = await this.recurringBills.findAllByUser(userId);
    const dueThisMonth = bills.filter((bill) => bill.active && isSameMonth(bill.nextOccurrence, referenceDate));
    if (dueThisMonth.length === 0) {
      return { score: Percentage.fromRatio(1), overdueCount: 0 };
    }

    const monthTransactions = await this.transactions.findAllByUser(userId, {
      from: startOfMonth(referenceDate),
      to: endOfMonth(referenceDate),
    });

    const overdueCount = dueThisMonth.filter((bill) => {
      const isOverdue = bill.nextOccurrence <= referenceDate;
      if (!isOverdue) return false;
      const hasMatchingTransaction = monthTransactions.some((t) => t.categoryId === bill.categoryId);
      return !hasMatchingTransaction;
    }).length;

    const score = Percentage.fromRatio(1 - overdueCount / dueThisMonth.length);
    return { score, overdueCount };
  }
}
