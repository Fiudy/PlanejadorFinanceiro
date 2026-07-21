import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/app/auth-context";
import { container } from "@/infrastructure/di/container";

export function useCashFlowForecast() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["cash-flow-forecast", user?.id],
    queryFn: () => container.cashFlowForecast.forecast(user!.id),
    enabled: Boolean(user),
  });
}
