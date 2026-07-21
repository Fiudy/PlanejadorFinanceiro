import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Menu, Moon, Sun, X, ChevronRight } from "lucide-react";
import { LogoMark } from "@/shared/ui/logo";
import { useThemeStore } from "@/shared/theme/theme-store";

const links = [{ href: "#recursos", label: "Recursos" }, { href: "#resultados", label: "Resultados" }, { href: "#faq", label: "FAQ" }];

export function LandingHeader() {
  const [open, setOpen] = useState(false);
  const { mode, toggle } = useThemeStore();
  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [open]);

  return <>
    <header className="glass-soft sticky top-0 z-50 flex h-20 w-full items-center justify-between border-b border-border-light/70 px-4 dark:border-white/10 md:px-6">
      <Link to="/" className="flex items-center gap-2.5 font-display text-lg font-semibold text-ink-950 dark:text-white"><LogoMark className="h-9 w-9" />Planejador</Link>
      <nav className="hidden items-center gap-8 text-sm font-medium text-ink-700 dark:text-muted-300 md:flex">{links.map((link) => <a key={link.href} href={link.href} className="transition-colors hover:text-accent-500">{link.label}</a>)}</nav>
      <div className="flex items-center gap-2 sm:gap-3">
        <button onClick={toggle} aria-label="Alternar tema" className="flex h-11 w-11 items-center justify-center rounded-xl text-ink-950 transition-colors hover:bg-black/5 dark:text-white dark:hover:bg-white/5">{mode === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button>
        <Link to="/login" className="hidden text-sm font-semibold text-ink-950 hover:text-accent-600 dark:text-white sm:block">Entrar</Link>
        <Link to="/registro" className="bg-gradient-accent inline-flex h-11 items-center rounded-[var(--radius-control)] px-4 text-sm font-semibold text-white shadow-lg">Começar agora</Link>
        <button onClick={() => setOpen(true)} aria-label="Abrir menu" aria-expanded={open} aria-controls="landing-mobile-menu" className="flex h-11 w-11 items-center justify-center text-ink-950 dark:text-white md:hidden"><Menu className="h-5 w-5" /></button>
      </div>
    </header>
    {open && <div id="landing-mobile-menu" className="fixed inset-0 z-[60] flex flex-col bg-white p-6 dark:bg-[#071a14] md:hidden">
      <div className="flex items-center justify-between"><span className="flex items-center gap-2.5 font-display text-lg font-semibold"><LogoMark className="h-9 w-9" />Planejador</span><button onClick={() => setOpen(false)} aria-label="Fechar menu" className="flex h-11 w-11 items-center justify-center"><X className="h-5 w-5" /></button></div>
      <nav className="mt-12 flex flex-col gap-3">{links.map((link) => <a key={link.href} href={link.href} onClick={() => setOpen(false)} className="flex min-h-14 items-center justify-between border-b py-3 font-display text-2xl font-semibold">{link.label}<ChevronRight className="h-5 w-5" /></a>)}</nav>
      <div className="mt-auto grid gap-3"><Link to="/login" className="flex h-14 items-center justify-center rounded-2xl border font-semibold">Entrar</Link><Link to="/registro" className="bg-gradient-accent flex h-14 items-center justify-center rounded-2xl font-semibold text-white">Começar agora</Link></div>
    </div>}
  </>;
}
