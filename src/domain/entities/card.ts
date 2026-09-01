import { Money } from "../value-objects/money";

/**
 * Soma meses limitando o dia ao último dia do mês de destino, evitando o
 * estouro do `setMonth` nativo (ex: 31/jan + 1 mês viraria 03/mar em vez de
 * 28/fev), que fazia parcelas de compras feitas no fim do mês pularem meses.
 */
function addMonthsClamped(date: Date, months: number): Date {
  const day = date.getDate();
  const result = new Date(date);
  result.setDate(1);
  result.setMonth(result.getMonth() + months);
  const lastDayOfTargetMonth = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(day, lastDayOfTargetMonth));
  return result;
}

export type CardBrand = "visa" | "mastercard" | "elo" | "amex" | "outra";

export interface CardProps {
  id: string;
  userId: string;
  name: string;
  holderName?: string;
  logoUrl?: string;
  bank: string;
  color: string;
  brand: CardBrand;
  limitCents: number;
  closingDay: number; // 1-28
  dueDay: number; // 1-28
  archived: boolean;
  createdAt: Date;
}

export class Card {
  private constructor(private readonly props: CardProps) {}

  static create(
    props: Omit<CardProps, "archived" | "createdAt"> & { createdAt?: Date },
  ): Card {
    if (!props.name.trim()) throw new Error("O nome do cartão é obrigatório.");
    if (props.limitCents <= 0) throw new Error("O limite do cartão deve ser maior que zero.");
    if (props.closingDay < 1 || props.closingDay > 28) {
      throw new Error("O dia de fechamento deve estar entre 1 e 28.");
    }
    if (props.dueDay < 1 || props.dueDay > 28) {
      throw new Error("O dia de vencimento deve estar entre 1 e 28.");
    }
    return new Card({ ...props, archived: false, createdAt: props.createdAt ?? new Date() });
  }

  static fromProps(props: CardProps): Card {
    return new Card(props);
  }

  get id() {
    return this.props.id;
  }
  get userId() {
    return this.props.userId;
  }
  get name() {
    return this.props.name;
  }
  get bank() {
    return this.props.bank;
  }
  get holderName() {
    return this.props.holderName ?? "";
  }
  get logoUrl() {
    return this.props.logoUrl ?? "";
  }
  get color() {
    return this.props.color;
  }
  get brand() {
    return this.props.brand;
  }
  get limit() {
    return Money.fromCents(this.props.limitCents);
  }
  get closingDay() {
    return this.props.closingDay;
  }
  get dueDay() {
    return this.props.dueDay;
  }
  get archived() {
    return this.props.archived;
  }

  updateDetails(input: { name: string; holderName?: string; logoUrl?: string; bank: string; color: string; brand: CardBrand; limitCents: number; closingDay: number; dueDay: number }): Card {
    return Card.create({ ...this.props, ...input, createdAt: this.props.createdAt });
  }

  archive(): Card {
    return new Card({ ...this.props, archived: true });
  }

  toProps(): CardProps {
    return { ...this.props };
  }
}

export interface CardPurchaseProps {
  id: string;
  cardId: string;
  userId: string;
  categoryId: string;
  description: string;
  totalAmountCents: number;
  installmentsCount: number;
  firstInstallmentDate: Date;
  createdAt: Date;
}

export class CardPurchase {
  private constructor(private readonly props: CardPurchaseProps) {}

  static create(
    props: Omit<CardPurchaseProps, "createdAt"> & { createdAt?: Date },
  ): CardPurchase {
    if (props.totalAmountCents <= 0) {
      throw new Error("O valor da compra deve ser maior que zero.");
    }
    if (props.installmentsCount < 1 || props.installmentsCount > 48) {
      throw new Error("Quantidade de parcelas inválida.");
    }
    return new CardPurchase({ ...props, createdAt: props.createdAt ?? new Date() });
  }

  static fromProps(props: CardPurchaseProps): CardPurchase {
    return new CardPurchase(props);
  }

  get id() {
    return this.props.id;
  }
  get cardId() {
    return this.props.cardId;
  }
  get userId() {
    return this.props.userId;
  }
  get categoryId() {
    return this.props.categoryId;
  }
  get description() {
    return this.props.description;
  }
  get installmentsCount() {
    return this.props.installmentsCount;
  }
  get firstInstallmentDate() {
    return this.props.firstInstallmentDate;
  }

  get totalAmount(): Money {
    return Money.fromCents(this.props.totalAmountCents);
  }

  get installmentAmount(): Money {
    return Money.fromCents(Math.round(this.props.totalAmountCents / this.props.installmentsCount));
  }

  /** Gera as datas de vencimento de cada parcela, uma por mês a partir da primeira. */
  installmentDates(): Date[] {
    return Array.from({ length: this.props.installmentsCount }, (_, index) =>
      addMonthsClamped(this.props.firstInstallmentDate, index),
    );
  }

  toProps(): CardPurchaseProps {
    return { ...this.props };
  }
}

export const CARD_BRAND_LABELS: Record<CardBrand, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  elo: "Elo",
  amex: "American Express",
  outra: "Outra",
};
