import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/app/auth-context";
import { container } from "@/infrastructure/di/container";

export function useSpendingAnomalies() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["spending-anomalies", user?.id],
    queryFn: () => container.spendingAnomaly.detect(user!.id),
    enabled: Boolean(user),
  });
}
