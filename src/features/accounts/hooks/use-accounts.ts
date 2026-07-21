import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/app/auth-context";
import { container } from "@/infrastructure/di/container";
import type { AccountType } from "@/domain/entities/account";

export function useAccounts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["accounts", user?.id],
    queryFn: () => container.accounts.list(user!.id),
    enabled: Boolean(user),
  });
}

export function useCreateAccount() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { name: string; type: AccountType; color: string; icon: string; initialBalanceCents: number }) =>
      container.accounts.create({ userId: user!.id, ...input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["accounts", user?.id] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard-summary", user?.id] });
    },
  });
}

export function useUpdateAccount() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      accountId,
      ...input
    }: {
      accountId: string;
      name: string;
      type: AccountType;
      color: string;
      icon: string;
      initialBalanceCents: number;
    }) => container.accounts.update(accountId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["accounts", user?.id] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard-summary", user?.id] });
    },
  });
}

export function useArchiveAccount() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (accountId: string) => container.accounts.archive(accountId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["accounts", user?.id] });
    },
  });
}
