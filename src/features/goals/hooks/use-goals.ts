import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/app/auth-context";
import { container } from "@/infrastructure/di/container";
import type { GoalKind } from "@/domain/entities/goal";

export function useGoals() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["goals", user?.id],
    queryFn: () => container.goals.list(user!.id),
    enabled: Boolean(user),
  });
}

export function useCreateGoal() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      name: string;
      kind: GoalKind;
      color: string;
      icon: string;
      targetAmountCents: number;
      targetDate?: Date;
    }) => container.goals.create({ userId: user!.id, ...input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["goals", user?.id] });
    },
  });
}

export function useContributeToGoal() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ goalId, amountCents }: { goalId: string; amountCents: number }) =>
      container.goals.contribute(goalId, amountCents),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["goals", user?.id] });
    },
  });
}

export function useRemoveGoal() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (goalId: string) => container.goals.remove(goalId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["goals", user?.id] });
    },
  });
}
