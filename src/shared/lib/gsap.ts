import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Draggable } from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";

/**
 * Ponto único de registro dos plugins do GSAP. Qualquer componente que
 * precise de gsap/ScrollTrigger/Draggable deve importar deste módulo (e
 * não de "gsap" diretamente), para evitar registerPlugin duplicado.
 */
gsap.registerPlugin(ScrollTrigger, Draggable, InertiaPlugin);

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export { gsap, ScrollTrigger, Draggable, InertiaPlugin };
