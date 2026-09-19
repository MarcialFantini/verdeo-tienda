/** @jsxImportSource preact */
import { useEffect, useMemo, useState } from "preact/hooks";
import { addToCart } from "../../lib/cart";
import { formatPrecio, SORT_OPTIONS, type SortKey, normalizeForSearch, stockLabel, stockLabelTexto } from "../../lib/site";

/**
 * Catálogo interactivo: filtros (precio, aromas, ingredientes, materiales),
 * sort, búsqueda en vivo y productos.
 *
 * El componente es client:only="preact" porque la lógica es interactiva y
 * depende de window.matchMedia (sin animaciones, etc.).
 *
 * El producto se renderiza inline (sin ProductCard.astro) para mantener
 * las islas aisladas del HTML estático pre-renderizado y reducir costos
 * cuando se filtran o cambian de orden.
 */

interface ProductSummary {
  slug: string;
  nombre: string;
  categoria: string;
  categoriaId: string;
  precio: number;
  descripcion_corta: string;
  imagen: string;
  imagen_alt: string;
  rating_promedio?: number;
  rating_cantidad?: number;
  ventas_simuladas?: number;
  fecha_agregado?: string;
  aromas?: string[];
  ingredientes_tags?: string[];
  materiales?: string[];
  stock: number;
  stock_bajo?: number;
  es_bundle?: boolean;
}

interface Props {
  productos: ProductSummary[];
  categoriaInicial: string | null;
}

type Cat = "todas" | string;

const categoriaLabel = (id: string) => {
  const map: Record<string, string> = {
    velas: "Velas",
    difusores: "Difusores",
    jabones: "Jabones",
    textiles: "Textiles",
    bundles: "Kits & bundles",
    todas: "Todos",
  };
  return map[id] ?? id;
};

export default function CatalogBrowser({ productos, categoriaInicial }: Props) {
  const [categoria, setCategoria] = useState<Cat>(categoriaInicial ?? "todas");
  const [precioMin, setPrecioMin] = useState<string>("");
  const [precioMax, setPrecioMax] = useState<string>("");
  const [aromaSel, setAromaSel] = useState<string>("");
  const [ingredienteSel, setIngredienteSel] = useState<string>("");
  const [materialSel, setMaterialSel] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [sort, setSort] = useState<SortKey>("relevancia");
  const [addedSlug, setAddedSlug] = useState<string | null>(null);

  // Opciones derivadas de los productos (sólo las que existen en el set).
  const aromas = useMemo(
    () =>
      Array.from(
        new Set(productos.flatMap((p) => p.aromas ?? []).filter(Boolean)),
      ).sort(),
    [productos],
  );
  const ingredientes = useMemo(
    () =>
      Array.from(
        new Set(
          productos.flatMap((p) => p.ingredientes_tags ?? []).filter(Boolean),
        ),
      ).sort(),
    [productos],
  );
  const materiales = useMemo(
    () =>
      Array.from(
        new Set(productos.flatMap((p) => p.materiales ?? []).filter(Boolean)),
      ).sort(),
    [productos],
  );

  // Mantener categoría en la URL (?cat=) sin romper SSR.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (categoria === "todas") url.searchParams.delete("cat");
    else url.searchParams.set("cat", categoria);
    window.history.replaceState({}, "", url.toString());
  }, [categoria]);

  const filtrados = useMemo(() => {
    const searchKey = normalizeForSearch(search.trim());
    const min = precioMin === "" ? 0 : Number(precioMin) || 0;
    const max = precioMax === "" ? Infinity : Number(precioMax) || Infinity;

    return productos.filter((p) => {
      if (categoria !== "todas" && p.categoria !== categoria) return false;
      if (p.precio < min || p.precio > max) return false;
      if (aromaSel && !(p.aromas ?? []).includes(aromaSel)) return false;
      if (ingredienteSel && !(p.ingredientes_tags ?? []).includes(ingredienteSel))
        return false;
      if (materialSel && !(p.materiales ?? []).includes(materialSel)) return false;
      if (searchKey) {
        const texto = normalizeForSearch(
          [p.nombre, p.descripcion_corta, ...(p.aromas ?? []), ...(p.ingredientes_tags ?? []), ...(p.materiales ?? [])].join(" "),
        );
        if (!texto.includes(searchKey)) return false;
      }
      return true;
    });
  }, [productos, categoria, precioMin, precioMax, aromaSel, ingredienteSel, materialSel, search]);

  const ordenados = useMemo(() => {
    const arr = filtrados.slice();
    arr.sort((a, b) => {
      if (sort === "precio_asc") return a.precio - b.precio;
      if (sort === "precio_desc") return b.precio - a.precio;
      if (sort === "rating_desc") {
        const ra = a.rating_promedio ?? 0;
        const rb = b.rating_promedio ?? 0;
        return rb - ra;
      }
      if (sort === "mas_vendidos") {
        return (b.ventas_simuladas ?? 0) - (a.ventas_simuladas ?? 0);
      }
      if (sort === "mas_recientes") {
        const fa = a.fecha_agregado ?? "";
        const fb = b.fecha_agregado ?? "";
        return fb.localeCompare(fa);
      }
      // relevancia: ordenar por rating + ventas (heurística barata).
      const sa = (a.rating_promedio ?? 0) * 10 + Math.log10((a.ventas_simuladas ?? 0) + 1);
      const sb = (b.rating_promedio ?? 0) * 10 + Math.log10((b.ventas_simuladas ?? 0) + 1);
      return sb - sa;
    });
    return arr;
  }, [filtrados, sort]);

  const categorias = useMemo(() => {
    const set = new Set<string>(["todas"]);
    productos.forEach((p) => set.add(p.categoria));
    return Array.from(set);
  }, [productos]);

  const handleAdd = (p: ProductSummary) => {
    addToCart(
      {
        slug: p.slug,
        nombre: p.nombre,
        precio: p.precio,
        imagen: p.imagen,
      },
      1,
    );
    setAddedSlug(p.slug);
    if (typeof window !== "undefined") {
      window.setTimeout(() => setAddedSlug(null), 1800);
    }
  };

  const limpiarFiltros = () => {
    setPrecioMin("");
    setPrecioMax("");
    setAromaSel("");
    setIngredienteSel("");
    setMaterialSel("");
    setSearch("");
  };

  return (
    <div class="flex flex-col gap-8">
      {/* Search + sort row */}
      <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div class="flex-1 max-w-md">
          <label for="search" class="label">Buscar</label>
          <div class="relative">
            <input
              id="search"
              type="search"
              class="field pl-10"
              placeholder="Ej.: lavanda, romero, lino…"
              value={search}
              onInput={(e) => setSearch((e.currentTarget as HTMLInputElement).value)}
              aria-label="Buscar productos"
            />
            <svg
              viewBox="0 0 24 24"
              class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-soft pointer-events-none"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.35-4.35" stroke-linecap="round" />
            </svg>
          </div>
        </div>
        <div class="flex items-end gap-3">
          <div>
            <label for="sort" class="label">Ordenar por</label>
            <select
              id="sort"
              class="field"
              value={sort}
              onChange={(e) => setSort((e.currentTarget as HTMLSelectElement).value as SortKey)}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div class="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
        <div>
          <label for="cat" class="label">Categoría</label>
          <select
            id="cat"
            class="field"
            value={categoria}
            onChange={(e) => setCategoria((e.currentTarget as HTMLSelectElement).value as Cat)}
          >
            {categorias.map((c) => (
              <option key={c} value={c}>{categoriaLabel(c)}</option>
            ))}
          </select>
        </div>
        <div>
          <label for="min" class="label">Precio mín. (ARS)</label>
          <input
            id="min"
            type="number"
            inputMode="numeric"
            min="0"
            class="field"
            placeholder="0"
            value={precioMin}
            onInput={(e) => setPrecioMin((e.currentTarget as HTMLInputElement).value)}
          />
        </div>
        <div>
          <label for="max" class="label">Precio máx. (ARS)</label>
          <input
            id="max"
            type="number"
            inputMode="numeric"
            min="0"
            class="field"
            placeholder="∞"
            value={precioMax}
            onInput={(e) => setPrecioMax((e.currentTarget as HTMLInputElement).value)}
          />
        </div>
        {aromas.length > 0 ? (
          <div>
            <label for="aroma" class="label">Aroma</label>
            <select
              id="aroma"
              class="field"
              value={aromaSel}
              onChange={(e) => setAromaSel((e.currentTarget as HTMLSelectElement).value)}
            >
              <option value="">Todos</option>
              {aromas.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        ) : (
          <div />
        )}
        {ingredientes.length > 0 ? (
          <div>
            <label for="ing" class="label">Ingrediente (jabón)</label>
            <select
              id="ing"
              class="field"
              value={ingredienteSel}
              onChange={(e) => setIngredienteSel((e.currentTarget as HTMLSelectElement).value)}
            >
              <option value="">Todos</option>
              {ingredientes.map((i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </div>
        ) : (
          <div />
        )}
        {materiales.length > 0 ? (
          <div>
            <label for="mat" class="label">Material (textil)</label>
            <select
              id="mat"
              class="field"
              value={materialSel}
              onChange={(e) => setMaterialSel((e.currentTarget as HTMLSelectElement).value)}
            >
              <option value="">Todos</option>
              {materiales.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        ) : (
          <div />
        )}
      </div>

      <div class="flex items-center justify-between text-sm text-muted">
        <span>
          Mostrando <span class="text-ink font-medium tabular-nums">{ordenados.length}</span> de {productos.length} productos
        </span>
        {(precioMin || precioMax || aromaSel || ingredienteSel || materialSel || search) && (
          <button
            type="button"
            onClick={limpiarFiltros}
            class="text-xs hover:text-amber-deep transition-colors duration-300"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Grid */}
      {ordenados.length === 0 ? (
        <div class="text-center py-20 md:py-28">
          <div class="display text-[32px] md:text-[44px] leading-[0.95] mb-3">
            No encontramos productos con esos filtros.
          </div>
          <p class="text-muted max-w-[44ch] mx-auto mb-6">
            Probá quitar algún filtro o volver al catálogo completo.
          </p>
          <button type="button" onClick={limpiarFiltros} class="btn-primary">
            Limpiar filtros
          </button>
        </div>
      ) : (
        <ul class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 md:gap-x-7 gap-y-10 md:gap-y-14">
          {ordenados.map((p) => {
            const stockTxt = stockLabelTexto(stockLabel(p.stock, p.stock_bajo ?? 3));
            const rating = p.rating_promedio ?? 0;
            const ratingCount = p.rating_cantidad ?? 0;
            const added = addedSlug === p.slug;
            return (
              <li
                key={p.slug}
                class={`group relative reveal ${added ? "is-visible" : ""}`}
              >
                <div class="bezel-outer">
                  <div class="bezel-inner">
                    <a
                      href={`/productos/${p.slug}`}
                      class={`block relative ${p.es_bundle ? "aspect-[5/4]" : "aspect-[4/5]"} overflow-hidden bg-linen`}
                      aria-label={`Ver ${p.nombre}`}
                    >
                      <img
                        src={p.imagen}
                        alt={p.imagen_alt}
                        loading="lazy"
                        decoding="async"
                        class="w-full h-full object-cover transition-transform duration-[1200ms] ease-[var(--ease-fluid)] group-hover:scale-[1.04]"
                      />
                      <span class="absolute top-3 left-3 inline-flex items-center px-3 py-1 rounded-full bg-paper/90 backdrop-blur-sm text-[10px] uppercase tracking-[0.18em] text-ink/80">
                        {categoriaLabel(p.categoriaId)}
                      </span>
                      {rating >= 4 && ratingCount > 0 && (
                        <span class="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-paper/90 backdrop-blur-sm text-[10px] tabular-nums text-ink/80">
                          <svg viewBox="0 0 24 24" class="w-3 h-3 text-amber" fill="currentColor" aria-hidden="true">
                            <path d="M12 2.5l2.95 6 6.6.96-4.78 4.66 1.13 6.58L12 17.6l-5.9 3.1 1.13-6.58L2.45 9.46l6.6-.96L12 2.5z" />
                          </svg>
                          {rating.toFixed(1)}
                        </span>
                      )}
                    </a>
                  </div>
                </div>
                <div class="px-2 mt-4 flex items-start justify-between gap-4">
                  <div class="min-w-0">
                    <h3 class="display text-[20px] leading-[1.1] text-ink truncate">
                      <a href={`/productos/${p.slug}`} class="hover:text-forest transition-colors duration-300">
                        {p.nombre}
                      </a>
                    </h3>
                    <p class="mt-1.5 text-sm text-muted line-clamp-2 max-w-[42ch]">
                      {p.descripcion_corta}
                    </p>
                    <div class="mt-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-muted">
                      <span>{stockTxt}</span>
                      {ratingCount > 0 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{ratingCount} reseñas</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div class="shrink-0 pt-1 text-right">
                    <div class="font-medium tabular-nums text-ink">{formatPrecio(p.precio)}</div>
                  </div>
                </div>
                <div class="px-2 mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAdd(p)}
                    disabled={p.stock <= 0}
                    class="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-full border border-[var(--color-hairline)] hover:border-forest hover:bg-forest hover:text-cream text-sm transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={`Agregar ${p.nombre} al carrito`}
                  >
                    {added ? (
                      <>
                        <svg viewBox="0 0 24 24" class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                          <path d="M5 12l5 5 9-11" stroke-linecap="round" stroke-linejoin="round"></path>
                        </svg>
                        Agregado
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                          <path d="M3 4h2l2.4 12.2a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.5L21 8H6" stroke-linecap="round" stroke-linejoin="round" />
                          <circle cx="9" cy="21" r="1" fill="currentColor" />
                          <circle cx="18" cy="21" r="1" fill="currentColor" />
                        </svg>
                        Agregar
                      </>
                    )}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
