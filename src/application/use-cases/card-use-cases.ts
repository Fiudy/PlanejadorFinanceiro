import { randomId } from "@/shared/lib/id";
import type { CardBrand} from "@/domain/entities/card";
import { Card, CardPurchase } from "@/domain/entities/card";
import { Money } from "@/domain/value-objects/money";
import type { CardRepository } from "@/domain/repositories/repositories";
import { isSameMonth, startOfMonth } from "@/shared/lib/date";

export interface CardInvoiceItem {
  purchase: CardPurchase;
  installmentNumber: number;
  installmentsCount: number;
  installmentDate: Date;
  amount: Money;
}

export class CardUseCases {
  constructor(private readonly cards: CardRepository) {}

  list(userId: string) {
    return this.cards.findAllByUser(userId);
  }

  async create(input: {
    userId: string;
    name: string;
    holderName?: string;
    logoUrl?: string;
    bank: string;
    color: string;
    brand: CardBrand;
    limitCents: number;
    closingDay: number;
    dueDay: number;
  }) {
    const card = Card.create({ id: randomId(), ...input });
    await this.cards.save(card);
    return card;
  }

  async archive(cardId: string) {
    const card = await this.cards.findById(cardId);
    if (!card) throw new Error("Cartão não encontrado.");
    await this.cards.save(card.archive());
  }

  async update(cardId: string, input: { name: string; holderName?: string; logoUrl?: string; bank: string; color: string; brand: CardBrand; limitCents: number; closingDay: number; dueDay: number }) {
    const card = await this.cards.findById(cardId);
    if (!card) throw new Error("Cartão não encontrado.");
    const updated = card.updateDetails(input);
    await this.cards.save(updated);
    return updated;
  }

  async remove(cardId: string) {
    await this.cards.delete(cardId);
  }

  async addPurchase(input: {
    userId: string;
    cardId: string;
    categoryId: string;
    description: string;
    totalAmountCents: number;
    installmentsCount: number;
    firstInstallmentDate: Date;
  }) {
    const purchase = CardPurchase.create({ id: randomId(), ...input });
    await this.cards.savePurchase(purchase);
    return purchase;
  }

  async removePurchase(purchaseId: string) {
    await this.cards.deletePurchase(purchaseId);
  }

  /** Lista as parcelas de todas as compras de um cartão que caem no mês de referência. */
  async invoiceForMonth(card: Card, referenceDate: Date): Promise<CardInvoiceItem[]> {
    const purchases = await this.cards.findPurchasesByCard(card.id, card.userId);
    const items: CardInvoiceItem[] = [];

    for (const purchase of purchases) {
      purchase.installmentDates().forEach((date, index) => {
        if (isSameMonth(date, referenceDate)) {
          items.push({
            purchase,
            installmentNumber: index + 1,
            installmentsCount: purchase.installmentsCount,
            installmentDate: date,
            amount: purchase.installmentAmount,
          });
        }
      });
    }

    return items.sort((a, b) => a.installmentDate.getTime() - b.installmentDate.getTime());
  }

  /** Limite disponível = limite total − saldo em aberto (parcelas do mês atual em diante). */
  async availableLimit(card: Card): Promise<Money> {
    const purchases = await this.cards.findPurchasesByCard(card.id, card.userId);
    const monthStart = startOfMonth(new Date());

    let outstandingCents = 0;
    for (const purchase of purchases) {
      purchase.installmentDates().forEach((date) => {
        if (date >= monthStart) {
          outstandingCents += purchase.installmentAmount.inCents;
        }
      });
    }

    return card.limit.subtract(Money.fromCents(outstandingCents));
  }
}
