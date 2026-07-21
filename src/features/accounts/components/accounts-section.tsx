import { useState } from "react";
import { Plus, Wallet, Archive, Pencil } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { useAccounts, useArchiveAccount } from "../hooks/use-accounts";
import { AccountFormDialog } from "./account-form-dialog";
import { ACCOUNT_TYPE_LABELS } from "@/domain/entities/account";
import type { Account } from "@/domain/entities/account";
import { findBank } from "@/shared/lib/banks";

function AccountBankMark({ icon, color }: { icon: string; color: string }) {
  const bank = findBank(icon);
  return <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1.5 dark:bg-ink-800" style={{ borderColor: `${color}55` }}>{bank ? <img src={bank.logo} alt={bank.name} className="h-full w-full object-contain" /> : <Wallet className="h-4 w-4" style={{ color }} />}</div>;
}

function accountInstitution(icon: string) {
  return findBank(icon)?.name ?? (icon.startsWith("custom:") ? icon.slice(7) : undefined);
}

export function AccountsSection() {
  const { data: accounts = [] } = useAccounts();
  const archiveAccount = useArchiveAccount();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [pendingArchive, setPendingArchive] = useState<Account | null>(null);
  const activeAccounts = accounts.filter((account) => !account.archived);

  const openCreate = () => {
    setEditingAccount(null);
    setDialogOpen(true);
  };
  const openEdit = (account: Account) => {
    setEditingAccount(account);
    setDialogOpen(true);
  };
  const closeDialog = () => {
    setDialogOpen(false);
    setEditingAccount(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contas</CardTitle>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-3.5 w-3.5" />
          Nova
        </Button>
      </CardHeader>

      {activeAccounts.length === 0 ? (
        <EmptyState icon={Wallet} title="Nenhuma conta" description="Crie sua primeira conta para começar a registrar lançamentos." />
      ) : (
        <ul className="flex flex-col divide-y divide-border-light dark:divide-border-dark">
          {activeAccounts.map((account) => (
            <li key={account.id} className="flex items-center justify-between gap-2 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <AccountBankMark icon={account.icon} color={account.color} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-950 dark:text-paper-50">{account.name}</p>
                  <p className="truncate text-xs text-muted-500">{[accountInstitution(account.icon), ACCOUNT_TYPE_LABELS[account.type]].filter(Boolean).join(" · ")}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center">
                <Button variant="ghost" size="icon" aria-label="Editar conta" onClick={() => openEdit(account)}>
                  <Pencil className="h-4 w-4 text-muted-500" />
                </Button>
                <Button variant="ghost" size="icon" aria-label="Arquivar conta" onClick={() => setPendingArchive(account)}>
                  <Archive className="h-4 w-4 text-muted-500" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AccountFormDialog open={dialogOpen} onClose={closeDialog} account={editingAccount ?? undefined} />

      <ConfirmDialog
        open={pendingArchive !== null}
        onClose={() => setPendingArchive(null)}
        onConfirm={() => {
          if (!pendingArchive) return;
          archiveAccount.mutate(pendingArchive.id, { onSuccess: () => setPendingArchive(null) });
        }}
        title="Arquivar conta"
        description={`"${pendingArchive?.name ?? ""}" deixará de aparecer nos formulários e no saldo consolidado. Você pode reativá-la depois pelo suporte.`}
        confirmLabel="Arquivar"
        isLoading={archiveAccount.isPending}
      />
    </Card>
  );
}
