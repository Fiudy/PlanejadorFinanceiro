import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed border-border-light px-6 py-14 text-center dark:border-border-dark">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-paper-100 dark:bg-ink-800">
        <Icon className="h-6 w-6 text-muted-500" />
      </div>
      <p className="text-sm font-medium text-ink-950 dark:text-paper-50">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-muted-500">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
