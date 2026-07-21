import { randomId } from "@/shared/lib/id";
import type { RecurrencePeriod } from "@/domain/entities/recurring-bill";
import { RecurringBill, RECURRING_BILL_TRANSACTION_SUFFIX } from "@/domain/entities/recurring-bill";
import { Transaction } from "@/domain/entities/transaction";
import type { RecurringBillRepository, TransactionRepository, AccountRepository } from "@/domain/repositories/repositories";
import { isSameDay } from "@/shared/lib/date";

export class RecurringBillUseCases {
  constructor(
    private readonly bills: RecurringBillRepository,
    private readonly transactions: TransactionRepository,
    private readonly accounts: AccountRepository,
  ) {}

  list(userId: string) {
    return this.bills.findAllByUser(userId);
  }

  async create(input: {
    userId: string;
    name: string;
    categoryId: string;
    amountCents: number;
    period: RecurrencePeriod;
    nextOccurrence: Date;
    /** Repetições futuras restantes; omitido = repete indefinidamente. */
    remainingOccurrences?: number;
  }) {
    const bill = RecurringBill.create({ id: randomId(), ...input });
    await this.bills.save(bill);
    return bill;
  }

  async deactivate(billId: string) {
    const bill = await this.bills.findById(billId);
    if (!bill) throw new Error("Conta fixa não encontrada.");
    await this.bills.save(bill.deactivate());
  }

  async remove(billId: string) {
    await this.bills.delete(billId);
  }

  /**
   * Verifica todas as contas fixas do usuário e, para cada uma vencida,
   * lança automaticamente a despesa correspondente e avança para a
   * próxima ocorrência. Roda ao abrir o app (sem necessidade de backend
   * agendado).
   *
   * Idempotente por construção: antes de lançar, confere se já existe uma
   * transação para aquela conta+data (evita duplicar caso a rotina seja
   * chamada mais de uma vez em paralelo) e também limpa duplicatas que já
   * tenham sido criadas por essa mesma condição de corrida no passado.
   */
  async runDueBills(userId: string): Promise<number> {
    const bills = await this.bills.findAllByUser(userId);
    const due = bills.filter((bill) => bill.isDue());

    await this.dedupeFixedBillTransactions(userId);
    if (due.length === 0) return 0;

    const accounts = await this.accounts.findAllByUser(userId);
    const defaultAccount = accounts.find((account) => !account.archived);
    if (!defaultAccount) return 0;

    const existingTransactions = await this.transactions.findAllByUser(userId);
    let processed = 0;

    for (const bill of due) {
      const description = `${bill.name}${RECURRING_BILL_TRANSACTION_SUFFIX}`;
      const alreadyLaunched = existingTransactions.some(
        (t) => t.categoryId === bill.categoryId && t.description === description && isSameDay(t.date, bill.nextOccurrence),
      );

      if (!alreadyLaunched) {
        const transaction = Transaction.create({
          id: randomId(),
          userId,
          accountId: defaultAccount.id,
          categoryId: bill.categoryId,
          type: "despesa",
          amountCents: bill.amount.inCents,
          description,
          date: bill.nextOccurrence,
        });
        await this.transactions.save(transaction);
        // Mantém o snapshot local em dia: se duas contas vencerem juntas
        // nesta mesma chamada, a próxima iteração precisa enxergar esta
        // transação recém-criada para não duplicar.
        existingTransactions.push(transaction);
        processed += 1;
      }

      await this.bills.save(bill.advance());
    }

    return processed;
  }

  /** Remove transações de contas fixas duplicadas (mesma categoria+descrição+data), mantendo a primeira. */
  private async dedupeFixedBillTransactions(userId: string) {
    const transactions = await this.transactions.findAllByUser(userId);
    const seen = new Set<string>();
    for (const transaction of transactions) {
      if (!transaction.description.endsWith(RECURRING_BILL_TRANSACTION_SUFFIX)) continue;
      const key = `${transaction.categoryId}:${transaction.description}:${transaction.date.toDateString()}`;
      if (seen.has(key)) {
        await this.transactions.delete(transaction.id);
      } else {
        seen.add(key);
      }
    }
  }
}
