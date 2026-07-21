import type { Account } from "@/domain/entities/account";
import { ACCOUNT_TYPE_LABELS } from "@/domain/entities/account";
import type { Transaction } from "@/domain/entities/transaction";
import type { Category } from "@/domain/entities/category";
import type { Goal } from "@/domain/entities/goal";
import type { RecurringBill } from "@/domain/entities/recurring-bill";
import { RECURRENCE_LABELS } from "@/domain/entities/recurring-bill";
import type { Card as CardEntity } from "@/domain/entities/card";
import { Money } from "@/domain/value-objects/money";
import { formatDate, monthLabel } from "@/shared/lib/date";
import type { DashboardSummary } from "@/application/use-cases/dashboard-use-cases";

// O modelo usado tem uma janela de contexto grande — preferimos mandar o histórico
// quase inteiro (com um teto de segurança) a arriscar a IA "não enxergar" lançamentos
// mais antigos e responder com base em dados incompletos.
const RAW_TRANSACTIONS_LIMIT = 1000;

export function buildFinancialContext(input: {
  summary?: DashboardSummary;
  accounts: Account[];
  categories: Category[];
  allTransactions: Transaction[];
  goals: Goal[];
  recurringBills: RecurringBill[];
  cards: CardEntity[];
  monthlyExpenseLimitCents?: number;
}): string {
  const { summary, accounts, categories, allTransactions, goals, recurringBills, cards, monthlyExpenseLimitCents } = input;
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const lines: string[] = [];

  if (accounts.length === 0 && allTransactions.length === 0) {
    return "O usuário ainda não cadastrou contas nem lançamentos no app.";
  }

  lines.push(`Contas bancárias (${accounts.filter((a) => !a.archived).length}):`);
  for (const account of accounts.filter((a) => !a.archived)) {
    lines.push(`- ${account.name} (${ACCOUNT_TYPE_LABELS[account.type]}) — saldo inicial cadastrado: ${account.initialBalance.format()}`);
  }

  if (summary) {
    lines.push("");
    lines.push(`Saldo consolidado (todas as contas, todo o histórico): ${summary.consolidatedBalance.format()}`);
    lines.push(`Mês atual — receitas: ${summary.monthlyIncome.format()}, despesas: ${summary.monthlyExpense.format()}`);
    lines.push(
      `Despesas essenciais: ${summary.essentialExpense.format()} · despesas variáveis: ${summary.variableExpense.format()}`,
    );
    lines.push(`% da receita do mês já comprometida com despesas: ${summary.committedIncomeRatio.toDisplayString()}`);

    if (monthlyExpenseLimitCents) {
      const limit = Money.fromCents(monthlyExpenseLimitCents);
      const usedRatio = limit.inCents > 0 ? summary.monthlyExpense.inCents / limit.inCents : 0;
      lines.push(`Limite mensal de despesas definido pelo usuário: ${limit.format()} (uso atual: ${Math.round(usedRatio * 100)}%)`);
    }

    if (summary.categoryBreakdown.length > 0) {
      lines.push("");
      lines.push("Gastos por categoria neste mês (do maior para o menor):");
      for (const item of [...summary.categoryBreakdown].sort((a, b) => b.amount.inCents - a.amount.inCents)) {
        lines.push(`- ${item.categoryName}: ${item.amount.format()}`);
      }
    }

    if (summary.monthlyEvolution.length > 0) {
      lines.push("");
      lines.push("Evolução mensal recente (receita x despesa):");
      for (const item of summary.monthlyEvolution) {
        lines.push(`- ${monthLabel(item.month)}: receita ${item.income.format()}, despesa ${item.expense.format()}`);
      }
    }
  }

  // Ranking de gastos por categoria em todo o histórico — para "com o que eu mais gasto".
  const allTimeExpenseByCategory = new Map<string, number>();
  for (const transaction of allTransactions) {
    if (transaction.type !== "despesa") continue;
    const key = categoryById.get(transaction.categoryId)?.name ?? "Sem categoria";
    allTimeExpenseByCategory.set(key, (allTimeExpenseByCategory.get(key) ?? 0) + transaction.amount.inCents);
  }
  if (allTimeExpenseByCategory.size > 0) {
    lines.push("");
    lines.push("Ranking de despesas por categoria em todo o histórico (do maior para o menor):");
    const ranked = [...allTimeExpenseByCategory.entries()].sort((a, b) => b[1] - a[1]);
    for (const [name, cents] of ranked) {
      lines.push(`- ${name}: ${Money.fromCents(cents).format()}`);
    }
  }

  // Quebra mês a mês por categoria, cobrindo TODO o histórico (não só o mês atual ou
  // os últimos 6 meses do resumo do dashboard) — permite responder "quanto gastei em
  // [categoria] em [mês]" com precisão para qualquer período já lançado.
  const monthCategoryTotals = new Map<string, Map<string, number>>();
  for (const transaction of allTransactions) {
    const monthKey = `${transaction.date.getFullYear()}-${String(transaction.date.getMonth() + 1).padStart(2, "0")}`;
    const categoryName = categoryById.get(transaction.categoryId)?.name ?? "Sem categoria";
    const sign = transaction.type === "despesa" ? -1 : 1;
    if (!monthCategoryTotals.has(monthKey)) monthCategoryTotals.set(monthKey, new Map());
    const perCategory = monthCategoryTotals.get(monthKey)!;
    perCategory.set(categoryName, (perCategory.get(categoryName) ?? 0) + sign * transaction.amount.inCents);
  }
  if (monthCategoryTotals.size > 0) {
    lines.push("");
    lines.push("Totais por categoria em cada mês com lançamentos (todo o histórico, despesa negativa/receita positiva):");
    const sortedMonths = [...monthCategoryTotals.keys()].sort();
    for (const monthKey of sortedMonths) {
      const perCategory = monthCategoryTotals.get(monthKey)!;
      const parts = [...perCategory.entries()]
        .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
        .map(([name, cents]) => `${name} ${Money.fromCents(cents).format()}`);
      lines.push(`- ${monthKey}: ${parts.join(", ")}`);
    }
  }

  if (goals.length > 0) {
    lines.push("");
    lines.push("Metas de economia:");
    for (const goal of goals) {
      const remaining = goal.targetAmount.subtract(goal.currentAmount);
      const deadline = goal.targetDate ? `, prazo até ${formatDate(goal.targetDate)}` : "";
      lines.push(
        `- "${goal.name}": ${goal.currentAmount.format()} de ${goal.targetAmount.format()} (${goal.progress.toDisplayString()}), faltam ${remaining.format()}${deadline}`,
      );
    }
  }

  const activeBills = recurringBills.filter((b) => b.active);
  if (activeBills.length > 0) {
    lines.push("");
    lines.push("Contas fixas ativas:");
    for (const bill of activeBills) {
      lines.push(
        `- ${bill.name}: ${bill.amount.format()} (${RECURRENCE_LABELS[bill.period]}), próximo vencimento ${formatDate(bill.nextOccurrence)}`,
      );
    }
  }

  const activeCards = cards.filter((c) => !c.archived);
  if (activeCards.length > 0) {
    lines.push("");
    lines.push("Cartões de crédito:");
    for (const card of activeCards) {
      lines.push(`- ${card.name} (${card.bank}): limite total ${card.limit.format()}, fecha dia ${card.closingDay}, vence dia ${card.dueDay}`);
    }
  }

  if (allTransactions.length > 0) {
    const sorted = [...allTransactions].sort((a, b) => b.date.getTime() - a.date.getTime());
    const shown = sorted.slice(0, RAW_TRANSACTIONS_LIMIT);
    const truncated = allTransactions.length > RAW_TRANSACTIONS_LIMIT;
    lines.push("");
    lines.push(
      truncated
        ? `Lista de lançamentos (mostrando os ${RAW_TRANSACTIONS_LIMIT} mais recentes de ${allTransactions.length} no total — para totais fora desta lista, use os totais por categoria/mês acima, que cobrem TODO o histórico):`
        : `Lista de TODOS os ${allTransactions.length} lançamentos do usuário (do mais novo para o mais antigo):`,
    );
    for (const transaction of shown) {
      const category = categoryById.get(transaction.categoryId)?.name ?? "Sem categoria";
      const sign = transaction.type === "receita" ? "+" : "-";
      lines.push(`- ${formatDate(transaction.date)} · ${transaction.description} (${category}) · ${sign}${transaction.amount.format()}`);
    }
  }

  return lines.join("\n");
}
