import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, BarChart3, ChevronLeft, ChevronRight, Equal, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useTransactions } from "@/features/transactions/hooks/use-transactions";
import { useCategories } from "@/features/settings/hooks/use-categories";
import { PageSpinner } from "@/shared/ui/spinner";
import type { Transaction } from "@/domain/entities/transaction";

const sum = (items: Transaction[]) => items.reduce((total, item) => total + item.amount.inCents, 0);
const money = (cents: number) => new Intl.NumberFormat("pt-BR", { style:"currency", currency:"BRL" }).format(cents / 100);

function Summary({ label, value, kind, icon: Icon }: { label:string; value:number; kind:"income"|"expense"; icon: typeof ArrowUpRight }) {
  return <article className="oc-summary"><span className={`oc-summary-icon ${kind}`}><Icon size={19}/></span><div><small>{label}</small><b>{money(value)}</b></div></article>;
}

export function DashboardPage() {
  const [month, setMonth] = useState(() => new Date());
  const { data: all = [], isLoading } = useTransactions();
  const { data: categories = [] } = useCategories();
  const list = useMemo(() => all.filter((item) => item.dueDate.getMonth() === month.getMonth() && item.dueDate.getFullYear() === month.getFullYear()), [all, month]);
  if (isLoading) return <PageSpinner/>;
  const incomes = list.filter((item) => item.type === "receita");
  const expenses = list.filter((item) => item.type === "despesa");
  const paid = expenses.filter((item) => item.status === "pago");
  const incomeTotal = sum(incomes), expenseTotal = sum(expenses), paidTotal = sum(paid), balance = incomeTotal - expenseTotal;
  const paidPercent = expenseTotal ? Math.round((paidTotal / expenseTotal) * 100) : 0;
  const categoryMap = new Map(categories.map((item) => [item.id, item]));
  const categoryTotals = Array.from(new Set(expenses.map((item) => item.categoryId))).map((id) => ({ id, name: categoryMap.get(id)?.name ?? "Outros", total: sum(expenses.filter((item) => item.categoryId === id)) })).sort((a,b) => b.total-a.total);
  const move = (delta:number) => setMonth(new Date(month.getFullYear(), month.getMonth()+delta, 1));

  return <div>
    <div className="oc-content-head"><div className="oc-month-control"><button onClick={() => move(-1)}><ChevronLeft size={18}/></button><div className="oc-month-label"><small>Período</small><b>{month.toLocaleDateString("pt-BR",{month:"long",year:"numeric"})}</b></div><button onClick={() => move(1)}><ChevronRight size={18}/></button><button className="!w-auto px-3 text-xs font-bold" onClick={() => setMonth(new Date())}>Hoje</button></div><span>{list.length} lançamentos no período</span></div>
    <section className="oc-panel oc-teaser"><span className="oc-teaser-icon"><BarChart3 size={19}/></span><div className="oc-teaser-copy"><span className="oc-eyebrow">Planejamento de caixa</span><b>Descubra se o dinheiro chega antes das contas</b><small>Confira a projeção e priorize os próximos vencimentos.</small></div><Link to="/planejamento" className="oc-ghost">Ver planejamento</Link></section>
    <section className="oc-summary-grid"><Summary label="Entradas" value={incomeTotal} kind="income" icon={ArrowUpRight}/><Summary label="Despesas" value={expenseTotal} kind="expense" icon={ArrowDownRight}/><Summary label="Pago" value={paidTotal} kind="income" icon={ShieldCheck}/><Summary label="Saldo previsto" value={balance} kind={balance >= 0 ? "income" : "expense"} icon={Equal}/></section>
    <section className="oc-panel oc-payment"><div className="oc-payment-copy"><span className="oc-summary-icon income"><ShieldCheck size={18}/></span><div><span className="oc-eyebrow">Acompanhamento de pagamentos</span><b>{paidPercent === 100 ? "Tudo pago neste mês" : `${paidPercent}% das despesas já foram pagas`}</b><small>{paid.length} de {expenses.length} lançamentos concluídos.</small></div></div><div><div className="mb-2 flex justify-between text-[11px] text-[var(--oc-muted)]"><span>Total pago: <b className="text-[var(--oc-ink)]">{money(paidTotal)}</b></span><span>{100-paidPercent}% pendente</span></div><div className="oc-progress"><i style={{width:`${paidPercent}%`}}/></div></div></section>
    <section className="oc-panel mb-5"><div className="oc-panel-head"><div><span className="oc-eyebrow">Leitura do mês</span><h2>Para onde está indo seu dinheiro</h2><p>Distribuição das despesas previstas por categoria</p></div><span className="oc-soft !min-h-8 text-[11px]">Visão por categoria</span></div><div className="grid gap-6 lg:grid-cols-[1fr_1.25fr]"><div className="border-r-0 pr-0 lg:border-r lg:border-[var(--oc-line)] lg:pr-6"><p className="text-sm leading-7">Em {month.toLocaleDateString("pt-BR",{month:"long",year:"numeric"})}, <b>{categoryTotals[0]?.name ?? "nenhuma categoria"}</b> representa a maior parte das despesas previstas.</p><div className="mt-5 grid grid-cols-3 border-y border-[var(--oc-line)] py-3 text-xs"><span><b className="block text-base">{categoryTotals.length}</b>categorias</span><span><b className="block text-base">{expenses.length}</b>despesas</span><span><b className="block text-base">{money(expenseTotal)}</b>total previsto</span></div></div><div>{categoryTotals.length ? categoryTotals.slice(0,5).map((category,index) => <div key={category.id} className="grid grid-cols-[24px_1fr_auto] items-center gap-3 border-b border-[var(--oc-line)] py-3 text-xs"><span>{index+1}</span><div><b>{category.name}</b><div className="mt-2 h-1 rounded bg-red-100"><i className="block h-full rounded bg-coral-500" style={{width:`${expenseTotal ? category.total/expenseTotal*100 : 0}%`}}/></div></div><strong>{money(category.total)}</strong></div>) : <p className="py-10 text-center text-sm text-[var(--oc-muted)]">Nenhuma despesa neste período.</p>}</div></div></section>
    <section className="oc-dashboard-grid"><article className="oc-panel"><div className="oc-panel-head"><div><h2>Lançamentos do período</h2><p>Organizados em relação à data de hoje</p></div><Link to="/agenda" className="font-bold text-[var(--oc-green)]">Ver na agenda</Link></div>{list.length ? [...list].sort((a,b)=>a.dueDate.getTime()-b.dueDate.getTime()).slice(0,8).map((item)=><div key={item.id} className="oc-record-row"><span className={`oc-summary-icon ${item.type === "receita" ? "income":"expense"}`}><BarChart3 size={16}/></span><div><b>{item.description}</b><small>{categoryMap.get(item.categoryId)?.name ?? "Sem categoria"} · {item.dueDate.toLocaleDateString("pt-BR")}</small></div><strong>{item.type === "receita" ? "+":"−"}{item.amount.format()}</strong><span className={`oc-pill ${item.status !== "pendente" ? "done":""}`}>{item.status}</span></div>):<p className="py-10 text-center text-sm text-[var(--oc-muted)]">Nenhum lançamento neste mês.</p>}</article><article className="oc-panel"><div className="oc-panel-head"><div><h2>Score financeiro</h2><p>Uso do limite de despesas</p></div></div><div className="mx-auto my-8 grid h-44 w-44 place-items-center rounded-full" style={{background:`conic-gradient(var(--oc-green) ${Math.min(100,paidPercent)}%, var(--oc-line) 0)`}}><div className="grid h-32 w-32 place-items-center rounded-full bg-[var(--oc-surface)] text-center"><span><b className="block font-display text-3xl">{paidPercent}</b><small className="text-[var(--oc-muted)]">de 100</small></span></div></div></article></section>
  </div>;
}
