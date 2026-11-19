/** GSAP and its plugins are loaded on demand so they never block the first paint. */
import type { gsap as GsapType } from 'gsap';

type Gsap = typeof GsapType;

let core: Promise<Gsap> | null = null;

export function loadGsap(): Promise<Gsap> {
  core ??= import('gsap').then((m) => m.gsap);
  return core;
}

export async function loadScrollTrigger() {
  const [gsap, { ScrollTrigger }] = await Promise.all([loadGsap(), import('gsap/ScrollTrigger')]);
  gsap.registerPlugin(ScrollTrigger);
  return { gsap, ScrollTrigger };
}

export async function loadFlip() {
  const [gsap, { Flip }] = await Promise.all([loadGsap(), import('gsap/Flip')]);
  gsap.registerPlugin(Flip);
  return { gsap, Flip };
}

export async function loadDraggable() {
  const [gsap, { Draggable }] = await Promise.all([loadGsap(), import('gsap/Draggable')]);
  gsap.registerPlugin(Draggable);
  return { gsap, Draggable };
}

export async function loadMotionPath() {
  const [gsap, { MotionPathPlugin }] = await Promise.all([loadGsap(), import('gsap/MotionPathPlugin')]);
  gsap.registerPlugin(MotionPathPlugin);
  return { gsap, MotionPathPlugin };
}
