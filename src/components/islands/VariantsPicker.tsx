/** @jsxImportSource preact */
import { useState } from "preact/hooks";
import { addToCart } from "../../lib/cart";
import { formatPrecio } from "../../lib/site";
import StockBadge from "./StockBadge.tsx";

/**
 * Selector de variantes.
 * Si el producto tiene variantes, el cliente elige y se aplica
 * precioMod + stock propio. Si no, es un único "seleccionado".
 */
interface Variant {
  nombre: string;
  precioMod: number;
  stock: number;
  skuSuffix?: string;
}

interface Props {
  slug: string;
  nombre: string;
  precioBase: number;
  imagen: string;
  imagenAlt: string;
  variantes: Variant[];
  stockBase: number;
  stockBajoBase: number;
}

export default function VariantsPicker({
  slug,
  nombre,
  precioBase,
  imagen,
  imagenAlt,
  variantes,
  stockBase,
  stockBajoBase,
}: Props) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const hasVariants = variantes && variantes.length > 0;
  const variant = hasVariants ? variantes[selectedIdx] : null;

  const finalPrecio = precioBase + (variant?.precioMod ?? 0);
  const variantStock = hasVariants ? variant!.stock : stockBase;
  const variantStockBajo = stockBajoBase;

  const inc = () => setQty((q) => Math.min(variantStock, q + 1));
  const dec = () => setQty((q) => Math.max(1, q - 1));

  const handleAdd = () => {
    const variantLabel = hasVariants ? ` · ${variant!.nombre}` : "";
    addToCart(
      {
        slug: hasVariants ? `${slug}__${variant!.skuSuffix || variant!.nombre}` : slug,
        nombre: `${nombre}${variantLabel}`,
        precio: finalPrecio,
        imagen,
      },
      qty,
    );
    setAdded(true);
    if (typeof window !== "undefined") {
      window.setTimeout(() => setAdded(false), 2400);
    }
  };

  return (
    <div class="flex flex-col gap-4">
      {hasVariants && (
        <fieldset>
          <legend class="eyebrow mb-2">Tamaño</legend>
          <ul
            class="flex flex-wrap gap-2"
            role="radiogroup"
            aria-label="Variantes de tamaño"
          >
            {variantes.map((v, i) => {
              const selected = i === selectedIdx;
              const outOfStock = v.stock <= 0;
              return (
                <li>
                  <label
                    class={`inline-flex items-center gap-2 px-4 py-2 rounded-full border cursor-pointer text-sm transition-colors duration-300 ${
                      selected
                        ? "bg-forest text-cream border-forest"
                        : "border-[var(--color-hairline)] hover:border-ink/40"
                    } ${outOfStock ? "opacity-50 cursor-not-allowed" : ""}`}
                    data-disabled={outOfStock}
                  >
                    <input
                      type="radio"
                      name="variante"
                      value={v.nombre}
                      checked={selected}
                      onChange={() => {
                        if (!outOfStock) setSelectedIdx(i);
                      }}
                      disabled={outOfStock}
                      class="sr-only"
                    />
                    <span class="tabular-nums">{v.nombre}</span>
                    {v.precioMod > 0 && (
                      <span class="text-xs opacity-70">
                        +{formatPrecio(v.precioMod)}
                      </span>
                    )}
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>
      )}

      <div class="flex items-center gap-3 flex-wrap">
        <span class="eyebrow">Cantidad</span>
        <div class="qty-stepper" role="group" aria-label="Selector de cantidad">
          <button type="button" onClick={dec} disabled={qty <= 1} aria-label="Disminuir cantidad">−</button>
          <span aria-live="polite">{qty}</span>
          <button type="button" onClick={inc} disabled={qty >= variantStock} aria-label="Aumentar cantidad">+</button>
        </div>
        <StockBadge stock={variantStock} stockBajo={variantStockBajo} />
      </div>

      <div class="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={handleAdd}
          disabled={variantStock <= 0}
          class="btn-primary"
        >
          {added ? (
            <>
              <svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M5 12l5 5 9-11" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
              Agregado al carrito
            </>
          ) : variantStock <= 0 ? (
            "Sin stock"
          ) : (
            <>Agregar al carrito · {formatPrecio(finalPrecio * qty)}</>
          )}
        </button>

        <a href="/carrito" class="btn-ghost">
          Ver carrito
          <svg viewBox="0 0 24 24" class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <path d="M5 12h14M13 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"></path>
          </svg>
        </a>
      </div>

      {/* sr-only summary para usuarios sin JS / render server */}
      <p class="sr-only" aria-live="polite">
        Variante seleccionada: {variant ? variant.nombre : "predeterminada"}. Precio {formatPrecio(finalPrecio)}. Stock {variantStock}.
      </p>
    </div>
  );
}
