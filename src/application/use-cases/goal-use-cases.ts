import { randomId } from "@/shared/lib/id";
import type { GoalKind } from "@/domain/entities/goal";
import { Goal } from "@/domain/entities/goal";
import type { GoalRepository } from "@/domain/repositories/repositories";

export class GoalUseCases {
  constructor(private readonly goals: GoalRepository) {}

  list(userId: string) {
    return this.goals.findAllByUser(userId);
  }

  async create(input: {
    userId: string;
    name: string;
    kind: GoalKind;
    color: string;
    icon: string;
    targetAmountCents: number;
    targetDate?: Date;
  }) {
    const goal = Goal.create({ id: randomId(), ...input });
    await this.goals.save(goal);
    return goal;
  }

  async contribute(goalId: string, amountCents: number) {
    const goal = await this.goals.findById(goalId);
    if (!goal) throw new Error("Meta não encontrada.");
    const updated = goal.contribute(amountCents);
    await this.goals.save(updated);
    return updated;
  }

  async remove(goalId: string) {
    await this.goals.delete(goalId);
  }
}
