import { randomId } from "@/shared/lib/id";
import type { AccountType } from "@/domain/entities/account";
import { Account } from "@/domain/entities/account";
import type { AccountRepository } from "@/domain/repositories/repositories";

export class AccountUseCases {
  constructor(private readonly accounts: AccountRepository) {}

  list(userId: string) {
    return this.accounts.findAllByUser(userId);
  }

  async create(input: {
    userId: string;
    name: string;
    type: AccountType;
    color: string;
    icon: string;
    initialBalanceCents: number;
  }) {
    const account = Account.create({ id: randomId(), ...input });
    await this.accounts.save(account);
    return account;
  }

  async rename(accountId: string, name: string) {
    const account = await this.accounts.findById(accountId);
    if (!account) throw new Error("Conta não encontrada.");
    const updated = account.rename(name);
    await this.accounts.save(updated);
    return updated;
  }

  async update(
    accountId: string,
    input: { name: string; type: AccountType; color: string; icon: string; initialBalanceCents: number },
  ) {
    const account = await this.accounts.findById(accountId);
    if (!account) throw new Error("Conta não encontrada.");
    const updated = account.update(input);
    await this.accounts.save(updated);
    return updated;
  }

  async archive(accountId: string) {
    const account = await this.accounts.findById(accountId);
    if (!account) throw new Error("Conta não encontrada.");
    await this.accounts.save(account.archive());
  }

  async remove(accountId: string) {
    await this.accounts.delete(accountId);
  }
}
