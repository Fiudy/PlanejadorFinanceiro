import { isFirebaseConfigured } from "@/infrastructure/firebase/firebase-config";
import { FirebaseAuthService } from "@/infrastructure/firebase/firebase-auth-service";
import { FirestoreAccountRepository } from "@/infrastructure/firebase/firestore-account-repository";
import { FirestoreCategoryRepository } from "@/infrastructure/firebase/firestore-category-repository";
import { FirestoreTransactionRepository } from "@/infrastructure/firebase/firestore-transaction-repository";
import { FirestoreCardRepository } from "@/infrastructure/firebase/firestore-card-repository";
import { FirestoreRecurringBillRepository } from "@/infrastructure/firebase/firestore-recurring-bill-repository";
import { FirestoreGoalRepository } from "@/infrastructure/firebase/firestore-goal-repository";
import { FirestoreUserRepository } from "@/infrastructure/firebase/firestore-user-repository";

import { LocalAuthService } from "@/infrastructure/local/local-auth-service";
import { LocalAccountRepository } from "@/infrastructure/local/local-account-repository";
import { LocalCategoryRepository } from "@/infrastructure/local/local-category-repository";
import { LocalTransactionRepository } from "@/infrastructure/local/local-transaction-repository";
import { LocalCardRepository } from "@/infrastructure/local/local-card-repository";
import { LocalRecurringBillRepository } from "@/infrastructure/local/local-recurring-bill-repository";
import { LocalGoalRepository } from "@/infrastructure/local/local-goal-repository";
import { LocalUserRepository } from "@/infrastructure/local/local-user-repository";

import { AccountUseCases } from "@/application/use-cases/account-use-cases";
import { CategoryUseCases } from "@/application/use-cases/category-use-cases";
import { TransactionUseCases } from "@/application/use-cases/transaction-use-cases";
import { CardUseCases } from "@/application/use-cases/card-use-cases";
import { RecurringBillUseCases } from "@/application/use-cases/recurring-bill-use-cases";
import { GoalUseCases } from "@/application/use-cases/goal-use-cases";
import { DashboardUseCases } from "@/application/use-cases/dashboard-use-cases";
import { FinancialHealthScoreUseCases } from "@/application/use-cases/financial-health-score-use-cases";
import { MonthlyClosingUseCases } from "@/application/use-cases/monthly-closing-use-cases";
import { CashFlowForecastUseCases } from "@/application/use-cases/cash-flow-forecast-use-cases";
import { SpendingAnomalyUseCases } from "@/application/use-cases/spending-anomaly-use-cases";
import { UserPreferencesUseCases } from "@/application/use-cases/user-preferences-use-cases";

/**
 * Único ponto de decisão entre a implementação local (padrão, funciona
 * sem configuração) e a implementação Firebase (ativada automaticamente
 * quando as variáveis VITE_FIREBASE_* estão presentes). Nenhuma feature
 * ou hook deve importar um repositório concreto diretamente — sempre
 * através deste container.
 */
class Container {
  readonly usingFirebase = isFirebaseConfigured;

  readonly authService = this.usingFirebase ? new FirebaseAuthService() : new LocalAuthService();

  private readonly accountRepository = this.usingFirebase
    ? new FirestoreAccountRepository()
    : new LocalAccountRepository();

  private readonly categoryRepository = this.usingFirebase
    ? new FirestoreCategoryRepository()
    : new LocalCategoryRepository();

  private readonly transactionRepository = this.usingFirebase
    ? new FirestoreTransactionRepository()
    : new LocalTransactionRepository();

  private readonly cardRepository = this.usingFirebase ? new FirestoreCardRepository() : new LocalCardRepository();

  private readonly recurringBillRepository = this.usingFirebase
    ? new FirestoreRecurringBillRepository()
    : new LocalRecurringBillRepository();

  private readonly goalRepository = this.usingFirebase ? new FirestoreGoalRepository() : new LocalGoalRepository();

  private readonly userRepository = this.usingFirebase ? new FirestoreUserRepository() : new LocalUserRepository();

  readonly accounts = new AccountUseCases(this.accountRepository);
  readonly categories = new CategoryUseCases(this.categoryRepository);
  readonly transactions = new TransactionUseCases(this.transactionRepository);
  readonly cards = new CardUseCases(this.cardRepository);
  readonly recurringBills = new RecurringBillUseCases(
    this.recurringBillRepository,
    this.transactionRepository,
    this.accountRepository,
  );
  readonly goals = new GoalUseCases(this.goalRepository);
  readonly dashboard = new DashboardUseCases(
    this.accountRepository,
    this.categoryRepository,
    this.transactionRepository,
    this.cardRepository,
    this.recurringBillRepository,
  );
  readonly financialHealthScore = new FinancialHealthScoreUseCases(
    this.dashboard,
    this.recurringBillRepository,
    this.transactionRepository,
  );
  readonly monthlyClosing = new MonthlyClosingUseCases(this.categoryRepository, this.transactionRepository);
  readonly cashFlowForecast = new CashFlowForecastUseCases(
    this.dashboard,
    this.recurringBillRepository,
    this.cardRepository,
    this.transactionRepository,
  );
  readonly spendingAnomaly = new SpendingAnomalyUseCases(this.categoryRepository, this.transactionRepository);
  readonly userPreferences = new UserPreferencesUseCases(this.userRepository);
}

export const container = new Container();
