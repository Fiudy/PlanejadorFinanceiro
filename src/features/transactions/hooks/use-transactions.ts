import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/app/auth-context";
import { container } from "@/infrastructure/di/container";
import type { TransactionFilters } from "@/domain/repositories/repositories";
import type { TransactionType } from "@/domain/entities/transaction";

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
    mutationFn: (input: {
      accountId: string;
      categoryId: string;
      type: TransactionType;
      amountCents: number;
      description: string;
      date: Date;
    }) => container.transactions.create({ userId: user!.id, ...input }),
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
    }: {
      id: string;
      accountId: string;
      categoryId: string;
      type: TransactionType;
      amountCents: number;
      description: string;
      date: Date;
    }) => container.transactions.update(id, input),
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
