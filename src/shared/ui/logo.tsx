import { cn } from "@/shared/lib/cn";

export function LogoMark({ className }: { className?: string }) {
  return (
    <img
      src="/icons/planejador-mark.png"
      alt="Planejador"
      className={cn("h-9 w-9 object-contain", className)}
    />
  );
}
