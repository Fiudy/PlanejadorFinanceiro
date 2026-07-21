import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "@/shared/layout/app-shell";
import { ProtectedRoute, PublicOnlyRoute } from "./protected-route";
import { LandingPage } from "@/features/landing/components/landing-page";
import { LoginPage } from "@/features/auth/components/login-page";
import { RegisterPage } from "@/features/auth/components/register-page";
import { DashboardPage } from "@/features/dashboard/components/dashboard-page";
import { TransactionsPage } from "@/features/transactions/components/transactions-page";
import { CardsPage } from "@/features/cards/components/cards-page";
import { GoalsPage } from "@/features/goals/components/goals-page";
import { SettingsPage } from "@/features/settings/components/settings-page";
import { RecurringBillsPage } from "@/features/recurring-bills/components/recurring-bills-page";
import { AccountsPage } from "@/features/accounts/components/accounts-page";
import { AssistantChatPage } from "@/features/assistant/components/assistant-chat-page";

export const router = createBrowserRouter([
  {
    element: <PublicOnlyRoute />,
    children: [
      { path: "/", element: <LandingPage /> },
      { path: "/login", element: <LoginPage /> },
      { path: "/registro", element: <RegisterPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: "/painel", element: <DashboardPage /> },
          { path: "/transacoes", element: <TransactionsPage /> },
          { path: "/cartoes", element: <CardsPage /> },
          { path: "/metas", element: <GoalsPage /> },
          { path: "/contas-fixas", element: <RecurringBillsPage /> },
          { path: "/contas", element: <AccountsPage /> },
          { path: "/assistente", element: <AssistantChatPage /> },
          { path: "/config", element: <SettingsPage /> },
        ],
      },
    ],
  },
]);
