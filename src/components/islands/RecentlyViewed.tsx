/** @jsxImportSource preact */
import { useEffect, useMemo, useState } from "preact/hooks";
import { useStore } from "@nanostores/preact";
import { $recent, pushRecent } from "../../lib/recent";
import { formatPrecio } from "../../lib/site";

interface ProductRef {
  slug: string;
  nombre: string;
  imagen: string;
  imagen_alt: string;
  precio: number;
  categoria: string;
  categoriaLabel: string;
}

interface Props {
  /** Catálogo pequeño para materializar slugs recientes. */
  productos: ProductRef[];
  /** Slug a evitar (para no mostrar el producto actual). */
  excludeSlug?: string;
  /** Cantidad máxima a mostrar. Default 4. */
  max?: number;
  /** Variante: "compact" usa aspect 4/5; "wide" usa aspect 16/10. */
  size?: "compact" | "default";
}

/**
 * Strip de productos recientemente vistos.
 * Hidrata desde localStorage al mount y empuja el slug actual.
 */
export default function RecentlyViewed({ productos, excludeSlug, max = 4 }: Props) {
  const recent = useStore($recent);
  const [pushedSlug, setPushedSlug] = useState<string | null>(null);

  // Empuja el slug actual al store al montar.
  useEffect(() => {
    if (excludeSlug && pushedSlug !== excludeSlug) {
      pushRecent(excludeSlug);
      setPushedSlug(excludeSlug);
    }
  }, [excludeSlug, pushedSlug]);

  const items = useMemo(() => {
    const target = pushedSlug ? [pushedSlug, ...recent.filter((s) => s !== pushedSlug)] : recent;
    const filtered = target.filter((s) => s !== excludeSlug);
    return filtered
      .slice(0, max)
      .map((slug) => productos.find((p) => p.slug === slug))
      .filter((p): p is ProductRef => Boolean(p));
  }, [recent, excludeSlug, productos, max, pushedSlug]);

  if (items.length === 0) return null;

  return (
    <section
      class="mx-auto max-w-[1400px] px-5 md:px-10 py-12 md:py-16 border-t border-[var(--color-hairline)]"
      aria-label="Productos vistos recientemente"
    >
      <div class="mb-6">
        <div class="eyebrow mb-2">Visto recientemente</div>
        <h2 class="display text-[24px] md:text-[32px] leading-[1]">
          Para volver a mirarlos
        </h2>
      </div>
      <ul class="grid grid-cols-2 md:grid-cols-4 gap-x-4 md:gap-x-7 gap-y-8">
        {items.map((p) => (
          <li key={p.slug}>
            <a href={`/productos/${p.slug}`} class="block group">
              <div class="bezel-outer">
                <div class="bezel-inner overflow-hidden">
                  <div class="aspect-[4/5] bg-linen">
                    <img
                      src={p.imagen}
                      alt={p.imagen_alt}
                      loading="lazy"
                      decoding="async"
                      class="w-full h-full object-cover transition-transform duration-[1200ms] ease-[var(--ease-fluid)] group-hover:scale-[1.04]"
                    />
                  </div>
                </div>
              </div>
              <div class="mt-3 px-1">
                <div class="display text-[16px] md:text-[18px] leading-tight truncate">
                  {p.nombre}
                </div>
                <div class="text-sm text-muted tabular-nums mt-1">
                  {formatPrecio(p.precio)}
                </div>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
