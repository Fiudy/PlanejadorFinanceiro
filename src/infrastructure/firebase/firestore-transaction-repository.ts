import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";
import type { TransactionProps } from "@/domain/entities/transaction";
import { Transaction } from "@/domain/entities/transaction";
import type { TransactionFilters, TransactionRepository } from "@/domain/repositories/repositories";
import { getFirestoreDb } from "./firebase-config";

type TransactionDoc = Omit<TransactionProps, "id" | "date" | "dueDate" | "plannedDate" | "settledAt" | "createdAt"> & { date: string; dueDate?: string; plannedDate?: string; settledAt?: string; createdAt: string };

const COLLECTION = "transactions";

function toDomain(id: string, data: TransactionDoc): Transaction {
  return Transaction.fromProps({ ...data, id, date: new Date(data.date), dueDate: data.dueDate ? new Date(data.dueDate) : undefined, plannedDate: data.plannedDate ? new Date(data.plannedDate) : undefined, settledAt: data.settledAt ? new Date(data.settledAt) : undefined, createdAt: new Date(data.createdAt) });
}

export class FirestoreTransactionRepository implements TransactionRepository {
  async findAllByUser(userId: string, filters?: TransactionFilters): Promise<Transaction[]> {
    const q = query(collection(getFirestoreDb(), COLLECTION), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    let items = snapshot.docs.map((d) => toDomain(d.id, d.data() as TransactionDoc));

    if (filters?.accountId) items = items.filter((t) => t.accountId === filters.accountId);
    if (filters?.categoryId) items = items.filter((t) => t.categoryId === filters.categoryId);
    if (filters?.type) items = items.filter((t) => t.type === filters.type);
    if (filters?.from) items = items.filter((t) => t.date >= filters.from!);
    if (filters?.to) items = items.filter((t) => t.date <= filters.to!);

    return items.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async findById(id: string): Promise<Transaction | null> {
    const snapshot = await getDoc(doc(getFirestoreDb(), COLLECTION, id));
    return snapshot.exists() ? toDomain(id, snapshot.data() as TransactionDoc) : null;
  }

  async save(transaction: Transaction): Promise<void> {
    const props = transaction.toProps();
    const { id, date, dueDate, plannedDate, settledAt, createdAt, ...rest } = props;
    const payload = {
      ...rest,
      date: date.toISOString(),
      ...(dueDate ? { dueDate: dueDate.toISOString() } : {}),
      ...(plannedDate ? { plannedDate: plannedDate.toISOString() } : {}),
      ...(settledAt ? { settledAt: settledAt.toISOString() } : {}),
      createdAt: createdAt.toISOString(),
    };
    await setDoc(doc(getFirestoreDb(), COLLECTION, id), Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined)));
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(getFirestoreDb(), COLLECTION, id));
  }
}
