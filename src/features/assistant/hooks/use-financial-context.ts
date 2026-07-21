import { useMemo } from "react";
import { useAccounts } from "@/features/accounts/hooks/use-accounts";
import { useCategories } from "@/features/settings/hooks/use-categories";
import { useTransactions } from "@/features/transactions/hooks/use-transactions";
import { useGoals } from "@/features/goals/hooks/use-goals";
import { useRecurringBills } from "@/features/recurring-bills/hooks/use-recurring-bills";
import { useCards } from "@/features/cards/hooks/use-cards";
import { useDashboardSummary } from "@/features/dashboard/hooks/use-dashboard-summary";
import { useUserPreferences } from "@/features/settings/hooks/use-user-preferences";
import { buildFinancialContext } from "../lib/build-financial-context";

/** Junta tudo que o app sabe sobre as finanças do usuário num texto compacto para dar contexto à IA. */
export function useFinancialContext() {
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const { data: allTransactions = [] } = useTransactions();
  const { data: goals = [] } = useGoals();
  const { data: recurringBills = [] } = useRecurringBills();
  const { data: cards = [] } = useCards();
  const { data: summary } = useDashboardSummary();
  const { data: preferences } = useUserPreferences();

  const isReady = Boolean(summary);

  const context = useMemo(
    () =>
      buildFinancialContext({
        summary,
        accounts,
        categories,
        allTransactions,
        goals,
        recurringBills,
        cards,
        monthlyExpenseLimitCents: preferences?.monthlyExpenseLimitCents,
      }),
    [summary, accounts, categories, allTransactions, goals, recurringBills, cards, preferences],
  );

  return { context, isReady };
}
