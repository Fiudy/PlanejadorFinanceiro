import { Link } from "react-router-dom";
import { Landmark, ReceiptText, ChevronRight, CreditCard, Bot, Target, SlidersHorizontal } from "lucide-react";
import { CategoriesSection } from "./categories-section";
import { MonthlyLimitSection } from "./monthly-limit-section";
import { AppearanceSection } from "./appearance-section";
import { ProfileSection } from "./profile-section";

function ManagePageLink({ to, icon: Icon, title, description }: { to: string; icon: typeof Landmark; title: string; description: string }) {
  return (
    <Link to={to}>
      <section className="oc-panel flex items-center gap-3 !p-4 transition hover:-translate-y-0.5">
        <div className="oc-settings-icon">
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{title}</p>
          <p className="truncate text-xs text-[var(--oc-muted)]">{description}</p>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-[var(--oc-muted)]" />
      </section>
    </Link>
  );
}

export function SettingsPage() {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ManagePageLink to="/contas" icon={Landmark} title="Contas bancárias" description="Gerencie suas contas em uma página dedicada" />
        <ManagePageLink to="/contas-fixas" icon={ReceiptText} title="Contas fixas" description="Gerencie despesas recorrentes em uma página dedicada" />
        <ManagePageLink to="/cartoes" icon={CreditCard} title="Cartões" description="Identificação, faturas, limites e vencimentos" />
        <ManagePageLink to="/metas" icon={Target} title="Metas" description="Objetivos e progresso financeiro preservados" />
        <ManagePageLink to="/assistente" icon={Bot} title="Assistente financeiro" description="Análises e conversas com seu contexto financeiro" />
        <section className="oc-panel flex items-center gap-3 !p-4"><div className="oc-settings-icon"><SlidersHorizontal className="h-4.5 w-4.5" /></div><div><p className="text-sm font-semibold">Planejamento mensal</p><p className="text-xs text-[var(--oc-muted)]">Limite e categorias ficam reunidos abaixo</p></div></section>
      </div>

      <div className="oc-settings-grid">
        <div className="flex flex-col gap-5">
          <section className="oc-panel"><CategoriesSection /></section>
          <section className="oc-panel"><MonthlyLimitSection /></section>
        </div>
        <div className="flex flex-col gap-5">
          <section className="oc-panel"><AppearanceSection /></section>
          <section className="oc-panel"><ProfileSection /></section>
        </div>
      </div>
    </div>
  );
}
