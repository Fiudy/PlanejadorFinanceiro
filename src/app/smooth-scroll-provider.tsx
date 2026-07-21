import type { ReactNode, RefObject } from "react";
import { createContext, useContext, useEffect, useRef } from "react";
import Lenis from "lenis";
import { ScrollTrigger, prefersReducedMotion } from "@/shared/lib/gsap";

const ScrollerContext = createContext<RefObject<HTMLElement | null> | null>(null);

/** Elemento que realmente rola a página (o `<main>` gerenciado por este provider) — usado por ScrollTrigger fora daqui. */
export function useScroller() {
  return useContext(ScrollerContext);
}

/**
 * Inicializa o Lenis uma única vez, no nível do AppShell, aplicando scroll
 * suave a todas as páginas que passam por ele. Rola o próprio `<main>`
 * (não a window), então é ele — e não document — quem vira o `wrapper`
 * do Lenis e o `scroller` de qualquer ScrollTrigger criado por baixo.
 * Se o usuário preferir menos movimento, o Lenis nem é criado e o
 * elemento continua rolando nativamente.
 */
export function SmoothScrollProvider({
  children,
  className,
  contentClassName,
}: {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  const wrapperRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const content = contentRef.current;
    const usesTouchNavigation = window.matchMedia("(max-width: 639px), (pointer: coarse)").matches;
    if (!wrapper || !content || prefersReducedMotion() || usesTouchNavigation) return;

    const lenis = new Lenis({ wrapper, content });
    lenis.on("scroll", ScrollTrigger.update);

    let frameId: number;
    const raf = (time: number) => {
      lenis.raf(time);
      frameId = requestAnimationFrame(raf);
    };
    frameId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frameId);
      lenis.destroy();
    };
  }, []);

  return (
    <main ref={wrapperRef} className={className} style={{ touchAction: "pan-y" }}>
      <div ref={contentRef} className={contentClassName}>
        <ScrollerContext.Provider value={wrapperRef}>{children}</ScrollerContext.Provider>
      </div>
    </main>
  );
}
