import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp } from "lucide-react";

export function EditorialHero() {
  return <section className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 px-6 pt-12 pb-20 md:pt-24 md:pb-32 lg:grid-cols-[1fr_400px] lg:gap-16">
    <div>
      <span className="mb-4 inline-block text-xs font-bold uppercase tracking-[.2em] text-accent-500 md:mb-6">Uma nova relação com seu dinheiro</span>
      <h1 className="mb-6 font-display text-5xl font-semibold leading-[.95] tracking-[-.055em] text-ink-950 dark:text-white md:mb-8 md:text-7xl lg:text-8xl">Domine seu<br /><span className="font-sans font-light italic text-accent-500">fluxo de caixa.</span></h1>
      <p className="mb-8 max-w-lg text-lg leading-relaxed text-muted-500 md:mb-10 md:text-xl">Clareza absoluta sobre cada centavo. Organize contas, visualize hábitos e avance nas suas metas sem complicação.</p>
      <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
        <Link to="/registro" className="flex h-14 w-full items-center justify-center gap-2 rounded-[var(--radius-control)] bg-ink-950 px-8 font-semibold text-white transition-all hover:bg-ink-900 sm:w-auto dark:bg-white dark:text-ink-950">Criar conta gratuita<ArrowRight className="h-4 w-4" /></Link>
        <span className="text-xs font-semibold text-muted-500">Painel, cartões, metas e contas fixas</span>
      </div>
    </div>
    <div className="relative mx-auto mt-8 w-full max-w-sm lg:mt-0 lg:max-w-none">
      <div className="glass relative z-10 space-y-6 rounded-3xl p-6 shadow-2xl md:p-8">
        <div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-widest text-muted-500 md:text-xs">Saldo disponível</p><p className="mt-1 tabular text-2xl font-semibold text-ink-950 dark:text-white md:text-3xl">R$ 14.820,45</p></div><TrendingUp className="h-7 w-7 text-accent-500" /></div>
        <div className="grid grid-cols-2 gap-3 md:gap-4"><div className="rounded-xl bg-paper-100 p-3 dark:bg-ink-800 md:p-4"><p className="text-[9px] font-bold uppercase text-muted-500 md:text-[10px]">Entradas</p><p className="tabular text-sm font-semibold text-accent-600 dark:text-accent-400 md:text-base">+ R$ 8.400</p></div><div className="rounded-xl bg-paper-100 p-3 dark:bg-ink-800 md:p-4"><p className="text-[9px] font-bold uppercase text-muted-500 md:text-[10px]">Saídas</p><p className="tabular text-sm font-semibold text-coral-600 dark:text-coral-500 md:text-base">− R$ 3.120</p></div></div>
        <div><div className="mb-3 flex items-center justify-between text-xs md:text-sm"><span>Meta: Viagem</span><span className="tabular font-bold">75%</span></div><div className="h-2 overflow-hidden rounded-full bg-paper-100 dark:bg-ink-800"><div className="h-full w-3/4 rounded-full bg-accent-500" /></div></div>
      </div>
      <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-accent-100 opacity-60 blur-3xl md:-right-6 md:-bottom-6 md:h-32 md:w-32" />
    </div>
  </section>;
}
