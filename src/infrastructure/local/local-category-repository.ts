import type { CategoryProps } from "@/domain/entities/category";
import { Category } from "@/domain/entities/category";
import type { CategoryRepository } from "@/domain/repositories/repositories";
import { localStorageClient } from "./local-storage-client";

const COLLECTION = "categories";

export class LocalCategoryRepository implements CategoryRepository {
  async findAllByUser(userId: string): Promise<Category[]> {
    return localStorageClient
      .readAll<CategoryProps>(COLLECTION)
      .filter((dto) => dto.userId === userId)
      .map(Category.fromProps);
  }

  async findById(id: string): Promise<Category | null> {
    const dto = localStorageClient.readAll<CategoryProps>(COLLECTION).find((item) => item.id === id);
    return dto ? Category.fromProps(dto) : null;
  }

  async save(category: Category): Promise<void> {
    localStorageClient.upsert(COLLECTION, category.toProps());
  }

  async saveMany(categories: Category[]): Promise<void> {
    localStorageClient.upsertMany(COLLECTION, categories.map((c) => c.toProps()));
  }

  async delete(id: string): Promise<void> {
    localStorageClient.remove(COLLECTION, id);
  }
}
