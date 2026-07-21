import type { CardProps, CardPurchaseProps } from "@/domain/entities/card";
import { Card, CardPurchase } from "@/domain/entities/card";
import type { CardRepository } from "@/domain/repositories/repositories";
import { localStorageClient } from "./local-storage-client";

type CardDto = Omit<CardProps, "createdAt"> & { createdAt: string };
type PurchaseDto = Omit<CardPurchaseProps, "firstInstallmentDate" | "createdAt"> & {
  firstInstallmentDate: string;
  createdAt: string;
};

const CARDS = "cards";
const PURCHASES = "card_purchases";

const cardToDto = (card: Card): CardDto => {
  const props = card.toProps();
  return { ...props, createdAt: props.createdAt.toISOString() };
};
const cardToDomain = (dto: CardDto): Card => Card.fromProps({ ...dto, createdAt: new Date(dto.createdAt) });

const purchaseToDto = (purchase: CardPurchase): PurchaseDto => {
  const props = purchase.toProps();
  return {
    ...props,
    firstInstallmentDate: props.firstInstallmentDate.toISOString(),
    createdAt: props.createdAt.toISOString(),
  };
};
const purchaseToDomain = (dto: PurchaseDto): CardPurchase =>
  CardPurchase.fromProps({
    ...dto,
    firstInstallmentDate: new Date(dto.firstInstallmentDate),
    createdAt: new Date(dto.createdAt),
  });

export class LocalCardRepository implements CardRepository {
  async findAllByUser(userId: string): Promise<Card[]> {
    return localStorageClient
      .readAll<CardDto>(CARDS)
      .filter((dto) => dto.userId === userId)
      .map(cardToDomain);
  }

  async findById(id: string): Promise<Card | null> {
    const dto = localStorageClient.readAll<CardDto>(CARDS).find((item) => item.id === id);
    return dto ? cardToDomain(dto) : null;
  }

  async save(card: Card): Promise<void> {
    localStorageClient.upsert(CARDS, cardToDto(card));
  }

  async delete(id: string): Promise<void> {
    localStorageClient.remove(CARDS, id);
    const purchases = localStorageClient.readAll<PurchaseDto>(PURCHASES).filter((p) => p.cardId === id);
    for (const purchase of purchases) localStorageClient.remove(PURCHASES, purchase.id);
  }

  async findPurchasesByCard(cardId: string, userId: string): Promise<CardPurchase[]> {
    return localStorageClient
      .readAll<PurchaseDto>(PURCHASES)
      .filter((dto) => dto.cardId === cardId && dto.userId === userId)
      .map(purchaseToDomain);
  }

  async savePurchase(purchase: CardPurchase): Promise<void> {
    localStorageClient.upsert(PURCHASES, purchaseToDto(purchase));
  }

  async deletePurchase(id: string): Promise<void> {
    localStorageClient.remove(PURCHASES, id);
  }
}
