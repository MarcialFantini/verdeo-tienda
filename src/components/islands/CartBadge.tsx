/** @jsxImportSource preact */
import { useStore } from "@nanostores/preact";
import { $cartCount } from "../../lib/cart";

/**
 * Badge que muestra la cantidad de unidades en el carrito.
 * Se hidrata con client:load y, para evitar mismatch de SSR,
 * devuelve null mientras el contador es 0 (el HTML server y
 * el primer render client coinciden).
 */
export default function CartBadge() {
  const count = useStore($cartCount);

  if (count === 0) return null;

  return (
    <span
      class="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-amber text-cream text-[11px] font-medium tabular-nums leading-none"
      aria-label={`${count} ${count === 1 ? "producto" : "productos"} en el carrito`}
    >
      {count}
    </span>
  );
}
