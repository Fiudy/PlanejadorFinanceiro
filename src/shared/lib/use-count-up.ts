import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/shared/lib/gsap";

/** Anima um número de 0 até `target`, formatando cada frame via `formatter`. */
export function useCountUp(target: number, formatter: (value: number) => string, duration = 1.2): string {
  const [display, setDisplay] = useState(() => formatter(0));
  const proxyRef = useRef({ value: 0 });

  useEffect(() => {
    if (prefersReducedMotion()) return;

    const proxy = proxyRef.current;
    proxy.value = 0;
    const tween = gsap.to(proxy, {
      value: target,
      duration,
      ease: "power2.out",
      onUpdate: () => setDisplay(formatter(proxy.value)),
    });

    return () => {
      tween.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return prefersReducedMotion() ? formatter(target) : display;
}
