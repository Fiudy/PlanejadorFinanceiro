import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";
import type { GoalProps } from "@/domain/entities/goal";
import { Goal } from "@/domain/entities/goal";
import type { GoalRepository } from "@/domain/repositories/repositories";
import { getFirestoreDb } from "./firebase-config";

type GoalDoc = Omit<GoalProps, "id" | "targetDate" | "createdAt"> & { targetDate?: string; createdAt: string };

const COLLECTION = "goals";

const toDomain = (id: string, data: GoalDoc): Goal =>
  Goal.fromProps({
    ...data,
    id,
    targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
    createdAt: new Date(data.createdAt),
  });

export class FirestoreGoalRepository implements GoalRepository {
  async findAllByUser(userId: string): Promise<Goal[]> {
    const q = query(collection(getFirestoreDb(), COLLECTION), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => toDomain(d.id, d.data() as GoalDoc));
  }

  async findById(id: string): Promise<Goal | null> {
    const snapshot = await getDoc(doc(getFirestoreDb(), COLLECTION, id));
    return snapshot.exists() ? toDomain(id, snapshot.data() as GoalDoc) : null;
  }

  async save(goal: Goal): Promise<void> {
    const { id, targetDate, createdAt, ...rest } = goal.toProps();
    await setDoc(doc(getFirestoreDb(), COLLECTION, id), {
      ...rest,
      targetDate: targetDate?.toISOString() ?? null,
      createdAt: createdAt.toISOString(),
    });
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(getFirestoreDb(), COLLECTION, id));
  }
}
