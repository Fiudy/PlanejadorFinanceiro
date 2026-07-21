import { Link } from "react-router-dom";
import { Landmark, ReceiptText, ChevronRight } from "lucide-react";
import { Card } from "@/shared/ui/card";
import { CategoriesSection } from "./categories-section";
import { MonthlyLimitSection } from "./monthly-limit-section";
import { AppearanceSection } from "./appearance-section";
import { ProfileSection } from "./profile-section";

function ManagePageLink({ to, icon: Icon, title, description }: { to: string; icon: typeof Landmark; title: string; description: string }) {
  return (
    <Link to={to}>
      <Card variant="glass" className="flex items-center gap-3 transition-colors hover:bg-paper-100/60 dark:hover:bg-white/5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-100 text-accent-600 dark:bg-accent-600/15 dark:text-accent-400">
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink-950 dark:text-paper-50">{title}</p>
          <p className="truncate text-xs text-muted-500">{description}</p>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-500" />
      </Card>
    </Link>
  );
}

export function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-950 dark:text-paper-50">Configurações</h1>
        <p className="text-sm text-muted-500">Categorias, aparência e perfil.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ManagePageLink to="/contas" icon={Landmark} title="Contas bancárias" description="Gerencie suas contas em uma página dedicada" />
        <ManagePageLink to="/contas-fixas" icon={ReceiptText} title="Contas fixas" description="Gerencie despesas recorrentes em uma página dedicada" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <CategoriesSection />
          <MonthlyLimitSection />
        </div>
        <div className="flex flex-col gap-6">
          <AppearanceSection />
          <ProfileSection />
        </div>
      </div>
    </div>
  );
}
