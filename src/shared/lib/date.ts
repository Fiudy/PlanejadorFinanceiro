export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function isSameDay(a: Date, b: Date): boolean {
  return isSameMonth(a, b) && a.getDate() === b.getDate();
}

/**
 * Soma meses preservando o dia quando possível. `setMonth` puro estoura para
 * o mês seguinte quando o mês de destino é mais curto (ex: 31/jan + 1 mês
 * vira 03/mar em vez de 28/fev), o que fazia contas fixas com vencimento no
 * fim do mês "sumirem" em alguns meses. Aqui o dia é sempre limitado ao
 * último dia do mês de destino.
 */
export function addMonths(date: Date, months: number): Date {
  const day = date.getDate();
  const result = new Date(date);
  result.setDate(1);
  result.setMonth(result.getMonth() + months);
  const lastDayOfTargetMonth = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(day, lastDayOfTargetMonth));
  return result;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function monthLabel(date: Date, locale = "pt-BR"): string {
  return new Intl.DateTimeFormat(locale, { month: "short", year: "2-digit" }).format(date);
}

export function monthLabelLong(date: Date, locale = "pt-BR"): string {
  return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(date);
}

export function formatDate(date: Date, locale = "pt-BR"): string {
  return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}
