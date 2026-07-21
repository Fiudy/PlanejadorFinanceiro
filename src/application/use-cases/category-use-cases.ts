import { randomId } from "@/shared/lib/id";
import type { CategoryKind} from "@/domain/entities/category";
import { Category, DEFAULT_CATEGORIES } from "@/domain/entities/category";
import type { CategoryRepository } from "@/domain/repositories/repositories";

export class CategoryUseCases {
  constructor(private readonly categories: CategoryRepository) {}

  list(userId: string) {
    return this.categories.findAllByUser(userId);
  }

  async create(input: { userId: string; name: string; kind: CategoryKind; color: string; icon: string }) {
    const category = Category.create({ id: randomId(), ...input });
    await this.categories.save(category);
    return category;
  }

  async rename(categoryId: string, name: string) {
    const category = await this.categories.findById(categoryId);
    if (!category) throw new Error("Categoria não encontrada.");
    const updated = category.rename(name);
    await this.categories.save(updated);
    return updated;
  }

  async remove(categoryId: string) {
    await this.categories.delete(categoryId);
  }

  /**
   * Cria o conjunto de categorias padrão para um usuário recém-criado.
   * Também corrige duplicatas de categorias padrão que já tenham sido
   * criadas (ex: onAuthStateChanged disparando mais de uma vez e duas
   * chamadas concorrentes passando pelo "existing.length > 0" antes de
   * qualquer uma delas terminar de gravar).
   */
  async seedDefaults(userId: string) {
    const existing = await this.categories.findAllByUser(userId);
    if (existing.length === 0) {
      const categories = DEFAULT_CATEGORIES.map((def) =>
        Category.create({ id: randomId(), userId, isDefault: true, ...def }),
      );
      await this.categories.saveMany(categories);
      return categories;
    }

    return this.dedupeDefaults(existing);
  }

  /** Remove categorias padrão repetidas (mesmo nome+tipo), mantendo a primeira ocorrência. */
  private async dedupeDefaults(categories: Category[]) {
    const seen = new Set<string>();
    const deduped: Category[] = [];
    for (const category of categories) {
      if (!category.isDefault) {
        deduped.push(category);
        continue;
      }
      const key = `${category.kind}:${category.name}`;
      if (seen.has(key)) {
        await this.categories.delete(category.id);
        continue;
      }
      seen.add(key);
      deduped.push(category);
    }
    return deduped;
  }
}
