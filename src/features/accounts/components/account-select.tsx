import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Landmark, Plus, Wallet } from "lucide-react";
import type { Account } from "@/domain/entities/account";
import { ACCOUNT_TYPE_LABELS } from "@/domain/entities/account";
import { findBank } from "@/shared/lib/banks";
import { cn } from "@/shared/lib/cn";
import { AccountFormDialog } from "./account-form-dialog";

function AccountLogo({ account }: { account: Account }) {
  const bank = findBank(account.icon);
  return <span className="flex h-9 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-white p-1 dark:bg-ink-800">{bank ? <img src={bank.logo} alt="" className="h-full w-full object-contain" /> : <Wallet className="h-4 w-4" style={{ color: account.color }} />}</span>;
}

export function AccountSelect({ accounts, value, onChange, onBlur }: { accounts: Account[]; value: string; onChange: (value: string) => void; onBlur?: () => void }) {
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const active = accounts.filter((account) => !account.archived);
  const selected = active.find((account) => account.id === value);
  useEffect(() => { const close = (event: PointerEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false); }; document.addEventListener("pointerdown", close); return () => document.removeEventListener("pointerdown", close); }, []);

  return <><div ref={rootRef} className="relative">
    <button type="button" role="combobox" aria-expanded={open} aria-controls="account-options" onClick={() => setOpen((current) => !current)} onBlur={onBlur} className="flex h-12 w-full items-center gap-3 rounded-[var(--radius-control)] border bg-white px-3 text-left text-sm shadow-sm transition-all hover:border-muted-300 focus:border-accent-500 focus:outline-none focus:ring-4 focus:ring-accent-100 dark:bg-[#0b211a] dark:focus:ring-accent-600/25">
      {selected ? <><AccountLogo account={selected} /><span className="min-w-0 flex-1"><b className="block truncate font-medium">{selected.name}</b><small className="text-muted-500">{findBank(selected.icon)?.name ?? ACCOUNT_TYPE_LABELS[selected.type]}</small></span></> : <><Landmark className="h-5 w-5 text-muted-500" /><span className="flex-1 text-muted-500">Selecione uma conta</span></>}
      <ChevronDown className={cn("h-4 w-4 text-muted-500 transition-transform", open && "rotate-180")} />
    </button>
    {open && <div id="account-options" role="listbox" className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border bg-white p-1.5 shadow-xl dark:bg-[#0b211a]">
      {active.length === 0 ? <div className="px-3 py-4 text-center"><Landmark className="mx-auto h-6 w-6 text-muted-500" /><p className="mt-2 text-sm font-medium">Nenhuma conta cadastrada</p><p className="mt-1 text-xs text-muted-500">Crie uma conta bancária para registrar o lançamento.</p></div> : active.map((account) => <button key={account.id} type="button" role="option" aria-selected={account.id === value} onClick={() => { onChange(account.id); setOpen(false); }} className={cn("flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-paper-100 dark:hover:bg-white/5", account.id === value && "bg-accent-100/60 dark:bg-accent-600/15")}><AccountLogo account={account} /><span className="min-w-0 flex-1"><b className="block truncate text-sm font-medium">{account.name}</b><small className="text-xs text-muted-500">{findBank(account.icon)?.name ?? ACCOUNT_TYPE_LABELS[account.type]} · {ACCOUNT_TYPE_LABELS[account.type]}</small></span>{account.id === value && <Check className="h-4 w-4 text-accent-500" />}</button>)}
      <button type="button" onClick={() => { setOpen(false); setCreateOpen(true); }} className="mt-1 flex w-full items-center gap-2 rounded-lg border-t px-3 py-3 text-sm font-semibold text-accent-600 transition-colors hover:bg-accent-100/60 dark:text-accent-400 dark:hover:bg-accent-600/10"><Plus className="h-4 w-4" />Criar nova conta</button>
    </div>}
  </div><AccountFormDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreated={(account) => onChange(account.id)} /></>;
}
