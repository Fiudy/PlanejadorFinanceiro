import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";
import type { CardProps, CardPurchaseProps } from "@/domain/entities/card";
import { Card, CardPurchase } from "@/domain/entities/card";
import type { CardRepository } from "@/domain/repositories/repositories";
import { getFirestoreDb } from "./firebase-config";

type CardDoc = Omit<CardProps, "id" | "createdAt"> & { createdAt: string };
type PurchaseDoc = Omit<CardPurchaseProps, "id" | "firstInstallmentDate" | "createdAt"> & {
  firstInstallmentDate: string;
  createdAt: string;
};

const CARDS = "cards";
const PURCHASES = "cardPurchases";

const cardToDomain = (id: string, data: CardDoc): Card =>
  Card.fromProps({ ...data, id, createdAt: new Date(data.createdAt) });

const purchaseToDomain = (id: string, data: PurchaseDoc): CardPurchase =>
  CardPurchase.fromProps({
    ...data,
    id,
    firstInstallmentDate: new Date(data.firstInstallmentDate),
    createdAt: new Date(data.createdAt),
  });

export class FirestoreCardRepository implements CardRepository {
  async findAllByUser(userId: string): Promise<Card[]> {
    const q = query(collection(getFirestoreDb(), CARDS), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => cardToDomain(d.id, d.data() as CardDoc));
  }

  async findById(id: string): Promise<Card | null> {
    const snapshot = await getDoc(doc(getFirestoreDb(), CARDS, id));
    return snapshot.exists() ? cardToDomain(id, snapshot.data() as CardDoc) : null;
  }

  async save(card: Card): Promise<void> {
    const { id, createdAt, ...rest } = card.toProps();
    const payload = { ...rest, createdAt: createdAt.toISOString() };
    await setDoc(doc(getFirestoreDb(), CARDS, id), Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined)));
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(getFirestoreDb(), CARDS, id));
  }

  async findPurchasesByCard(cardId: string, userId: string): Promise<CardPurchase[]> {
    const q = query(
      collection(getFirestoreDb(), PURCHASES),
      where("cardId", "==", cardId),
      where("userId", "==", userId),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => purchaseToDomain(d.id, d.data() as PurchaseDoc));
  }

  async savePurchase(purchase: CardPurchase): Promise<void> {
    const { id, firstInstallmentDate, createdAt, ...rest } = purchase.toProps();
    await setDoc(doc(getFirestoreDb(), PURCHASES, id), {
      ...rest,
      firstInstallmentDate: firstInstallmentDate.toISOString(),
      createdAt: createdAt.toISOString(),
    });
  }

  async deletePurchase(id: string): Promise<void> {
    await deleteDoc(doc(getFirestoreDb(), PURCHASES, id));
  }
}
