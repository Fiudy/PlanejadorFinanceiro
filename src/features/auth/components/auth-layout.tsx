import type { ReactNode } from "react";
import { LogoMark } from "@/shared/ui/logo";

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <LogoMark className="mb-3 h-14 w-14" />
          <h1 className="font-display text-xl font-semibold text-ink-950 dark:text-paper-50">{title}</h1>
          <p className="mt-1 text-sm text-muted-500">{subtitle}</p>
        </div>
        <div className="rounded-[var(--radius-card)] border border-border-light/70 bg-white/70 p-6 shadow-sm backdrop-blur-xl dark:border-border-dark/60 dark:bg-ink-900/55">
          {children}
        </div>
      </div>
    </div>
  );
}
