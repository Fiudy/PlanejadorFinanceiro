import type { RecurringBillProps } from "@/domain/entities/recurring-bill";
import { RecurringBill } from "@/domain/entities/recurring-bill";
import type { RecurringBillRepository } from "@/domain/repositories/repositories";
import { localStorageClient } from "./local-storage-client";

type BillDto = Omit<RecurringBillProps, "nextOccurrence" | "createdAt"> & {
  nextOccurrence: string;
  createdAt: string;
};

const COLLECTION = "recurring_bills";

const toDto = (bill: RecurringBill): BillDto => {
  const props = bill.toProps();
  return { ...props, nextOccurrence: props.nextOccurrence.toISOString(), createdAt: props.createdAt.toISOString() };
};
const toDomain = (dto: BillDto): RecurringBill =>
  RecurringBill.fromProps({
    ...dto,
    nextOccurrence: new Date(dto.nextOccurrence),
    createdAt: new Date(dto.createdAt),
  });

export class LocalRecurringBillRepository implements RecurringBillRepository {
  async findAllByUser(userId: string): Promise<RecurringBill[]> {
    return localStorageClient
      .readAll<BillDto>(COLLECTION)
      .filter((dto) => dto.userId === userId)
      .map(toDomain);
  }

  async findById(id: string): Promise<RecurringBill | null> {
    const dto = localStorageClient.readAll<BillDto>(COLLECTION).find((item) => item.id === id);
    return dto ? toDomain(dto) : null;
  }

  async save(bill: RecurringBill): Promise<void> {
    localStorageClient.upsert(COLLECTION, toDto(bill));
  }

  async delete(id: string): Promise<void> {
    localStorageClient.remove(COLLECTION, id);
  }
}
