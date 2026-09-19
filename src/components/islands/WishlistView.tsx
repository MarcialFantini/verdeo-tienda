/** @jsxImportSource preact */
import { useEffect, useState } from "preact/hooks";
import { useStore } from "@nanostores/preact";
import { addToCart } from "../../lib/cart";
import { $wishlist, clearWishlist } from "../../lib/wishlist";
import { formatPrecio } from "../../lib/site";

interface ProductRef {
  slug: string;
  nombre: string;
  imagen: string;
  imagen_alt: string;
  precio: number;
  stock: number;
  stock_bajo?: number;
  categoria: string;
}

interface Props {
  productos: ProductRef[];
}

export default function WishlistView({ productos }: Props) {
  const wishlist = useStore($wishlist);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const items = wishlist
    .map((slug) => productos.find((p) => p.slug === slug))
    .filter((p): p is ProductRef => Boolean(p));

  if (!hydrated) {
    return (
      <div class="text-muted text-center py-20">Cargando tu lista…</div>
    );
  }

  if (items.length === 0) {
    return (
      <div class="text-center py-20 md:py-28">
        <div class="display text-[44px] md:text-[64px] leading-[0.95] mb-4">
          Aún no guardaste favoritos
        </div>
        <p class="text-muted max-w-[44ch] mx-auto mb-8 leading-relaxed">
          Tocá el corazón en cualquier producto para sumarlo a esta lista. La
          lista vive en este navegador (no se envía a ningún servidor).
        </p>
        <a href="/productos" class="btn-primary">
          Explorar el catálogo
          <svg viewBox="0 0 24 24" class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <path d="M5 12h14M13 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"></path>
          </svg>
        </a>
      </div>
    );
  }

  return (
    <div>
      <div class="flex items-end justify-between mb-8 md:mb-10">
        <div>
          <div class="eyebrow mb-2">Tu lista · {items.length} producto{items.length === 1 ? "" : "s"}</div>
        </div>
        <button
          type="button"
          onClick={() => {
            if (confirm("¿Vaciar tu lista de favoritos?")) clearWishlist();
          }}
          class="text-xs text-muted hover:text-amber-deep transition-colors"
        >
          Vaciar lista
        </button>
      </div>
      <ul class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 md:gap-x-7 gap-y-10 md:gap-y-14">
        {items.map((p) => (
          <li key={p.slug}>
            <div class="bezel-outer">
              <div class="bezel-inner overflow-hidden">
                <a href={`/productos/${p.slug}`} class="block aspect-[4/5] bg-linen relative">
                  <img
                    src={p.imagen}
                    alt={p.imagen_alt}
                    loading="lazy"
                    class="w-full h-full object-cover"
                  />
                </a>
              </div>
            </div>
            <div class="px-2 mt-4 flex items-start justify-between gap-4">
              <div class="min-w-0">
                <h3 class="display text-[20px] leading-[1.1] truncate">
                  <a href={`/productos/${p.slug}`} class="hover:text-forest transition-colors">
                    {p.nombre}
                  </a>
                </h3>
                <div class="text-xs uppercase tracking-[0.18em] text-muted mt-1">
                  {p.categoria}
                </div>
              </div>
              <div class="font-medium tabular-nums text-ink shrink-0 pt-1">
                {formatPrecio(p.precio)}
              </div>
            </div>
            <div class="px-2 mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => addToCart({ slug: p.slug, nombre: p.nombre, precio: p.precio, imagen: p.imagen }, 1)}
                disabled={p.stock <= 0}
                class="flex-1 btn-primary justify-center text-sm"
              >
                {p.stock <= 0 ? "Sin stock" : "Agregar al carrito"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
