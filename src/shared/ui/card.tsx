import type { HTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

type CardVariant = "solid" | "glass";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

export function Card({ className, variant = "solid", ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] p-5 transition-all duration-300",
        variant === "solid" &&
          "border border-border-light bg-white shadow-sm dark:border-border-dark dark:bg-ink-900",
        variant === "glass" && "glass",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4 flex items-center justify-between", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-sm font-medium text-muted-500", className)} {...props} />;
}
