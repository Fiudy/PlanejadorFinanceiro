import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/app/auth-context";
import { container } from "@/infrastructure/di/container";
import type { RecurrencePeriod } from "@/domain/entities/recurring-bill";

export function useRecurringBills() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["recurring-bills", user?.id],
    queryFn: () => container.recurringBills.list(user!.id),
    enabled: Boolean(user),
  });
}

export function useCreateRecurringBill() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      name: string;
      categoryId: string;
      amountCents: number;
      period: RecurrencePeriod;
      nextOccurrence: Date;
      remainingOccurrences?: number;
    }) => container.recurringBills.create({ userId: user!.id, ...input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["recurring-bills", user?.id] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard-summary", user?.id] });
    },
  });
}

export function useDeactivateRecurringBill() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (billId: string) => container.recurringBills.deactivate(billId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["recurring-bills", user?.id] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard-summary", user?.id] });
    },
  });
}
