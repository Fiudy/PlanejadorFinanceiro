import type { PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useRef } from "react";
import type { Card as CardEntity } from "@/domain/entities/card";
import type { Money } from "@/domain/value-objects/money";
import { cn } from "@/shared/lib/cn";
import { gsap, prefersReducedMotion } from "@/shared/lib/gsap";
import { findBank } from "@/shared/lib/banks";

function animateScale(target: Element, scale: number, duration = 0.2) {
  if (prefersReducedMotion()) return;
  gsap.to(target, { scale, duration, ease: "power2.out" });
}

export function CardTile({
  card,
  availableLimit,
  selected,
  onClick,
}: {
  card: CardEntity;
  availableLimit?: Money;
  selected: boolean;
  onClick: () => void;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const restingScale = selected ? 1.02 : 1;

  // Escala de repouso reage à seleção; o press (pointerdown/up) anima a
  // partir dela, então os dois nunca competem pelo mesmo transform.
  useEffect(() => {
    if (buttonRef.current) animateScale(buttonRef.current, restingScale);
  }, [restingScale]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) =>
    animateScale(event.currentTarget, 0.97, 0.12);
  const resetScale = () => {
    if (buttonRef.current) animateScale(buttonRef.current, restingScale);
  };

  const usedRatio = availableLimit
    ? 1 - availableLimit.inCents / Math.max(card.limit.inCents, 1)
    : 0;
  const bank = findBank(card.bank);

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      onPointerDown={handlePointerDown}
      onPointerUp={resetScale}
      onPointerLeave={resetScale}
      className={cn(
        "w-64 shrink-0 rounded-[var(--radius-card)] p-5 text-left text-white shadow-sm",
        selected ? "ring-2 ring-offset-2 ring-offset-paper-50 dark:ring-offset-ink-950" : "opacity-90",
      )}
      style={{ backgroundColor: card.color, ...(selected ? { boxShadow: `0 0 0 2px ${card.color}` } : {}) }}
    >
      <div className="flex min-h-8 items-center justify-between gap-3"><p className="text-xs uppercase tracking-wide text-white/70">{card.bank}</p>{bank && <span className="flex h-8 w-14 items-center justify-center rounded-lg bg-white/90 p-1.5"><img src={bank.logo} alt={bank.name} className="h-full w-full object-contain" /></span>}</div>
      <p className="mt-1 font-display text-lg font-semibold">{card.name}</p>
      <div className="mt-6 flex items-end justify-between">
        <div>
          <p className="text-[11px] text-white/70">Disponível</p>
          <p className="tabular text-base font-semibold">{(availableLimit ?? card.limit).format()}</p>
        </div>
        <p className="text-[11px] text-white/70">Vence dia {card.dueDay}</p>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
        <div className="h-full rounded-full bg-white/80" style={{ width: `${Math.min(100, Math.max(0, usedRatio * 100))}%` }} />
      </div>
    </button>
  );
}
