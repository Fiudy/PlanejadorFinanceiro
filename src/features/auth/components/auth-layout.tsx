import type { ReactNode } from "react";
import { LogoMark } from "@/shared/ui/logo";

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[radial-gradient(circle_at_25%_20%,rgba(15,123,92,.16),transparent_35%)] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <LogoMark className="mb-3 h-14 w-14" />
          <h1 className="font-display text-xl font-semibold text-ink-950 dark:text-paper-50">{title}</h1>
          <p className="mt-1 text-sm text-muted-500">{subtitle}</p>
        </div>
        <div className="rounded-2xl border border-border-light bg-white p-6 shadow-xl shadow-ink-950/5 dark:border-[#292d35] dark:bg-[#111318] dark:shadow-black/40">
          {children}
        </div>
      </div>
    </div>
  );
}
