/** @jsxImportSource preact */
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { normalizeForSearch } from "../../lib/site";

/**
 * Header search box con autocomplete.
 * Recibe todos los productos como prop, indexa nombre + descripción + tags.
 */
interface ProductIndex {
  slug: string;
  nombre: string;
  categoria: string;
  imagen: string;
  precio: number;
  descripcion_corta: string;
  aromas?: string[];
  ingredientes_tags?: string[];
  materiales?: string[];
}

interface Props {
  productos: ProductIndex[];
}

export default function SearchBox({ productos }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const resultados = useMemo(() => {
    const q = normalizeForSearch(query.trim());
    if (q.length < 2) return [];
    return productos
      .map((p) => {
        const idx = normalizeForSearch(
          [p.nombre, p.descripcion_corta, ...(p.aromas ?? []), ...(p.ingredientes_tags ?? []), ...(p.materiales ?? [])].join(" "),
        );
        const isMatch = idx.includes(q);
        const nombreIdx = normalizeForSearch(p.nombre).indexOf(q);
        const score = isMatch ? (nombreIdx >= 0 ? 100 - nombreIdx : 10) : 0;
        return { p, score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((r) => r.p);
  }, [productos, query]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    window.addEventListener("mousedown", onClickOutside);
    return () => window.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div class="relative" ref={containerRef}>
      <label for="header-search" class="sr-only">Buscar productos</label>
      <input
        id="header-search"
        type="search"
        class="w-full md:w-56 pl-9 pr-3 py-2 rounded-full bg-cream border border-[var(--color-hairline)] text-sm focus:outline-none focus:border-forest transition-colors duration-300"
        placeholder="Buscar…"
        value={query}
        onInput={(e) => {
          setQuery((e.currentTarget as HTMLInputElement).value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        aria-controls="search-results"
        aria-expanded={open && resultados.length > 0}
        autoComplete="off"
        spellcheck={false}
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

      {open && query.trim().length >= 2 && (
        <div
          id="search-results"
          class="absolute right-0 top-[calc(100%+8px)] w-[320px] md:w-[420px] max-h-[420px] overflow-y-auto rounded-2xl border border-[var(--color-hairline)] bg-cream shadow-lg z-[60] p-2"
          role="listbox"
          aria-label="Resultados de búsqueda"
        >
          {resultados.length === 0 ? (
            <p class="px-4 py-3 text-sm text-muted">
              No encontramos "{query}". Probá con otro aroma o material.
            </p>
          ) : (
            <ul>
              {resultados.map((p) => (
                <li key={p.slug}>
                  <a
                    href={`/productos/${p.slug}`}
                    class="flex items-center gap-3 p-2.5 rounded-xl hover:bg-paper transition-colors duration-200"
                    role="option"
                  >
                    <img
                      src={p.imagen}
                      alt=""
                      loading="lazy"
                      class="w-12 h-14 rounded-lg object-cover bg-linen shrink-0"
                    />
                    <div class="min-w-0 flex-1">
                      <div class="text-sm font-medium truncate">{p.nombre}</div>
                      <div class="text-xs text-muted truncate">{p.categoria}</div>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
