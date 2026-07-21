import { Money } from "../value-objects/money";

/**
 * Soma meses limitando o dia ao último dia do mês de destino, evitando o
 * estouro do `setMonth` nativo (ex: 31/jan + 1 mês viraria 03/mar em vez de
 * 28/fev), que fazia a conta fixa pular meses ao avançar.
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

export type RecurrencePeriod = "mensal" | "bimestral" | "trimestral" | "semestral" | "anual";

export const RECURRENCE_MONTHS: Record<RecurrencePeriod, number> = {
  mensal: 1,
  bimestral: 2,
  trimestral: 3,
  semestral: 6,
  anual: 12,
};

export interface RecurringBillProps {
  id: string;
  userId: string;
  name: string;
  categoryId: string;
  amountCents: number;
  period: RecurrencePeriod;
  nextOccurrence: Date;
  active: boolean;
  createdAt: Date;
  /** Quantas ocorrências futuras ainda faltam lançar. `undefined` = repete indefinidamente. */
  remainingOccurrences?: number;
}

export class RecurringBill {
  private constructor(private readonly props: RecurringBillProps) {}

  static create(
    props: Omit<RecurringBillProps, "active" | "createdAt"> & { active?: boolean; createdAt?: Date },
  ): RecurringBill {
    if (!props.name.trim()) throw new Error("O nome da conta fixa é obrigatório.");
    if (props.amountCents <= 0) throw new Error("O valor deve ser maior que zero.");
    return new RecurringBill({
      ...props,
      active: props.active ?? true,
      createdAt: props.createdAt ?? new Date(),
    });
  }

  static fromProps(props: RecurringBillProps): RecurringBill {
    return new RecurringBill(props);
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
  get categoryId() {
    return this.props.categoryId;
  }
  get amount() {
    return Money.fromCents(this.props.amountCents);
  }
  get period() {
    return this.props.period;
  }
  get nextOccurrence() {
    return this.props.nextOccurrence;
  }
  get active() {
    return this.props.active;
  }

  get remainingOccurrences() {
    return this.props.remainingOccurrences;
  }

  isDue(referenceDate: Date = new Date()): boolean {
    return this.props.active && this.props.nextOccurrence <= referenceDate;
  }

  /**
   * Avança para a próxima ocorrência, somando os meses do período. Se a
   * conta tiver um número finito de repetições, decrementa o contador e
   * desativa automaticamente quando ele chega a zero.
   */
  advance(): RecurringBill {
    const next = addMonthsClamped(this.props.nextOccurrence, RECURRENCE_MONTHS[this.props.period]);

    if (this.props.remainingOccurrences === undefined) {
      return new RecurringBill({ ...this.props, nextOccurrence: next });
    }

    const remainingOccurrences = this.props.remainingOccurrences - 1;
    return new RecurringBill({
      ...this.props,
      nextOccurrence: next,
      remainingOccurrences,
      active: remainingOccurrences > 0,
    });
  }

  deactivate(): RecurringBill {
    return new RecurringBill({ ...this.props, active: false });
  }

  toProps(): RecurringBillProps {
    return { ...this.props };
  }
}

/** Sufixo usado na descrição das transações lançadas automaticamente por `runDueBills`. */
export const RECURRING_BILL_TRANSACTION_SUFFIX = " (conta fixa)";

export const RECURRENCE_LABELS: Record<RecurrencePeriod, string> = {
  mensal: "Mensal",
  bimestral: "Bimestral",
  trimestral: "Trimestral",
  semestral: "Semestral",
  anual: "Anual",
};
