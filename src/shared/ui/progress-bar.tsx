import { cn } from "@/shared/lib/cn";

export function ProgressBar({
  value,
  tone = "accent",
  className,
}: {
  value: number; // 0..1
  tone?: "accent" | "coral";
  className?: string;
}) {
  const clamped = Math.min(1, Math.max(0, value));
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-paper-100 dark:bg-ink-800", className)}>
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500",
          tone === "accent" ? "bg-gradient-accent" : "bg-coral-500",
        )}
        style={{ width: `${clamped * 100}%` }}
      />
    </div>
  );
}
