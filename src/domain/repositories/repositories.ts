import type { Account } from "../entities/account";
import type { Category } from "../entities/category";
import type { Transaction } from "../entities/transaction";
import type { Card, CardPurchase } from "../entities/card";
import type { RecurringBill } from "../entities/recurring-bill";
import type { Goal } from "../entities/goal";
import type { User, UserPreferences } from "../entities/user";

/**
 * Contratos de persistência. A camada de aplicação (use cases) depende
 * apenas destas interfaces — nunca de uma implementação concreta
 * (Firestore, localStorage, etc). Isso é o que permite trocar o backend
 * sem tocar em uma linha de regra de negócio.
 */

export interface AccountRepository {
  findAllByUser(userId: string): Promise<Account[]>;
  findById(id: string): Promise<Account | null>;
  save(account: Account): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface CategoryRepository {
  findAllByUser(userId: string): Promise<Category[]>;
  findById(id: string): Promise<Category | null>;
  save(category: Category): Promise<void>;
  saveMany(categories: Category[]): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface TransactionFilters {
  accountId?: string;
  categoryId?: string;
  type?: Transaction["type"];
  from?: Date;
  to?: Date;
}

export interface TransactionRepository {
  findAllByUser(userId: string, filters?: TransactionFilters): Promise<Transaction[]>;
  findById(id: string): Promise<Transaction | null>;
  save(transaction: Transaction): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface CardRepository {
  findAllByUser(userId: string): Promise<Card[]>;
  findById(id: string): Promise<Card | null>;
  save(card: Card): Promise<void>;
  delete(id: string): Promise<void>;
  findPurchasesByCard(cardId: string, userId: string): Promise<CardPurchase[]>;
  savePurchase(purchase: CardPurchase): Promise<void>;
  deletePurchase(id: string): Promise<void>;
}

export interface RecurringBillRepository {
  findAllByUser(userId: string): Promise<RecurringBill[]>;
  findById(id: string): Promise<RecurringBill | null>;
  save(bill: RecurringBill): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface GoalRepository {
  findAllByUser(userId: string): Promise<Goal[]>;
  findById(id: string): Promise<Goal | null>;
  save(goal: Goal): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthenticatedIdentity {
  id: string;
  name: string;
  email: string;
}

/** Abstrai o provedor de autenticação (Firebase Auth ou um provedor local). */
export interface AuthService {
  getCurrentUser(): AuthenticatedIdentity | null;
  onAuthStateChanged(callback: (identity: AuthenticatedIdentity | null) => void): () => void;
  signUp(name: string, credentials: AuthCredentials): Promise<AuthenticatedIdentity>;
  signIn(credentials: AuthCredentials): Promise<AuthenticatedIdentity>;
  signInWithGoogle(): Promise<AuthenticatedIdentity>;
  sendPasswordReset(email: string): Promise<void>;
  signOut(): Promise<void>;
}

export type { UserPreferences };
