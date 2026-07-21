import type { ButtonHTMLAttributes, PointerEvent as ReactPointerEvent } from "react";
import { forwardRef } from "react";
import { cn } from "@/shared/lib/cn";
import { gsap, prefersReducedMotion } from "@/shared/lib/gsap";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-gradient-accent text-white shadow-sm hover:shadow-[0_0_20px_rgba(15,123,92,0.5)] active:brightness-95",
  secondary:
    "bg-paper-100 text-ink-950 hover:bg-paper-100/70 dark:bg-ink-800 dark:text-paper-50 dark:hover:bg-ink-700",
  ghost: "bg-transparent text-ink-950 hover:bg-paper-100 dark:text-paper-50 dark:hover:bg-ink-800",
  danger: "bg-coral-500 text-white shadow-sm hover:bg-coral-600 hover:shadow",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-5 text-base gap-2",
  icon: "h-10 w-10 justify-center",
};

/** Microinteração de press (scale 0.97) apenas no variant="primary" — os demais não pedem esse feedback. */
function pressScale(target: EventTarget, scale: number) {
  if (prefersReducedMotion()) return;
  gsap.to(target, { scale, duration: scale < 1 ? 0.12 : 0.2, ease: "power2.out" });
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", onPointerDown, onPointerUp, onPointerLeave, ...props }, ref) => {
    const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (variant === "primary") pressScale(event.currentTarget, 0.97);
      onPointerDown?.(event);
    };
    const handlePointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (variant === "primary") pressScale(event.currentTarget, 1);
      onPointerUp?.(event);
    };
    const handlePointerLeave = (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (variant === "primary") pressScale(event.currentTarget, 1);
      onPointerLeave?.(event);
    };

    return (
      <button
        ref={ref}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        className={cn(
          "inline-flex items-center rounded-[var(--radius-control)] font-medium transition-all duration-150",
          "disabled:opacity-50 disabled:pointer-events-none",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
