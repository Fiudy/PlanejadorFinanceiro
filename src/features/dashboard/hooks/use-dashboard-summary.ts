import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/app/auth-context";
import { container } from "@/infrastructure/di/container";

export function useDashboardSummary() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["dashboard-summary", user?.id],
    queryFn: () => container.dashboard.getSummary(user!.id),
    enabled: Boolean(user),
  });
}
