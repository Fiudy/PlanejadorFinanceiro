/** Value Object para percentuais — sempre representado como razão 0..1 internamente. */
export class Percentage {
  private readonly ratio: number;

  private constructor(ratio: number) {
    this.ratio = ratio;
  }

  static fromRatio(ratio: number): Percentage {
    return new Percentage(ratio);
  }

  static fromParts(numerator: number, denominator: number): Percentage {
    if (denominator === 0) return new Percentage(0);
    return new Percentage(numerator / denominator);
  }

  get value(): number {
    return this.ratio;
  }

  toDisplayString(fractionDigits = 0): string {
    return `${(this.ratio * 100).toFixed(fractionDigits)}%`;
  }

  clampToUnit(): Percentage {
    return new Percentage(Math.min(1, Math.max(0, this.ratio)));
  }
}
