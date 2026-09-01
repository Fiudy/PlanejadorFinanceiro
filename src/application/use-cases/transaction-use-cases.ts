import { randomId } from "@/shared/lib/id";
import type { TransactionPriority, TransactionStatus, TransactionType } from "@/domain/entities/transaction";
import { Transaction } from "@/domain/entities/transaction";
import type { TransactionFilters, TransactionRepository } from "@/domain/repositories/repositories";

export class TransactionUseCases {
  constructor(private readonly transactions: TransactionRepository) {}

  list(userId: string, filters?: TransactionFilters) {
    return this.transactions.findAllByUser(userId, filters);
  }

  async create(input: {
    userId: string;
    accountId: string;
    categoryId: string;
    type: TransactionType;
    amountCents: number;
    description: string;
    date: Date;
    dueDate?: Date;
    plannedDate?: Date;
    settledAt?: Date;
    status?: TransactionStatus;
    priority?: TransactionPriority;
    cardId?: string;
    notes?: string;
    cardPurchaseId?: string;
  }) {
    const transaction = Transaction.create({ id: randomId(), ...input });
    await this.transactions.save(transaction);
    return transaction;
  }

  async update(
    transactionId: string,
    input: {
      accountId: string;
      categoryId: string;
      type: TransactionType;
      amountCents: number;
      description: string;
      date: Date;
      dueDate?: Date;
      plannedDate?: Date;
      settledAt?: Date;
      status?: TransactionStatus;
      priority?: TransactionPriority;
      cardId?: string;
      notes?: string;
    },
  ) {
    const existing = await this.transactions.findById(transactionId);
    if (!existing) throw new Error("Transação não encontrada.");
    const updated = existing.update(input);
    await this.transactions.save(updated);
    return updated;
  }

  async remove(transactionId: string) {
    await this.transactions.delete(transactionId);
  }
}
