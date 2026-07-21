import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/app/auth-context";
import { container } from "@/infrastructure/di/container";

export function useUserPreferences() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user-preferences", user?.id],
    queryFn: () => container.userPreferences.getPreferences(user!.id),
    enabled: Boolean(user),
  });
}

export function useSetMonthlyExpenseLimit() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (amountCents: number | null) =>
      container.userPreferences.setMonthlyExpenseLimit({
        userId: user!.id,
        name: user!.name,
        email: user!.email,
        amountCents,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["user-preferences", user?.id] });
    },
  });
}
