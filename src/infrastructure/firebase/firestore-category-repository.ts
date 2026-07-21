import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, where, writeBatch } from "firebase/firestore";
import type { CategoryProps } from "@/domain/entities/category";
import { Category } from "@/domain/entities/category";
import type { CategoryRepository } from "@/domain/repositories/repositories";
import { getFirestoreDb } from "./firebase-config";

const COLLECTION = "categories";

export class FirestoreCategoryRepository implements CategoryRepository {
  async findAllByUser(userId: string): Promise<Category[]> {
    const q = query(collection(getFirestoreDb(), COLLECTION), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => Category.fromProps({ ...(d.data() as CategoryProps), id: d.id }));
  }

  async findById(id: string): Promise<Category | null> {
    const snapshot = await getDoc(doc(getFirestoreDb(), COLLECTION, id));
    return snapshot.exists() ? Category.fromProps({ ...(snapshot.data() as CategoryProps), id }) : null;
  }

  async save(category: Category): Promise<void> {
    const { id, ...rest } = category.toProps();
    await setDoc(doc(getFirestoreDb(), COLLECTION, id), rest);
  }

  async saveMany(categories: Category[]): Promise<void> {
    const batch = writeBatch(getFirestoreDb());
    for (const category of categories) {
      const { id, ...rest } = category.toProps();
      batch.set(doc(getFirestoreDb(), COLLECTION, id), rest);
    }
    await batch.commit();
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(getFirestoreDb(), COLLECTION, id));
  }
}
