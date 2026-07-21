import type { UserProps } from "@/domain/entities/user";
import { User } from "@/domain/entities/user";
import type { UserRepository } from "@/domain/repositories/repositories";
import { localStorageClient } from "./local-storage-client";

const COLLECTION = "users";

export class LocalUserRepository implements UserRepository {
  async findById(id: string): Promise<User | null> {
    const dto = localStorageClient.readAll<UserProps>(COLLECTION).find((item) => item.id === id);
    return dto ? User.create(dto) : null;
  }

  async save(user: User): Promise<void> {
    localStorageClient.upsert(COLLECTION, user.toProps());
  }
}
