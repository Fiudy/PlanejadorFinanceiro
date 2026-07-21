import { User, DEFAULT_USER_PREFERENCES } from "@/domain/entities/user";
import type { UserPreferences } from "@/domain/entities/user";
import type { UserRepository } from "@/domain/repositories/repositories";

export class UserPreferencesUseCases {
  constructor(private readonly users: UserRepository) {}

  async getPreferences(userId: string): Promise<UserPreferences> {
    const user = await this.users.findById(userId);
    return user ? user.preferences : DEFAULT_USER_PREFERENCES;
  }

  /** Define (ou remove, passando `null`) o limite mensal de despesas definido pelo próprio usuário. */
  async setMonthlyExpenseLimit(input: {
    userId: string;
    name: string;
    email: string;
    amountCents: number | null;
  }): Promise<UserPreferences> {
    const existing = await this.users.findById(input.userId);
    const user = existing ?? User.create({ id: input.userId, name: input.name, email: input.email, preferences: DEFAULT_USER_PREFERENCES });
    const updated = user.withPreferences({ monthlyExpenseLimitCents: input.amountCents ?? undefined });
    await this.users.save(updated);
    return updated.preferences;
  }
}
