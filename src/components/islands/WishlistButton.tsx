/** @jsxImportSource preact */
import { useStore } from "@nanostores/preact";
import { $wishlist, toggleWishlist } from "../../lib/wishlist";

/**
 * Botón corazón para wishlist.
 *
 * - Estado inicial: hidrata desde localStorage al primer tick.
 * - Hidratado: actualiza el store (persiste) y dispara feedback visual.
 *
 * Úsalo en ProductCard y en /productos/[slug] (detail).
 */
interface Props {
  slug: string;
  nombre: string;
  /** Tamaño del icono (afecta padding del botón). */
  size?: "sm" | "md";
  /** Mostrar texto al costado. Default false (icon-only). */
  withLabel?: boolean;
}

export default function WishlistButton({
  slug,
  nombre,
  size = "md",
  withLabel = false,
}: Props) {
  const wishlist = useStore($wishlist);
  const active = wishlist.includes(slug);

  const onClick = (e: Event) => {
    // Evita que el click abra la ficha.
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(slug);
  };

  const pad = size === "sm" ? "p-1.5" : "p-2";
  const iconSize = size === "sm" ? "w-4 h-4" : "w-5 h-5";

  return (
    <button
      type="button"
      onClick={onClick}
      class={`${pad} rounded-full bg-cream/90 backdrop-blur-sm border border-[var(--color-hairline)] text-ink hover:border-amber hover:text-amber-deep transition-colors duration-300 inline-flex items-center gap-1.5 aria-pressed:opacity-90`}
      aria-pressed={active}
      aria-label={
        active ? `Quitar ${nombre} de tu lista de deseos` : `Guardar ${nombre} en tu lista de deseos`
      }
    >
      <svg
        viewBox="0 0 24 24"
        class={iconSize}
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        stroke-width="1.5"
        aria-hidden="true"
      >
        <path
          d="M12 21s-7-4.5-9.5-9.5C1 8.5 3 4.5 7 4.5c2 0 3.5 1 5 3 1.5-2 3-3 5-3 4 0 6 4 4.5 7C19 16.5 12 21 12 21z"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      {withLabel && (
        <span class="text-xs">{active ? "En tu lista" : "Guardar"}</span>
      )}
    </button>
  );
}
