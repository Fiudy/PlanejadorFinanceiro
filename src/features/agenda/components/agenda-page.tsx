import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTransactions } from "@/features/transactions/hooks/use-transactions";
import { cn } from "@/shared/lib/cn";

export function AgendaPage() {
  const [month, setMonth] = useState(() => new Date());
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59);
  const { data: items = [] } = useTransactions({ from: start, to: end });
  const byDay = useMemo(() => new Map(Array.from({ length: 31 }, (_, index) => [index + 1, items.filter((item) => item.dueDate.getDate() === index + 1)])), [items]);
  const blanks = start.getDay();
  const days = end.getDate();
  const move = (delta: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1));
  return <div className="flex flex-col gap-5">
    <div className="oc-content-head"><div className="oc-month-control"><button onClick={() => move(-1)}><ChevronLeft size={18}/></button><div className="oc-month-label"><small>Período</small><b>{month.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</b></div><button onClick={() => move(1)}><ChevronRight size={18}/></button></div></div>
    <section className="oc-panel !p-0 overflow-hidden">
      <div className="grid grid-cols-7 border-b text-center text-[11px] font-bold uppercase text-muted-500">{["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"].map((day) => <span key={day} className="p-3">{day}</span>)}</div>
      <div className="grid grid-cols-7">{Array.from({ length: blanks }).map((_, index) => <div key={`blank-${index}`} className="min-h-24 border-b border-r bg-paper-100/40 dark:bg-black/10"/>)}{Array.from({ length: days }, (_, index) => index + 1).map((day) => <div key={day} className="min-h-24 border-b border-r p-2"><span className={cn("grid h-7 w-7 place-items-center rounded-full text-xs font-semibold", new Date().toDateString() === new Date(month.getFullYear(), month.getMonth(), day).toDateString() && "bg-accent-500 text-white")}>{day}</span><div className="mt-1 space-y-1">{(byDay.get(day) ?? []).slice(0, 3).map((item) => <div key={item.id} title={item.description} className={cn("truncate rounded-md px-1.5 py-1 text-[10px] font-semibold", item.type === "receita" ? "bg-accent-500/15 text-accent-600 dark:text-accent-400" : item.status === "pago" ? "bg-ink-700/10 text-muted-500" : "bg-coral-500/15 text-coral-500")}>{item.description}</div>)}</div></div>)}</div>
    </section>
  </div>;
}
