/**
 * Cliente mínimo de persistência em localStorage, namespaced por usuário.
 * É a base sobre a qual os repositórios "local" implementam os contratos
 * de domínio — trocar por Firestore significa só trocar esta camada.
 */
export class LocalStorageClient {
  private readonly namespace = "planejador-financeiro";

  private key(collection: string): string {
    return `${this.namespace}:${collection}`;
  }

  readAll<T>(collection: string): T[] {
    const raw = localStorage.getItem(this.key(collection));
    if (!raw) return [];
    try {
      return JSON.parse(raw) as T[];
    } catch {
      return [];
    }
  }

  writeAll<T>(collection: string, items: T[]): void {
    localStorage.setItem(this.key(collection), JSON.stringify(items));
  }

  upsert<T extends { id: string }>(collection: string, item: T): void {
    const items = this.readAll<T>(collection);
    const index = items.findIndex((existing) => existing.id === item.id);
    if (index >= 0) {
      items[index] = item;
    } else {
      items.push(item);
    }
    this.writeAll(collection, items);
  }

  upsertMany<T extends { id: string }>(collection: string, newItems: T[]): void {
    const items = this.readAll<T>(collection);
    for (const item of newItems) {
      const index = items.findIndex((existing) => existing.id === item.id);
      if (index >= 0) items[index] = item;
      else items.push(item);
    }
    this.writeAll(collection, items);
  }

  remove(collection: string, id: string): void {
    const items = this.readAll<{ id: string }>(collection).filter((item) => item.id !== id);
    this.writeAll(collection, items);
  }
}

export const localStorageClient = new LocalStorageClient();
