/** @jsxImportSource preact */
import { useStore } from "@nanostores/preact";
import { $wishlistCount } from "../../lib/wishlist";

/**
 * Chip de la wishlist que muestra cuántas favoritas tiene la clienta.
 * Devuelve null cuando count === 0 (para que el HTML server y el primer
 * render client coincidan y no haya mismatch de hidratación).
 */
export default function WishlistChip() {
  const count = useStore($wishlistCount);

  if (count === 0) return null;

  return (
    <span
      class="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-amber text-cream text-[11px] font-medium tabular-nums leading-none"
      aria-label={`${count} ${count === 1 ? "producto favorito" : "productos favoritos"}`}
    >
      {count}
    </span>
  );
}
