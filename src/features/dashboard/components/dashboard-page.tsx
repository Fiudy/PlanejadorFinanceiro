import type { RefObject } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useDashboardSummary } from "../hooks/use-dashboard-summary";
import { useFinancialHealthScore } from "../hooks/use-financial-health-score";
import { useSpendingAnomalies } from "../hooks/use-spending-anomalies";
import { useMonthlyClosing } from "../hooks/use-monthly-closing";
import { useUserPreferences } from "@/features/settings/hooks/use-user-preferences";
import { SummaryCards } from "./summary-cards";
import { RecentActivity } from "./recent-activity";
import { CategoryBreakdownChart } from "./category-breakdown-chart";
import { MonthlyEvolutionChart } from "./monthly-evolution-chart";
import { UpcomingDueList } from "./upcoming-due-list";
import { FinancialHealthScoreCard } from "./financial-health-score-card";
import { MonthlyLimitCard } from "./monthly-limit-card";
import { SpendingAnomalyAlert } from "./spending-anomaly-alert";
import { MonthlyClosingModal } from "./monthly-closing-modal";
import { SearchDialog } from "./search-dialog";
import { TransactionFormDialog } from "@/features/transactions/components/transaction-form-dialog";
import { PageSpinner } from "@/shared/ui/spinner";
import { Button } from "@/shared/ui/button";
import { useScroller } from "@/app/smooth-scroll-provider";
import { useAuth } from "@/app/auth-context";
import { gsap, prefersReducedMotion } from "@/shared/lib/gsap";

function useDashboardEntrance(containerRef: RefObject<HTMLDivElement | null>, deps: unknown[]) {
  useScroller();
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const elements = Array.from(container.querySelectorAll<HTMLElement>(".dash-animate:not([data-dash-animated])"));
    if (!elements.length || prefersReducedMotion()) { elements.forEach((el) => el.setAttribute("data-dash-animated", "true")); return; }
    gsap.set(elements, { opacity: 1, y: 0 });
    gsap.from(elements, { opacity: 0, y: 20, duration: 0.55, ease: "expo.out", stagger: 0.05, clearProps: "opacity,transform" });
    elements.forEach((el) => el.setAttribute("data-dash-animated", "true"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export function DashboardPage() {
  const { user } = useAuth();
  const [transactionOpen, setTransactionOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { data, isLoading } = useDashboardSummary();
  const { data: healthScore } = useFinancialHealthScore();
  const { data: anomalies = [] } = useSpendingAnomalies();
  const { data: preferences } = useUserPreferences();
  const { summary: closingSummary, open: closingOpen, dismiss: dismissClosing } = useMonthlyClosing();
  const containerRef = useRef<HTMLDivElement>(null);
  useDashboardEntrance(containerRef, [data, healthScore, anomalies]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  if (isLoading || !data) return <PageSpinner />;

  return <div ref={containerRef} className="flex flex-col gap-6">
    <header className="dash-animate flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div><h1 className="font-display text-[30px] font-semibold tracking-[-.025em] text-ink-950 dark:text-white">Boa tarde, {user?.name?.split(" ")[0]}</h1><p className="mt-1 text-sm text-muted-500 dark:text-muted-300">{new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}</p></div>
      <div className="flex items-center gap-2">
        <button onClick={() => setSearchOpen(true)} className="glass-soft hidden h-10 w-56 items-center gap-2 rounded-xl border border-border-light px-3 text-sm text-muted-500 transition-colors hover:text-ink-950 dark:border-white/10 dark:text-muted-300 dark:hover:text-white md:flex">
          <Search className="h-4 w-4" />Buscar...<kbd className="ml-auto text-[10px]">Ctrl K</kbd>
        </button>
        <Button onClick={() => setTransactionOpen(true)} className="h-10 bg-white text-black shadow-[0_10px_28px_-8px_rgba(255,255,255,0.4)] hover:bg-white/90"><Plus className="h-4 w-4" />Novo lançamento</Button>
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-slate-400 to-slate-700 text-xs font-semibold text-white">{user?.name?.slice(0, 2).toUpperCase()}</div>
      </div>
    </header>
    <SummaryCards balance={data.consolidatedBalance} income={data.monthlyIncome} expense={data.monthlyExpense} committedRatio={data.committedIncomeRatio} />
    <RecentActivity items={data.recentActivity} income={data.monthlyIncome} essential={data.essentialExpense} variable={data.variableExpense} />
    {anomalies.length > 0 && <SpendingAnomalyAlert anomalies={anomalies} />}
    <MonthlyLimitCard expense={data.monthlyExpense} limitCents={preferences?.monthlyExpenseLimitCents} />
    {healthScore && <FinancialHealthScoreCard data={healthScore} />}
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2"><CategoryBreakdownChart items={data.categoryBreakdown} /><MonthlyEvolutionChart items={data.monthlyEvolution} /></div>
    <UpcomingDueList items={data.upcomingDue} />
    <MonthlyClosingModal summary={closingSummary} open={closingOpen} onClose={dismissClosing} />
    <TransactionFormDialog open={transactionOpen} onClose={() => setTransactionOpen(false)} />
    <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
  </div>;
}
