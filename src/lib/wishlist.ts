/**
 * Wishlist — slugs de productos guardados por la clienta.
 * Persistido en localStorage bajo "verdeo:wishlist:v1".
 */

import { atom, computed } from "nanostores";
import { persistentAtom } from "@nanostores/persistent";

const initial: string[] = [];

function decode(raw: unknown): string[] {
  if (!Array.isArray(raw)) return initial;
  return raw.filter((s): s is string => typeof s === "string" && s.length > 0 && s.length < 80);
}

export const $wishlist = persistentAtom<string[]>("verdeo:wishlist:v1", initial, {
  encode: JSON.stringify,
  decode: (raw) => {
    try {
      return decode(JSON.parse(raw));
    } catch {
      return initial;
    }
  },
});

/** Cross-tab sync: wishlist agregada en otra pestaña se ve acá. */
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== "verdeo:wishlist:v1") return;
    if (e.newValue === null) {
      $wishlist.set([]);
      return;
    }
    try {
      $wishlist.set(decode(JSON.parse(e.newValue)));
    } catch {
      /* ignore */
    }
  });
}

export const $wishlistCount = computed($wishlist, (items) => items.length);

/** Toggle de un slug en la wishlist. Devuelve el nuevo estado. */
export function toggleWishlist(slug: string): boolean {
  const current = $wishlist.get();
  if (current.includes(slug)) {
    $wishlist.set(current.filter((s) => s !== slug));
    return false;
  }
  $wishlist.set([...current, slug]);
  return true;
}

export function addToWishlist(slug: string): void {
  const current = $wishlist.get();
  if (!current.includes(slug)) $wishlist.set([...current, slug]);
}

export function removeFromWishlist(slug: string): void {
  $wishlist.set($wishlist.get().filter((s) => s !== slug));
}

export function clearWishlist(): void {
  $wishlist.set([]);
}

/** Helper para hydratar el estado en SSR sin tocar storage. */
export const $wishlistSnapshot = atom<string[]>(initial);

export { atom };
