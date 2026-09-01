import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Bot, CalendarDays, ChartNoAxesCombined, CreditCard, ListChecks, LayoutDashboard, LogOut, Mic, Moon, Plus, Settings, Sun, Target } from "lucide-react";
import { useAuth } from "@/app/auth-context";
import { useThemeStore } from "@/shared/theme/theme-store";
import { LogoMark } from "@/shared/ui/logo";
import { TransactionFormDialog } from "@/features/transactions/components/transaction-form-dialog";
import { cn } from "@/shared/lib/cn";

const primaryNav = [
  { to: "/painel", label: "Visão geral", icon: LayoutDashboard },
  { to: "/planejamento", label: "Planejamento", icon: ChartNoAxesCombined },
  { to: "/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/config", label: "Configurações", icon: Settings },
];
const preservedNav = [
  { to: "/metas", label: "Metas", icon: Target },
  { to: "/assistente", label: "Assistente IA", icon: Bot },
  { to: "/transacoes", label: "Lançamentos", icon: ListChecks },
  { to: "/cartoes", label: "Cartões", icon: CreditCard },
];
const titles: Record<string, [string, string]> = {
  "/painel": ["Visão geral", "Seu planejamento financeiro"],
  "/planejamento": ["Planejamento de caixa", "Seu dinheiro ao longo do tempo"],
  "/agenda": ["Agenda financeira", "Vencimentos, pagamentos e recebimentos"],
  "/config": ["Configurações", "Preferências e organização do seu espaço"],
  "/metas": ["Metas", "Acompanhe seus objetivos financeiros"],
  "/assistente": ["Assistente financeiro", "Inteligência artificial com seu contexto"],
  "/transacoes": ["Lançamentos", "Consulte ou importe seu extrato"],
  "/cartoes": ["Cartões", "Faturas, limites e vencimentos"],
};

function initials(name?: string) {
  return (name || "PF").split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export function AppShell() {
  const { user, signOut } = useAuth();
  const { mode, toggle } = useThemeStore();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [transactionOpen, setTransactionOpen] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<string | null>(null);
  const [title, subtitle] = titles[pathname] ?? ["Planejador", "Organização financeira"];

  const startVoice = () => {
    type Recognition = { lang: string; start(): void; onresult: (event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void; onerror: () => void };
    const RecognitionClass = (window as typeof window & { webkitSpeechRecognition?: new () => Recognition }).webkitSpeechRecognition;
    if (!RecognitionClass) { setVoiceStatus("Seu navegador não oferece reconhecimento de voz."); return; }
    const recognition = new RecognitionClass();
    recognition.lang = "pt-BR";
    setVoiceStatus("Ouvindo seu comando...");
    recognition.onresult = (event) => {
      const command = event.results[0][0].transcript.toLocaleLowerCase("pt-BR");
      setVoiceStatus(`“${command}”`);
      if (/lançamento|despesa|receita/.test(command)) setTransactionOpen(true);
      else if (/planejamento/.test(command)) navigate("/planejamento");
      else if (/agenda|calendário/.test(command)) navigate("/agenda");
      else if (/config/.test(command)) navigate("/config");
      else if (/meta/.test(command)) navigate("/metas");
      else if (/assistente|ia/.test(command)) navigate("/assistente");
      else navigate("/painel");
    };
    recognition.onerror = () => setVoiceStatus("Não consegui acessar o microfone.");
    recognition.start();
  };

  const renderNav = (items: typeof primaryNav) => items.map((item) => <NavLink key={item.to} to={item.to} className={({ isActive }) => cn("oc-nav-item", isActive && "active")}><item.icon /> <span>{item.label}</span></NavLink>);

  return <div className="oc-app">
    <div className="oc-mobile-head"><div className="flex items-center gap-2"><LogoMark/><b className="font-display">Planejador</b></div><button className="oc-ghost !h-9 !min-h-9 !px-3" onClick={toggle}>{mode === "dark" ? <Sun size={16}/> : <Moon size={16}/>}</button></div>
    <div className="oc-shell">
      <aside className="oc-sidebar">
        <div className="oc-brand"><LogoMark/><span>Planejador</span></div>
        <div className="oc-profile"><span className="oc-avatar">{initials(user?.name)}</span><div><b>{user?.name || "Minha conta"}</b><small>{user?.email}</small></div></div>
        <nav className="oc-nav">{renderNav(primaryNav)}{renderNav(preservedNav)}</nav>
        <div className="oc-sidebar-bottom">
          <button className="oc-nav-item" onClick={startVoice}><Mic/><span>Comando de voz</span></button>
          <button className="oc-nav-item" onClick={toggle}>{mode === "dark" ? <Sun/> : <Moon/>}<span>{mode === "dark" ? "Modo claro" : "Modo escuro"}</span></button>
          <button className="oc-nav-item" onClick={() => void signOut()}><LogOut/><span>Sair</span></button>
        </div>
      </aside>
      <main className="oc-workspace">
        <header className="oc-workspace-head"><div className="oc-workspace-title"><h1>{title}</h1><p>{subtitle}</p></div><div className="oc-head-actions"><select className="oc-select" aria-label="Espaço financeiro"><option>Minhas finanças</option></select><button className="oc-primary" onClick={() => setTransactionOpen(true)}><Plus size={17}/>Novo lançamento</button></div></header>
        <Outlet/>
      </main>
    </div>
    <nav className="oc-mobile-nav">{renderNav(primaryNav)}<button className="oc-nav-item" onClick={startVoice}><Mic/><span>Voz</span></button></nav>
    {voiceStatus && <button className="fixed bottom-24 left-1/2 z-[90] -translate-x-1/2 rounded-full bg-[#17211e] px-4 py-2 text-xs text-white shadow-xl" onClick={() => setVoiceStatus(null)}>{voiceStatus}</button>}
    <TransactionFormDialog open={transactionOpen} onClose={() => setTransactionOpen(false)}/>
  </div>;
}
