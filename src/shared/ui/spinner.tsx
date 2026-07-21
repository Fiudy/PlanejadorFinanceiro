import { cn } from "@/shared/lib/cn";

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Carregando"
      className={cn(
        "h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent text-accent-500",
        className,
      )}
    />
  );
}

export function PageSpinner() {
  return (
    <div className="flex h-full min-h-[40vh] w-full items-center justify-center">
      <Spinner className="h-7 w-7" />
    </div>
  );
}
