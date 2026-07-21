import type { HTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: "accent" | "coral" | "muted" | "neutral";
}

const toneClasses: Record<NonNullable<BadgeProps["tone"]>, string> = {
  accent: "bg-accent-100 text-accent-600 dark:bg-accent-600/15 dark:text-accent-400",
  coral: "bg-coral-100 text-coral-600 dark:bg-coral-500/15 dark:text-coral-500",
  muted: "bg-paper-100 text-muted-500 dark:bg-ink-800 dark:text-muted-300",
  neutral: "bg-paper-100 text-muted-500 dark:bg-ink-800 dark:text-muted-300",
};

export function Badge({ className, tone = "muted", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
