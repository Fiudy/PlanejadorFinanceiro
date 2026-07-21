import { useState } from "react";
import { Plus, Target } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { PageSpinner } from "@/shared/ui/spinner";
import { useGoals } from "../hooks/use-goals";
import { GoalCard } from "./goal-card";
import { GoalFormDialog } from "./goal-form-dialog";

export function GoalsPage() {
  const { data: goals, isLoading } = useGoals();
  const [dialogOpen, setDialogOpen] = useState(false);

  if (isLoading) return <PageSpinner />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-950 dark:text-paper-50">Metas</h1>
          <p className="text-sm text-muted-500">Reserve dinheiro para o que importa.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Meta
        </Button>
      </div>

      {(goals ?? []).length === 0 ? (
        <EmptyState
          icon={Target}
          title="Nenhuma meta ainda"
          description="Crie uma meta de reserva, viagem ou o que você estiver planejando."
          action={<Button onClick={() => setDialogOpen(true)}>Criar meta</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {goals!.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}

      <GoalFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
