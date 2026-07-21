import { Money } from "@/domain/value-objects/money";
import { Percentage } from "@/domain/value-objects/percentage";
import type { Account } from "@/domain/entities/account";
import type { Transaction } from "@/domain/entities/transaction";
import { RECURRING_BILL_TRANSACTION_SUFFIX } from "@/domain/entities/recurring-bill";
import type {
  AccountRepository,
  CardRepository,
  CategoryRepository,
  RecurringBillRepository,
  TransactionRepository,
} from "@/domain/repositories/repositories";
import { addMonths, endOfMonth, isSameMonth, startOfMonth } from "@/shared/lib/date";

export interface CategoryBreakdownItem {
  categoryId: string;
  categoryName: string;
  color: string;
  amount: Money;
}

export interface MonthlyEvolutionItem {
  month: Date;
  income: Money;
  expense: Money;
}

export interface DailyEvolutionItem {
  date: Date;
  balance: Money;
  income: Money;
  expense: Money;
}

export interface RecentActivityItem {
  id: string;
  description: string;
  categoryName: string;
  categoryColor: string;
  date: Date;
  type: Transaction["type"];
  amount: Money;
  isFixed: boolean;
}

export interface UpcomingDueItem {
  id: string;
  label: string;
  amount: Money;
  dueDate: Date;
  kind: "conta-fixa" | "fatura-cartao";
}

export interface DashboardSummary {
  consolidatedBalance: Money;
  monthlyIncome: Money;
  monthlyExpense: Money;
  committedIncomeRatio: Percentage;
  categoryBreakdown: CategoryBreakdownItem[];
  monthlyEvolution: MonthlyEvolutionItem[];
  dailyEvolution: DailyEvolutionItem[];
  recentActivity: RecentActivityItem[];
  essentialExpense: Money;
  variableExpense: Money;
  upcomingDue: UpcomingDueItem[];
}

export class DashboardUseCases {
  constructor(
    private readonly accounts: AccountRepository,
    private readonly categories: CategoryRepository,
    private readonly transactions: TransactionRepository,
    private readonly cards: CardRepository,
    private readonly recurringBills: RecurringBillRepository,
  ) {}

  /** Saldo consolidado de todas as contas ativas — usado também pela previsão de fluxo de caixa. */
  private computeConsolidatedBalance(accounts: Account[], transactions: Transaction[]): Money {
    const activeAccounts = accounts.filter((account) => !account.archived);
    return activeAccounts.reduce((total, account) => {
      const accountTransactions = transactions.filter((t) => t.accountId === account.id);
      const movement = accountTransactions.reduce((sum, t) => sum.add(t.signedAmount), Money.zero());
      return total.add(account.initialBalance).add(movement);
    }, Money.zero());
  }

  async getConsolidatedBalance(userId: string): Promise<Money> {
    const [accounts, transactions] = await Promise.all([
      this.accounts.findAllByUser(userId),
      this.transactions.findAllByUser(userId),
    ]);
    return this.computeConsolidatedBalance(accounts, transactions);
  }

  async getSummary(userId: string, referenceDate: Date = new Date()): Promise<DashboardSummary> {
    const [accounts, categories, allTransactions, cards, bills] = await Promise.all([
      this.accounts.findAllByUser(userId),
      this.categories.findAllByUser(userId),
      this.transactions.findAllByUser(userId),
      this.cards.findAllByUser(userId),
      this.recurringBills.findAllByUser(userId),
    ]);

    const consolidatedBalance = this.computeConsolidatedBalance(accounts, allTransactions);

    const monthTransactions = allTransactions.filter((t) => isSameMonth(t.date, referenceDate));
    const monthlyIncome = monthTransactions
      .filter((t) => t.type === "receita")
      .reduce((sum, t) => sum.add(t.amount), Money.zero());
    const monthlyExpense = monthTransactions
      .filter((t) => t.type === "despesa")
      .reduce((sum, t) => sum.add(t.amount), Money.zero());

    const committedIncomeRatio = monthlyIncome.isPositive()
      ? Percentage.fromParts(monthlyExpense.inCents, monthlyIncome.inCents)
      : Percentage.fromRatio(0);

    const categoryBreakdown: CategoryBreakdownItem[] = categories
      .filter((category) => category.kind === "despesa")
      .map((category) => {
        const amount = monthTransactions
          .filter((t) => t.categoryId === category.id && t.type === "despesa")
          .reduce((sum, t) => sum.add(t.amount), Money.zero());
        return { categoryId: category.id, categoryName: category.name, color: category.color, amount };
      })
      .filter((item) => item.amount.isPositive())
      .sort((a, b) => b.amount.compareTo(a.amount));

    const monthlyEvolution: MonthlyEvolutionItem[] = Array.from({ length: 6 }, (_, index) => {
      const month = addMonths(startOfMonth(referenceDate), index - 5);
      const monthEnd = endOfMonth(month);
      const items = allTransactions.filter((t) => t.date >= month && t.date <= monthEnd);
      const income = items.filter((t) => t.type === "receita").reduce((sum, t) => sum.add(t.amount), Money.zero());
      const expense = items.filter((t) => t.type === "despesa").reduce((sum, t) => sum.add(t.amount), Money.zero());
      return { month, income, expense };
    });

    const firstDay = new Date(referenceDate);
    firstDay.setHours(0, 0, 0, 0);
    firstDay.setDate(firstDay.getDate() - 29);
    const balanceBeforeWindow = allTransactions
      .filter((t) => t.date < firstDay)
      .reduce((sum, t) => sum.add(t.signedAmount), accounts.filter((a) => !a.archived).reduce((sum, a) => sum.add(a.initialBalance), Money.zero()));
    let runningBalance = balanceBeforeWindow;
    const dailyEvolution: DailyEvolutionItem[] = Array.from({ length: 30 }, (_, index) => {
      const date = new Date(firstDay);
      date.setDate(date.getDate() + index);
      const dayItems = allTransactions.filter((t) => t.date.toDateString() === date.toDateString());
      const income = dayItems.filter((t) => t.type === "receita").reduce((sum, t) => sum.add(t.amount), Money.zero());
      const expense = dayItems.filter((t) => t.type === "despesa").reduce((sum, t) => sum.add(t.amount), Money.zero());
      runningBalance = runningBalance.add(income).subtract(expense);
      return { date, balance: runningBalance, income, expense };
    });

    const categoryById = new Map(categories.map((category) => [category.id, category]));
    const recentActivity: RecentActivityItem[] = [...allTransactions]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 6)
      .map((transaction) => {
        const category = categoryById.get(transaction.categoryId);
        return {
          id: transaction.id,
          description: transaction.description,
          categoryName: category?.name ?? "Sem categoria",
          categoryColor: category?.color ?? "#A3AEBD",
          date: transaction.date,
          type: transaction.type,
          amount: transaction.amount,
          isFixed: transaction.description.endsWith(RECURRING_BILL_TRANSACTION_SUFFIX),
        };
      });

    const essentialExpense = bills
      .filter((bill) => bill.active)
      .reduce((sum, bill) => sum.add(bill.amount), Money.zero());
    const variableExpense = monthlyExpense.subtract(
      Money.fromCents(Math.min(monthlyExpense.inCents, essentialExpense.inCents)),
    );

    const upcomingBills: UpcomingDueItem[] = bills
      .filter((bill) => bill.active)
      .map((bill) => ({
        id: bill.id,
        label: bill.name,
        amount: bill.amount,
        dueDate: bill.nextOccurrence,
        kind: "conta-fixa" as const,
      }));

    const upcomingInvoices: UpcomingDueItem[] = [];
    for (const card of cards.filter((c) => !c.archived)) {
      const purchases = await this.cards.findPurchasesByCard(card.id, userId);
      const dueDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), card.dueDay);
      let invoiceTotalCents = 0;
      for (const purchase of purchases) {
        purchase.installmentDates().forEach((date) => {
          if (isSameMonth(date, referenceDate)) {
            invoiceTotalCents += purchase.installmentAmount.inCents;
          }
        });
      }
      if (invoiceTotalCents > 0) {
        upcomingInvoices.push({
          id: `card-${card.id}`,
          label: `Fatura ${card.name}`,
          amount: Money.fromCents(invoiceTotalCents),
          dueDate,
          kind: "fatura-cartao",
        });
      }
    }

    const upcomingDue = [...upcomingBills, ...upcomingInvoices].sort(
      (a, b) => a.dueDate.getTime() - b.dueDate.getTime(),
    );

    return {
      consolidatedBalance,
      monthlyIncome,
      monthlyExpense,
      committedIncomeRatio,
      categoryBreakdown,
      monthlyEvolution,
      dailyEvolution,
      recentActivity,
      essentialExpense,
      variableExpense,
      upcomingDue,
    };
  }
}
