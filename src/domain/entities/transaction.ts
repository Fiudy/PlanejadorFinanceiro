import { Money } from "../value-objects/money";

export type TransactionType = "receita" | "despesa";

export interface TransactionProps {
  id: string;
  userId: string;
  accountId: string;
  categoryId: string;
  type: TransactionType;
  amountCents: number;
  description: string;
  date: Date;
  cardPurchaseId?: string;
  createdAt: Date;
}

export class Transaction {
  private constructor(private readonly props: TransactionProps) {}

  static create(
    props: Omit<TransactionProps, "createdAt"> & { createdAt?: Date },
  ): Transaction {
    if (props.amountCents <= 0) {
      throw new Error("O valor da transação deve ser maior que zero.");
    }
    if (!props.description.trim()) {
      throw new Error("A descrição da transação é obrigatória.");
    }
    return new Transaction({ ...props, createdAt: props.createdAt ?? new Date() });
  }

  static fromProps(props: TransactionProps): Transaction {
    return new Transaction(props);
  }

  get id() {
    return this.props.id;
  }
  get userId() {
    return this.props.userId;
  }
  get accountId() {
    return this.props.accountId;
  }
  get categoryId() {
    return this.props.categoryId;
  }
  get type() {
    return this.props.type;
  }
  get amount() {
    return Money.fromCents(this.props.amountCents);
  }
  get description() {
    return this.props.description;
  }
  get date() {
    return this.props.date;
  }
  get cardPurchaseId() {
    return this.props.cardPurchaseId;
  }

  /** Impacto no saldo da conta: receita soma, despesa subtrai. */
  get signedAmount(): Money {
    return this.type === "receita" ? this.amount : this.amount.multiply(-1);
  }

  update(props: {
    accountId: string;
    categoryId: string;
    type: TransactionType;
    amountCents: number;
    description: string;
    date: Date;
  }): Transaction {
    if (props.amountCents <= 0) {
      throw new Error("O valor da transação deve ser maior que zero.");
    }
    if (!props.description.trim()) {
      throw new Error("A descrição da transação é obrigatória.");
    }
    return new Transaction({ ...this.props, ...props });
  }

  toProps(): TransactionProps {
    return { ...this.props };
  }
}
