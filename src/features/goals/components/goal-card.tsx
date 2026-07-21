import { useState } from "react";
import { Trash2 } from "lucide-react";
import type { Goal} from "@/domain/entities/goal";
import { GOAL_KIND_LABELS } from "@/domain/entities/goal";
import { Card } from "@/shared/ui/card";
import { ProgressBar } from "@/shared/ui/progress-bar";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { resolveIcon } from "@/shared/ui/icon-map";
import { useContributeToGoal, useRemoveGoal } from "../hooks/use-goals";

export function GoalCard({ goal }: { goal: Goal }) {
  const [amount, setAmount] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const contribute = useContributeToGoal();
  const removeGoal = useRemoveGoal();
  const Icon = resolveIcon(goal.icon);

  const handleContribute = () => {
    const value = Number(amount.replace(",", "."));
    if (!value || value <= 0) return;
    contribute.mutate({ goalId: goal.id, amountCents: Math.round(value * 100) });
    setAmount("");
  };

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: `${goal.color}1A`, color: goal.color }}
          >
            <Icon className="h-4.5 w-4.5" />
          </div>
          <div>
            <p className="font-medium text-ink-950 dark:text-paper-50">{goal.name}</p>
            <p className="text-xs text-muted-500">{GOAL_KIND_LABELS[goal.kind]}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" aria-label="Remover meta" onClick={() => setConfirmOpen(true)}>
          <Trash2 className="h-4 w-4 text-muted-500" />
        </Button>
      </div>

      <div className="mt-4">
        <div className="flex items-baseline justify-between text-sm">
          <span className="tabular font-semibold text-ink-950 dark:text-paper-50">{goal.currentAmount.format()}</span>
          <span className="tabular text-muted-500">de {goal.targetAmount.format()}</span>
        </div>
        <ProgressBar value={goal.progress.value} className="mt-2" tone={goal.isCompleted ? "accent" : "accent"} />
      </div>

      {!goal.isCompleted && (
        <div className="mt-4 flex gap-2">
          <Input
            placeholder="Valor a adicionar"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            inputMode="decimal"
          />
          <Button variant="secondary" onClick={handleContribute}>
            Adicionar
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => removeGoal.mutate(goal.id, { onSuccess: () => setConfirmOpen(false) })}
        title="Remover meta"
        description={`Tem certeza que deseja remover a meta "${goal.name}"? O valor já guardado não será estornado para nenhuma conta.`}
        confirmLabel="Remover"
        isLoading={removeGoal.isPending}
      />
    </Card>
  );
}
