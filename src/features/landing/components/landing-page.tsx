import { useLayoutEffect, useRef } from "react";
import { LandingHeader } from "./landing-header";
import { EditorialHero } from "./editorial-hero";
import { HorizontalStoryTicker } from "./horizontal-story-ticker";
import { FeatureBento, FinalCta, LandingFaq, LandingFooter, OutcomeMetrics, UseCases } from "./editorial-sections";
import { gsap, prefersReducedMotion } from "@/shared/lib/gsap";

export function LandingPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) return;
    const context = gsap.context(() => {
      const sections = root.querySelectorAll<HTMLElement>("main > section:not(#historia)");
      sections.forEach((section, index) => gsap.from(section, { y: index === 0 ? 18 : 30, opacity: 0, duration: .65, ease: "expo.out", scrollTrigger: index === 0 ? undefined : { trigger: section, start: "top 90%", once: true } }));
    }, root);
    return () => context.revert();
  }, []);

  return <div ref={rootRef} className="min-h-dvh overflow-x-clip">
    <LandingHeader />
    <main>
      <EditorialHero />
      <HorizontalStoryTicker />
      <FeatureBento />
      <OutcomeMetrics />
      <UseCases />
      <LandingFaq />
      <FinalCta />
    </main>
    <LandingFooter />
  </div>;
}
