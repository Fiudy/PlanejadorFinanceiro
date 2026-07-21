import type { TransactionProps } from "@/domain/entities/transaction";
import { Transaction } from "@/domain/entities/transaction";
import type { TransactionFilters, TransactionRepository } from "@/domain/repositories/repositories";
import { localStorageClient } from "./local-storage-client";

type TransactionDto = Omit<TransactionProps, "date" | "createdAt"> & { date: string; createdAt: string };

const COLLECTION = "transactions";

function toDto(transaction: Transaction): TransactionDto {
  const props = transaction.toProps();
  return { ...props, date: props.date.toISOString(), createdAt: props.createdAt.toISOString() };
}

function toDomain(dto: TransactionDto): Transaction {
  return Transaction.fromProps({ ...dto, date: new Date(dto.date), createdAt: new Date(dto.createdAt) });
}

export class LocalTransactionRepository implements TransactionRepository {
  async findAllByUser(userId: string, filters?: TransactionFilters): Promise<Transaction[]> {
    let items = localStorageClient
      .readAll<TransactionDto>(COLLECTION)
      .filter((dto) => dto.userId === userId)
      .map(toDomain);

    if (filters?.accountId) items = items.filter((t) => t.accountId === filters.accountId);
    if (filters?.categoryId) items = items.filter((t) => t.categoryId === filters.categoryId);
    if (filters?.type) items = items.filter((t) => t.type === filters.type);
    if (filters?.from) items = items.filter((t) => t.date >= filters.from!);
    if (filters?.to) items = items.filter((t) => t.date <= filters.to!);

    return items.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async findById(id: string): Promise<Transaction | null> {
    const dto = localStorageClient.readAll<TransactionDto>(COLLECTION).find((item) => item.id === id);
    return dto ? toDomain(dto) : null;
  }

  async save(transaction: Transaction): Promise<void> {
    localStorageClient.upsert(COLLECTION, toDto(transaction));
  }

  async delete(id: string): Promise<void> {
    localStorageClient.remove(COLLECTION, id);
  }
}
