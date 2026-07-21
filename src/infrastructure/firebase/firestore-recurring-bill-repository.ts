import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";
import type { RecurringBillProps } from "@/domain/entities/recurring-bill";
import { RecurringBill } from "@/domain/entities/recurring-bill";
import type { RecurringBillRepository } from "@/domain/repositories/repositories";
import { getFirestoreDb } from "./firebase-config";

type BillDoc = Omit<RecurringBillProps, "id" | "nextOccurrence" | "createdAt" | "remainingOccurrences"> & {
  nextOccurrence: string;
  createdAt: string;
  remainingOccurrences?: number | null;
};

const COLLECTION = "recurringBills";

const toDomain = (id: string, data: BillDoc): RecurringBill =>
  RecurringBill.fromProps({
    ...data,
    id,
    nextOccurrence: new Date(data.nextOccurrence),
    createdAt: new Date(data.createdAt),
    remainingOccurrences: data.remainingOccurrences ?? undefined,
  });

export class FirestoreRecurringBillRepository implements RecurringBillRepository {
  async findAllByUser(userId: string): Promise<RecurringBill[]> {
    const q = query(collection(getFirestoreDb(), COLLECTION), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => toDomain(d.id, d.data() as BillDoc));
  }

  async findById(id: string): Promise<RecurringBill | null> {
    const snapshot = await getDoc(doc(getFirestoreDb(), COLLECTION, id));
    return snapshot.exists() ? toDomain(id, snapshot.data() as BillDoc) : null;
  }

  async save(bill: RecurringBill): Promise<void> {
    const { id, nextOccurrence, createdAt, ...rest } = bill.toProps();
    await setDoc(doc(getFirestoreDb(), COLLECTION, id), {
      ...rest,
      nextOccurrence: nextOccurrence.toISOString(),
      createdAt: createdAt.toISOString(),
    });
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(getFirestoreDb(), COLLECTION, id));
  }
}
