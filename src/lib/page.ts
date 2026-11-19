/**
 * View lifecycle helpers for Astro's ClientRouter: run an initializer for each matching element
 * on every page load, and its cleanup before the next swap.
 */
type Cleanup = void | (() => void);

const cleanups = new Set<() => void>();
let wired = false;

function wire(): void {
  if (wired) return;
  wired = true;
  document.addEventListener('astro:before-swap', () => {
    cleanups.forEach((fn) => {
      try {
        fn();
      } catch {
        /* ignore teardown errors */
      }
    });
    cleanups.clear();
  });
}

export function mount<T extends HTMLElement = HTMLElement>(selector: string, init: (el: T) => Cleanup): void {
  wire();
  const seen = new WeakSet<Element>();
  const run = () => {
    document.querySelectorAll<T>(selector).forEach((el) => {
      if (seen.has(el)) return;
      seen.add(el);
      const cleanup = init(el);
      if (typeof cleanup === 'function') cleanups.add(cleanup);
    });
  };
  document.addEventListener('astro:page-load', run);
  if (document.readyState !== 'loading') run();
}

export const prefersReducedMotion = (): boolean => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const isShowcase = (): boolean => new URLSearchParams(window.location.search).has('showcase');

/** `?still`: clean in-memory session without the showcase timeline (used to capture the poster). */
export const isStill = (): boolean => new URLSearchParams(window.location.search).has('still');

export function idle(fn: () => void, timeout = 1200): void {
  if ('requestIdleCallback' in window) window.requestIdleCallback(fn, { timeout });
  else setTimeout(fn, 200);
}

/** Calls fn once the element is near the viewport. */
export function whenVisible(el: Element, fn: () => void, rootMargin = '300px'): () => void {
  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        fn();
      }
    },
    { rootMargin },
  );
  io.observe(el);
  return () => io.disconnect();
}

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (text !== undefined) node.textContent = text;
  return node;
}

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c);
}
