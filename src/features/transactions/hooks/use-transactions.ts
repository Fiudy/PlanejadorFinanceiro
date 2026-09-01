import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/app/auth-context";
import { container } from "@/infrastructure/di/container";
import type { TransactionFilters } from "@/domain/repositories/repositories";
import type { TransactionPriority, TransactionStatus, TransactionType } from "@/domain/entities/transaction";

export interface TransactionInput {
  accountId: string;
  categoryId: string;
  type: TransactionType;
  amountCents: number;
  description: string;
  date: Date;
  dueDate?: Date;
  plannedDate?: Date;
  settledAt?: Date;
  status?: TransactionStatus;
  priority?: TransactionPriority;
  cardId?: string;
  notes?: string;
}

export function useTransactions(filters?: TransactionFilters) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["transactions", user?.id, filters],
    queryFn: () => container.transactions.list(user!.id, filters),
    enabled: Boolean(user),
  });
}

export function useCreateTransaction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: TransactionInput) => container.transactions.create({ userId: user!.id, ...input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["transactions", user?.id] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard-summary", user?.id] });
    },
  });
}

export function useUpdateTransaction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      ...input
    }: TransactionInput & { id: string }) => container.transactions.update(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["transactions", user?.id] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard-summary", user?.id] });
    },
  });
}

export function useRemoveTransaction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (transactionId: string) => container.transactions.remove(transactionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["transactions", user?.id] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard-summary", user?.id] });
    },
  });
}
