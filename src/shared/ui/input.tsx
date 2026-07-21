import type { InputHTMLAttributes, LabelHTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";
import { cn } from "@/shared/lib/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, error, ...props }, ref) => (
  <div className="w-full">
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-[var(--radius-control)] border border-border-light bg-white px-3.5 text-sm shadow-sm transition-all duration-150",
        "placeholder:text-muted-300 hover:border-muted-300 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-100",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "dark:border-border-dark dark:bg-ink-800 dark:text-paper-50 dark:hover:border-muted-500 dark:focus:ring-accent-600/20",
        error && "border-coral-500 hover:border-coral-500 focus:border-coral-500 focus:ring-coral-100",
        className,
      )}
      {...props}
    />
    {error && <p className="mt-1.5 text-xs text-coral-500">{error}</p>}
  </div>
));
Input.displayName = "Input";

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-sm font-medium text-ink-950 dark:text-paper-50", className)}
      {...props}
    />
  );
}

export function Field({ label, children, htmlFor }: { label: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
