import { Money } from "../value-objects/money";
import { Percentage } from "../value-objects/percentage";

export type GoalKind = "reserva" | "viagem" | "carro" | "casa" | "investimento" | "outro";

export interface GoalProps {
  id: string;
  userId: string;
  name: string;
  kind: GoalKind;
  color: string;
  icon: string;
  targetAmountCents: number;
  currentAmountCents: number;
  targetDate?: Date;
  createdAt: Date;
}

export class Goal {
  private constructor(private readonly props: GoalProps) {}

  static create(
    props: Omit<GoalProps, "currentAmountCents" | "createdAt"> & {
      currentAmountCents?: number;
      createdAt?: Date;
    },
  ): Goal {
    if (!props.name.trim()) throw new Error("O nome da meta é obrigatório.");
    if (props.targetAmountCents <= 0) throw new Error("O valor alvo deve ser maior que zero.");
    return new Goal({
      ...props,
      currentAmountCents: props.currentAmountCents ?? 0,
      createdAt: props.createdAt ?? new Date(),
    });
  }

  static fromProps(props: GoalProps): Goal {
    return new Goal(props);
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
  get kind() {
    return this.props.kind;
  }
  get color() {
    return this.props.color;
  }
  get icon() {
    return this.props.icon;
  }
  get targetAmount() {
    return Money.fromCents(this.props.targetAmountCents);
  }
  get currentAmount() {
    return Money.fromCents(this.props.currentAmountCents);
  }
  get targetDate() {
    return this.props.targetDate;
  }

  get progress(): Percentage {
    return Percentage.fromParts(this.props.currentAmountCents, this.props.targetAmountCents).clampToUnit();
  }

  get isCompleted(): boolean {
    return this.props.currentAmountCents >= this.props.targetAmountCents;
  }

  contribute(amountCents: number): Goal {
    if (amountCents <= 0) throw new Error("O valor de contribuição deve ser maior que zero.");
    return new Goal({ ...this.props, currentAmountCents: this.props.currentAmountCents + amountCents });
  }

  toProps(): GoalProps {
    return { ...this.props };
  }
}

export const GOAL_KIND_LABELS: Record<GoalKind, string> = {
  reserva: "Reserva de emergência",
  viagem: "Viagem",
  carro: "Carro",
  casa: "Casa",
  investimento: "Investimento",
  outro: "Outro",
};
