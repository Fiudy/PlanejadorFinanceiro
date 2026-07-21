import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowLeftRight,
  CreditCard,
  Target,
  Settings,
  Moon,
  Sun,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  ReceiptText,
  Landmark,
  Bot,
} from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { useThemeStore } from "@/shared/theme/theme-store";
import { Button } from "@/shared/ui/button";
import { LogoMark } from "@/shared/ui/logo";
import { SmoothScrollProvider } from "@/app/smooth-scroll-provider";
import { useAuth } from "@/app/auth-context";
import { useCards, useCardAvailableLimit } from "@/features/cards/hooks/use-cards";
import { CardTile } from "@/features/cards/components/card-tile";

const NAV_ITEMS = [
  { to: "/contas", label: "Contas", icon: Landmark },
  { to: "/painel", label: "Início", icon: LayoutDashboard },
  { to: "/transacoes", label: "Lançamentos", icon: ArrowLeftRight },
  { to: "/cartoes", label: "Cartões", icon: CreditCard },
  { to: "/metas", label: "Metas", icon: Target },
  { to: "/contas-fixas", label: "Contas fixas", icon: ReceiptText },
  { to: "/assistente", label: "Assistente", icon: Bot },
  { to: "/config", label: "Config.", icon: Settings },
];

export function AppShell() {
  const { mode, toggle } = useThemeStore();
  const [collapsed, setCollapsed] = useState(false);
  const { signOut } = useAuth();
  const { data: cards = [] } = useCards();
  const primaryCard = cards.find((card) => !card.archived);
  const { data: availableLimit } = useCardAvailableLimit(primaryCard);

  return (
    <div className="flex h-dvh flex-col overflow-hidden sm:flex-row">
      {/* Sidebar — desktop */}
      <aside className={cn("glass-soft hidden shrink-0 flex-col border-r border-border-light/70 px-4 py-5 transition-[width] duration-300 dark:border-border-dark/60 sm:flex", collapsed ? "w-[84px]" : "w-[280px]")}>
        <div className="mb-5 flex items-center gap-2.5 px-1">
          <LogoMark className="h-11 w-11" />
          {!collapsed && <span className="font-display text-lg font-semibold">Planejador</span>}
          <button onClick={() => setCollapsed((value) => !value)} className={cn("ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-500 transition-colors hover:bg-black/5 hover:text-ink-950 dark:hover:bg-white/5 dark:hover:text-white", collapsed && "ml-0")} aria-label={collapsed ? "Expandir menu" : "Recolher menu"}>{collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}</button>
        </div>

        <div className="mb-5 flex flex-col gap-1 border-b border-border-light/70 pb-4 dark:border-white/10">
          <Button variant="ghost" size={collapsed ? "icon" : "md"} className={cn(!collapsed && "justify-start")} onClick={toggle} title={mode === "dark" ? "Modo claro" : "Modo escuro"}>{mode === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}{!collapsed && (mode === "dark" ? "Modo claro" : "Modo escuro")}</Button>
          <Button variant="ghost" size={collapsed ? "icon" : "md"} className={cn("text-muted-500 hover:text-coral-500", !collapsed && "justify-start")} onClick={() => void signOut()} title="Sair"><LogOut className="h-4 w-4" />{!collapsed && "Sair"}</Button>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/painel"}
              className={({ isActive }) =>
                cn(
                  "flex items-center rounded-[var(--radius-control)] px-3 py-2.5 text-sm font-medium transition-colors",
                  collapsed ? "justify-center" : "gap-3",
                  isActive
                    ? "bg-accent-100 text-accent-600 dark:bg-accent-600/15 dark:text-accent-400"
                    : "text-muted-500 hover:bg-paper-100 hover:text-ink-950 dark:hover:bg-ink-800 dark:hover:text-paper-50",
                )
              }
            >
              <item.icon className="h-4.5 w-4.5" />
              {!collapsed && item.label}
            </NavLink>
          ))}
        </nav>

        {primaryCard && !collapsed && <div className="sidebar-card-float mb-4 origin-left scale-[.82] overflow-hidden rounded-[var(--radius-card)]"><CardTile card={primaryCard} availableLimit={availableLimit} selected={false} onClick={() => undefined} /></div>}
      </aside>

      {/* Topbar — mobile */}
      <header className="glass-soft flex items-center justify-between border-b border-border-light/70 px-4 py-3 dark:border-border-dark/60 sm:hidden">
        <div className="flex items-center gap-2">
          <LogoMark className="h-8 w-8" />
          <span className="font-display text-base font-semibold">Planejador</span>
        </div>
        <Button variant="ghost" size="icon" onClick={toggle} aria-label="Alternar tema">
          {mode === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </header>

      <SmoothScrollProvider
        className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-contain pb-24 sm:pb-8"
        contentClassName="mx-auto w-full max-w-7xl px-4 py-6 sm:px-8 lg:px-10"
      >
        <Outlet />
      </SmoothScrollProvider>

      {/* Bottom navigation — mobile, estilo app bancário */}
      <nav className="glass-soft fixed inset-x-0 bottom-0 z-40 border-t border-border-light/70 dark:border-border-dark/60 sm:hidden">
        <div className="scrollbar-hidden mx-auto flex max-w-full items-center overflow-x-auto px-2 py-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/painel"}
              className={({ isActive }) =>
                cn(
                  "flex min-w-16 flex-1 flex-col items-center gap-1 rounded-[var(--radius-control)] py-1.5 text-[11px] font-medium transition-colors",
                  isActive ? "text-accent-500" : "text-muted-500",
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
