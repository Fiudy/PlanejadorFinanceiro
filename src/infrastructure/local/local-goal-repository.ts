import type { GoalProps } from "@/domain/entities/goal";
import { Goal } from "@/domain/entities/goal";
import type { GoalRepository } from "@/domain/repositories/repositories";
import { localStorageClient } from "./local-storage-client";

type GoalDto = Omit<GoalProps, "targetDate" | "createdAt"> & { targetDate?: string; createdAt: string };

const COLLECTION = "goals";

const toDto = (goal: Goal): GoalDto => {
  const props = goal.toProps();
  return { ...props, targetDate: props.targetDate?.toISOString(), createdAt: props.createdAt.toISOString() };
};
const toDomain = (dto: GoalDto): Goal =>
  Goal.fromProps({
    ...dto,
    targetDate: dto.targetDate ? new Date(dto.targetDate) : undefined,
    createdAt: new Date(dto.createdAt),
  });

export class LocalGoalRepository implements GoalRepository {
  async findAllByUser(userId: string): Promise<Goal[]> {
    return localStorageClient
      .readAll<GoalDto>(COLLECTION)
      .filter((dto) => dto.userId === userId)
      .map(toDomain);
  }

  async findById(id: string): Promise<Goal | null> {
    const dto = localStorageClient.readAll<GoalDto>(COLLECTION).find((item) => item.id === id);
    return dto ? toDomain(dto) : null;
  }

  async save(goal: Goal): Promise<void> {
    localStorageClient.upsert(COLLECTION, toDto(goal));
  }

  async delete(id: string): Promise<void> {
    localStorageClient.remove(COLLECTION, id);
  }
}
