export type ThemeMode = "light" | "dark";

export interface UserPreferences {
  themeMode: ThemeMode;
  currency: string;
  accentColor: string;
  /** Limite de despesas que o próprio usuário define para o mês — usado no score de limite mensal. */
  monthlyExpenseLimitCents?: number;
}

export interface UserProps {
  id: string;
  name: string;
  email: string;
  preferences: UserPreferences;
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  themeMode: "light",
  currency: "BRL",
  accentColor: "#0F7B5C",
};

export class User {
  private constructor(private readonly props: UserProps) {}

  static create(props: UserProps): User {
    if (!props.email.includes("@")) {
      throw new Error("E-mail inválido para o usuário.");
    }
    return new User(props);
  }

  get id() {
    return this.props.id;
  }

  get name() {
    return this.props.name;
  }

  get email() {
    return this.props.email;
  }

  get preferences() {
    return this.props.preferences;
  }

  withPreferences(preferences: Partial<UserPreferences>): User {
    return new User({
      ...this.props,
      preferences: { ...this.props.preferences, ...preferences },
    });
  }

  toProps(): UserProps {
    return { ...this.props };
  }
}
