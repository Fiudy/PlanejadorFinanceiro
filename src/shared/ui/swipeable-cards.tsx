import type { ReactNode } from "react";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/shared/lib/cn";

/**
 * Carrossel de cartões navegável por swipe (scroll-snap nativo, funciona em
 * touch sem JS de arraste) com setas e indicadores para desktop/acessibilidade.
 */
export function SwipeableCards({ children }: { children: ReactNode[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const count = children.length;

  const scrollToIndex = (index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(count - 1, index));
    track.scrollTo({ left: clamped * track.clientWidth, behavior: "smooth" });
  };

  const handleScroll = () => {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    setActive(Math.round(track.scrollLeft / track.clientWidth));
  };

  return (
    <div>
      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hidden"
      >
        {children.map((child, index) => (
          <div key={index} className="w-full shrink-0 snap-center px-0.5">
            {child}
          </div>
        ))}
      </div>

      {count > 1 && (
        <div className="mt-4 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => scrollToIndex(active - 1)}
            disabled={active === 0}
            aria-label="Anterior"
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-500 transition-opacity hover:bg-paper-100 disabled:opacity-30 dark:hover:bg-ink-800"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex gap-1.5">
            {children.map((_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Ir para o cartão ${index + 1}`}
                onClick={() => scrollToIndex(index)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  index === active ? "w-5 bg-accent-500" : "w-1.5 bg-paper-100 dark:bg-ink-700",
                )}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => scrollToIndex(active + 1)}
            disabled={active === count - 1}
            aria-label="Próximo"
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-500 transition-opacity hover:bg-paper-100 disabled:opacity-30 dark:hover:bg-ink-800"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
