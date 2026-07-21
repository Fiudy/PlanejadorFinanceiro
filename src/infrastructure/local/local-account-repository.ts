import type { AccountProps } from "@/domain/entities/account";
import { Account } from "@/domain/entities/account";
import type { AccountRepository } from "@/domain/repositories/repositories";
import { localStorageClient } from "./local-storage-client";

type AccountDto = Omit<AccountProps, "createdAt"> & { createdAt: string };

const COLLECTION = "accounts";

function toDto(account: Account): AccountDto {
  const props = account.toProps();
  return { ...props, createdAt: props.createdAt.toISOString() };
}

function toDomain(dto: AccountDto): Account {
  return Account.fromProps({ ...dto, createdAt: new Date(dto.createdAt) });
}

export class LocalAccountRepository implements AccountRepository {
  async findAllByUser(userId: string): Promise<Account[]> {
    return localStorageClient
      .readAll<AccountDto>(COLLECTION)
      .filter((dto) => dto.userId === userId)
      .map(toDomain);
  }

  async findById(id: string): Promise<Account | null> {
    const dto = localStorageClient.readAll<AccountDto>(COLLECTION).find((item) => item.id === id);
    return dto ? toDomain(dto) : null;
  }

  async save(account: Account): Promise<void> {
    localStorageClient.upsert(COLLECTION, toDto(account));
  }

  async delete(id: string): Promise<void> {
    localStorageClient.remove(COLLECTION, id);
  }
}
