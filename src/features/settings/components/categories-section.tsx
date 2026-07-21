import { useState } from "react";
import { Plus, Tags, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { EmptyState } from "@/shared/ui/empty-state";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { useCategories, useRemoveCategory } from "../hooks/use-categories";
import { CategoryFormDialog } from "./category-form-dialog";
import type { Category } from "@/domain/entities/category";

export function CategoriesSection() {
  const { data: categories = [] } = useCategories();
  const removeCategory = useRemoveCategory();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Categorias</CardTitle>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          Nova
        </Button>
      </CardHeader>

      {categories.length === 0 ? (
        <EmptyState icon={Tags} title="Nenhuma categoria" description="Crie categorias para organizar seus lançamentos." />
      ) : (
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Badge key={category.id} tone={category.kind === "receita" ? "accent" : "muted"} className="gap-1.5 py-1.5 pl-3 pr-1.5">
              {category.name}
              {!category.isDefault && (
                <button
                  onClick={() => setPendingDelete(category)}
                  aria-label={`Remover categoria ${category.name}`}
                  className="rounded-full p-0.5 hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}

      <CategoryFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />

      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return;
          removeCategory.mutate(pendingDelete.id, { onSuccess: () => setPendingDelete(null) });
        }}
        title="Remover categoria"
        description={`Lançamentos que já usam "${pendingDelete?.name ?? ""}" ficarão sem categoria. Deseja continuar?`}
        confirmLabel="Remover"
        isLoading={removeCategory.isPending}
      />
    </Card>
  );
}
