import { Landmark } from "lucide-react";
import { BANKS } from "@/shared/lib/banks";
import { cn } from "@/shared/lib/cn";

export function BankPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
    {BANKS.map((bank) => <button key={bank.id} type="button" onClick={() => onChange(bank.id)} className={cn("flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border bg-white p-2 text-center text-[11px] font-medium transition-all hover:border-accent-400 dark:bg-ink-800", value === bank.id && "border-accent-500 bg-accent-100/50 ring-1 ring-accent-500 dark:bg-accent-600/10")} aria-pressed={value === bank.id}>
      <img src={bank.logo} alt="" className="h-8 w-12 object-contain" />
      <span>{bank.name}</span>
    </button>)}
    <button type="button" onClick={() => onChange("outro")} className={cn("flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border bg-white p-2 text-center text-[11px] font-medium transition-all hover:border-accent-400 dark:bg-ink-800", value === "outro" && "border-accent-500 bg-accent-100/50 ring-1 ring-accent-500 dark:bg-accent-600/10")} aria-pressed={value === "outro"}><Landmark className="h-7 w-7 text-muted-500" /><span>Outro banco</span></button>
  </div>;
}
