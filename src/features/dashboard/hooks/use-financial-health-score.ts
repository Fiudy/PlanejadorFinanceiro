import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/app/auth-context";
import { container } from "@/infrastructure/di/container";

export function useFinancialHealthScore() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["financial-health-score", user?.id],
    queryFn: () => container.financialHealthScore.calculate(user!.id),
    enabled: Boolean(user),
  });
}
