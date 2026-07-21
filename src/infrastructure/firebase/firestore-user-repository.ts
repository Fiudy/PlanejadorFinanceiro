import { doc, getDoc, setDoc } from "firebase/firestore";
import type { UserProps } from "@/domain/entities/user";
import { User } from "@/domain/entities/user";
import type { UserRepository } from "@/domain/repositories/repositories";
import { getFirestoreDb } from "./firebase-config";

const COLLECTION = "users";

export class FirestoreUserRepository implements UserRepository {
  async findById(id: string): Promise<User | null> {
    const snapshot = await getDoc(doc(getFirestoreDb(), COLLECTION, id));
    if (!snapshot.exists()) return null;
    const data = snapshot.data() as Omit<UserProps, "id">;
    return User.create({
      ...data,
      id,
      preferences: { ...data.preferences, monthlyExpenseLimitCents: data.preferences.monthlyExpenseLimitCents ?? undefined },
    });
  }

  async save(user: User): Promise<void> {
    const { id, preferences, ...rest } = user.toProps();
    await setDoc(doc(getFirestoreDb(), COLLECTION, id), {
      ...rest,
      preferences: {
        ...preferences,
        monthlyExpenseLimitCents: preferences.monthlyExpenseLimitCents ?? null,
      },
    });
  }
}
