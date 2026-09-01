import { ArrowDown, ArrowUp, CalendarClock, ShieldCheck, TrendingUp } from "lucide-react";
import { useTransactions } from "@/features/transactions/hooks/use-transactions";
import { PageSpinner } from "@/shared/ui/spinner";

const money = (cents: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

function buildProjection<T extends { type: "receita" | "despesa"; amount: { inCents: number } }>(events: T[]) {
  return events.reduce<{ running: number; minimum: number; items: Array<{ item: T; balance: number }> }>((state, item) => {
    const running = state.running + (item.type === "receita" ? item.amount.inCents : -item.amount.inCents);
    return { running, minimum: Math.min(state.minimum, running), items: [...state.items, { item, balance: running }] };
  }, { running: 0, minimum: 0, items: [] });
}

export function PlanningPage() {
  const { data: transactions = [], isLoading } = useTransactions();
  if (isLoading) return <PageSpinner />;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + 60);
  const events = transactions
    .filter((item) => item.status === "pendente" && item.dueDate >= today && item.dueDate <= horizon)
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  const incoming = events.filter((item) => item.type === "receita").reduce((sum, item) => sum + item.amount.inCents, 0);
  const outgoing = events.filter((item) => item.type === "despesa").reduce((sum, item) => sum + item.amount.inCents, 0);
  const projection = buildProjection(events);
  const projected = projection.items;
  const minimum = projection.minimum;

  return <div className="flex flex-col gap-5">
    <div className="oc-content-head"><div><span className="oc-eyebrow">Próximos 60 dias</span><b className="block font-display text-xl">Seu dinheiro no tempo</b><small>Projeção baseada nos lançamentos pendentes</small></div></div>
    <div className="grid gap-4 md:grid-cols-3">
      <article className="oc-panel"><ArrowUp className="mb-4 text-[var(--oc-green)]"/><small className="text-[var(--oc-muted)]">Entradas previstas</small><strong className="mt-1 block font-display text-2xl text-[var(--oc-green)]">{money(incoming)}</strong></article>
      <article className="oc-panel"><ArrowDown className="mb-4 text-coral-500"/><small className="text-[var(--oc-muted)]">Saídas previstas</small><strong className="mt-1 block font-display text-2xl">{money(outgoing)}</strong></article>
      <article className="oc-panel"><TrendingUp className="mb-4 text-amber-500"/><small className="text-[var(--oc-muted)]">Variação projetada</small><strong className="mt-1 block font-display text-2xl">{money(incoming - outgoing)}</strong></article>
    </div>
    {minimum < 0 && <div className="flex gap-3 rounded-2xl border border-coral-500/20 bg-coral-500/10 p-4 text-sm"><ShieldCheck className="shrink-0 text-coral-500"/><div><strong>Reserva recomendada: {money(Math.abs(minimum))}</strong><p className="mt-1 text-muted-500">Esse valor evita saldo negativo no pior ponto da projeção.</p></div></div>}
    <section className="oc-panel !p-0 overflow-hidden"><div className="border-b border-[var(--oc-line)] p-5"><h2 className="font-display text-lg font-semibold">Linha do tempo do caixa</h2><p className="text-xs text-[var(--oc-muted)]">Entradas primeiro; depois, contas do mesmo dia por prioridade.</p></div>
      <div className="divide-y">{projected.length ? projected.map(({ item, balance }) => <div key={item.id} className="flex items-center gap-4 p-4 hover:bg-paper-100/70 dark:hover:bg-ink-800/70"><span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-500/10 text-accent-500"><CalendarClock size={18}/></span><div className="min-w-0 flex-1"><strong className="block truncate text-sm">{item.description}</strong><small className="text-muted-500">{item.dueDate.toLocaleDateString("pt-BR")} · {item.priority ?? "entrada"}</small></div><div className="text-right"><strong className={item.type === "receita" ? "text-accent-500" : "text-coral-500"}>{item.type === "receita" ? "+" : "−"}{item.amount.format()}</strong><small className="block text-muted-500">saldo {money(balance)}</small></div></div>) : <p className="p-8 text-center text-sm text-muted-500">Nenhum lançamento pendente nos próximos 60 dias.</p>}</div>
    </section>
  </div>;
}
