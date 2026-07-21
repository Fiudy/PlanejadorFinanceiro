import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/app/auth-context";
import { container } from "@/infrastructure/di/container";
import type { CategoryKind } from "@/domain/entities/category";

export function useCategories(kind?: CategoryKind) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["categories", user?.id],
    queryFn: () => container.categories.list(user!.id),
    enabled: Boolean(user),
    select: (categories) => (kind ? categories.filter((c) => c.kind === kind) : categories),
  });
}

export function useCreateCategory() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { name: string; kind: CategoryKind; color: string; icon: string }) =>
      container.categories.create({ userId: user!.id, ...input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["categories", user?.id] });
    },
  });
}

export function useRemoveCategory() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryId: string) => container.categories.remove(categoryId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["categories", user?.id] });
    },
  });
}
