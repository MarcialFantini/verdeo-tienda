/** @jsxImportSource preact */
import { useEffect, useState } from "preact/hooks";
import { addToCart } from "../../lib/cart";
import { formatPrecio } from "../../lib/site";

interface Props {
  slug: string;
  nombre: string;
  precio: number;
  imagen: string;
  stock: number;
}

/**
 * Sticky add-to-cart bar.
 * Aparece en mobile cuando el botón principal sale del viewport.
 *
 * Estrategia: IntersectionObserver sobre el sentinel "fin del carrito
 * principal" pasado por CSS (selector `.add-to-cart-sentinel`).
 */
export default function StickyAddToCart({ slug, nombre, precio, imagen, stock }: Props) {
  const [visible, setVisible] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sentinel = document.querySelector(".add-to-cart-sentinel");
    if (!sentinel) return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { rootMargin: "0px 0px 0px 0px", threshold: 0 },
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, []);

  const handleAdd = () => {
    addToCart({ slug, nombre, precio, imagen }, 1);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div
      class={`fixed inset-x-0 bottom-0 z-30 md:hidden bg-cream border-t border-[var(--color-hairline)] shadow-[0_-2px_18px_rgba(0,0,0,0.06)] transition-transform duration-300 ${visible ? "translate-y-0" : "translate-y-full"}`}
      role="region"
      aria-label="Agregar al carrito"
    >
      <div class="flex items-center gap-3 px-4 py-3">
        <img
          src={imagen}
          alt=""
          class="w-12 h-14 rounded-md object-cover bg-linen shrink-0"
          loading="lazy"
        />
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium truncate">{nombre}</div>
          <div class="text-xs text-muted tabular-nums">{formatPrecio(precio)}</div>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={stock <= 0}
          class="btn-primary text-sm px-4 py-2"
        >
          {added ? "Agregado" : stock <= 0 ? "Sin stock" : "Agregar"}
        </button>
      </div>
    </div>
  );
}
