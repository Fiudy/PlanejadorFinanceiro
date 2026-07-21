import { useLayoutEffect, useRef } from "react";
import { RefreshCw, Sparkles, Users, Wallet } from "lucide-react";
import { gsap, prefersReducedMotion, ScrollTrigger } from "@/shared/lib/gsap";

export function HorizontalStoryTicker() {
  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!section || !viewport || !track || prefersReducedMotion()) return;

    const media = gsap.matchMedia();
    media.add("(min-width: 769px) and (pointer: fine)", () => {
      const context = gsap.context(() => {
        const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
        gsap.fromTo(track, { x: () => Math.min(100, viewport.clientWidth * .08) }, { x: () => -distance(), ease: "none", scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: 1, invalidateOnRefresh: true } });
      }, section);
      document.fonts.ready.then(() => ScrollTrigger.refresh());
      return () => context.revert();
    });
    return () => media.revert();
  }, []);

  const text = "font-display whitespace-nowrap text-[clamp(2.25rem,6vw,5.5rem)] font-semibold leading-[1.05] tracking-[-.04em]";
  const icon = "h-10 w-10 shrink-0 md:h-16 md:w-16";
  return <section ref={sectionRef} id="historia" className="overflow-hidden bg-ink-950 py-14 text-paper-50 md:py-16">
    <div ref={viewportRef} className="scrollbar-hidden touch-pan-x overflow-x-auto md:flex md:h-56 md:items-center md:overflow-hidden">
      <div ref={trackRef} className="flex w-max flex-nowrap items-center gap-8 px-6 md:gap-12 md:px-12">
        <span className={text}>Organize seu dinheiro</span><Sparkles aria-hidden className={`${icon} text-accent-400`} />
        <span className={text}>planeje suas metas</span><RefreshCw aria-hidden className={`${icon} text-coral-500`} />
        <span className={text}>viva com mais tranquilidade</span><Users aria-hidden className={`${icon} text-amber-500`} />
        <Wallet aria-hidden className={`${icon} text-accent-400`} />
      </div>
    </div>
  </section>;
}
