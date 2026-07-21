import type { SelectHTMLAttributes} from "react";
import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <div className="group relative">
      <select
        ref={ref}
        className={cn(
          "h-12 w-full cursor-pointer appearance-none rounded-[var(--radius-control)] border border-border-light bg-white px-4 pr-10 text-sm font-medium shadow-sm transition-all duration-150",
          "hover:border-muted-300 hover:shadow-md",
          "focus:border-accent-500 focus:outline-none focus:ring-4 focus:ring-accent-100",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "dark:border-border-dark dark:bg-ink-800 dark:text-paper-50 dark:hover:border-muted-500 dark:focus:ring-accent-600/25",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <span className="pointer-events-none absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-500 transition-colors duration-150 group-focus-within:bg-accent-100 group-focus-within:text-accent-600 dark:group-focus-within:bg-accent-600/15 dark:group-focus-within:text-accent-400">
        <ChevronDown className="h-4 w-4 transition-transform duration-150 group-focus-within:rotate-180" />
      </span>
    </div>
  ),
);
Select.displayName = "Select";
