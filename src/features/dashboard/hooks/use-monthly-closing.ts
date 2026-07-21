import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/app/auth-context";
import { container } from "@/infrastructure/di/container";

function storageKey(userId: string) {
  return `planejador-financeiro:last-closing-seen:${userId}`;
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

/**
 * Busca o fechamento do mês anterior e decide se o modal "seu mês em
 * números" deve aparecer: só uma vez por mês fechado (controlado via
 * localStorage, é uma preferência de sessão, não dado de domínio) e só
 * quando há alguma movimentação para mostrar.
 */
export function useMonthlyClosing() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  const query = useQuery({
    queryKey: ["monthly-closing", user?.id],
    queryFn: () => container.monthlyClosing.getClosingSummary(user!.id),
    enabled: Boolean(user),
  });

  const closedMonthKey = query.data ? monthKey(query.data.month) : null;
  const alreadySeen = Boolean(user && closedMonthKey && localStorage.getItem(storageKey(user.id)) === closedMonthKey);
  const hasMeaningfulData = query.data
    ? query.data.totalIncome.isPositive() || query.data.totalExpense.isPositive()
    : false;

  const open = Boolean(query.data) && hasMeaningfulData && !alreadySeen && !dismissed;

  const dismiss = () => {
    if (user && closedMonthKey) localStorage.setItem(storageKey(user.id), closedMonthKey);
    setDismissed(true);
  };

  return { summary: query.data, open, dismiss };
}
