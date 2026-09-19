/**
 * Recently viewed — últimos N slugs vistos por la clienta.
 * Persistido en localStorage bajo "verdeo:recent:v1".
 *
 * Estrategia: el detail page empuja su slug al store en mount.
 * El componente RecentlyViewed lee los N más recientes y los materializa
 * contra el catálogo server-renderizado.
 */

import { atom, computed } from "nanostores";
import { persistentAtom } from "@nanostores/persistent";

const MAX = 8;

const initial: string[] = [];

function sanitize(arr: unknown, max: number): string[] {
  if (!Array.isArray(arr)) return initial;
  return arr
    .filter((s): s is string => typeof s === "string" && s.length > 0 && s.length < 80)
    .slice(0, max);
}

export const $recent = persistentAtom<string[]>("verdeo:recent:v1", initial, {
  encode: JSON.stringify,
  decode: (raw) => {
    try {
      return sanitize(JSON.parse(raw), MAX);
    } catch {
      return initial;
    }
  },
});

/** Cross-tab sync: el recently viewed de la otra pestaña también vale. */
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== "verdeo:recent:v1") return;
    if (e.newValue === null) {
      $recent.set([]);
      return;
    }
    try {
      $recent.set(sanitize(JSON.parse(e.newValue), MAX));
    } catch {
      /* ignore */
    }
  });
}

export const $recentCount = computed($recent, (items) => items.length);

/**
 * Empuja un slug al frente, descartando duplicados ya presentes y
 * limitando la lista a MAX.
 */
export function pushRecent(slug: string): void {
  const cur = $recent.get().filter((s) => s !== slug);
  const next = [slug, ...cur].slice(0, MAX);
  $recent.set(next);
}

export function clearRecent(): void {
  $recent.set([]);
}

export { atom };
