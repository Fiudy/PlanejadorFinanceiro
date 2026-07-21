import { Money } from "../value-objects/money";

export type AccountType = "corrente" | "poupanca" | "carteira" | "investimento";

export interface AccountProps {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  color: string;
  icon: string;
  initialBalanceCents: number;
  archived: boolean;
  createdAt: Date;
}

export class Account {
  private constructor(private readonly props: AccountProps) {}

  static create(props: Omit<AccountProps, "archived" | "createdAt"> & { createdAt?: Date }): Account {
    if (!props.name.trim()) {
      throw new Error("O nome da conta é obrigatório.");
    }
    return new Account({
      ...props,
      archived: false,
      createdAt: props.createdAt ?? new Date(),
    });
  }

  static fromProps(props: AccountProps): Account {
    return new Account(props);
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
  get type() {
    return this.props.type;
  }
  get color() {
    return this.props.color;
  }
  get icon() {
    return this.props.icon;
  }
  get archived() {
    return this.props.archived;
  }
  get initialBalance() {
    return Money.fromCents(this.props.initialBalanceCents);
  }
  get createdAt() {
    return this.props.createdAt;
  }

  rename(name: string): Account {
    if (!name.trim()) throw new Error("O nome da conta é obrigatório.");
    return new Account({ ...this.props, name });
  }

  update(props: { name: string; type: AccountType; color: string; icon: string; initialBalanceCents: number }): Account {
    if (!props.name.trim()) throw new Error("O nome da conta é obrigatório.");
    return new Account({ ...this.props, ...props });
  }

  archive(): Account {
    return new Account({ ...this.props, archived: true });
  }

  restore(): Account {
    return new Account({ ...this.props, archived: false });
  }

  toProps(): AccountProps {
    return { ...this.props };
  }
}

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  corrente: "Conta corrente",
  poupanca: "Poupança",
  carteira: "Carteira",
  investimento: "Investimento",
};
