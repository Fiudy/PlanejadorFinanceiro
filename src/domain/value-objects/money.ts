/**
 * Value Object para valores monetários.
 * Trabalha internamente em centavos (inteiro) para evitar erros de
 * arredondamento de ponto flutuante — nunca opere com "reais" em float
 * fora desta classe.
 */
export class Money {
  private readonly cents: number;

  private constructor(cents: number) {
    this.cents = Math.round(cents);
  }

  static fromReais(value: number): Money {
    return new Money(value * 100);
  }

  static fromCents(cents: number): Money {
    return new Money(cents);
  }

  static zero(): Money {
    return new Money(0);
  }

  get reais(): number {
    return this.cents / 100;
  }

  get inCents(): number {
    return this.cents;
  }

  add(other: Money): Money {
    return new Money(this.cents + other.cents);
  }

  subtract(other: Money): Money {
    return new Money(this.cents - other.cents);
  }

  multiply(factor: number): Money {
    return new Money(this.cents * factor);
  }

  isNegative(): boolean {
    return this.cents < 0;
  }

  isPositive(): boolean {
    return this.cents > 0;
  }

  isZero(): boolean {
    return this.cents === 0;
  }

  compareTo(other: Money): number {
    return this.cents - other.cents;
  }

  format(currency: string = "BRL", locale: string = "pt-BR"): string {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(this.reais);
  }
}
