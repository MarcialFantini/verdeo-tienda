/** @jsxImportSource preact */
import { useState } from "preact/hooks";
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
 * Selector de cantidad + botón "Agregar al carrito".
 * Persiste la elección en el store y muestra confirmación efímera.
 */
export default function AddToCart({ slug, nombre, precio, imagen, stock }: Props) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const inc = () => setQty((q) => Math.min(stock, q + 1));
  const dec = () => setQty((q) => Math.max(1, q - 1));

  const handleAdd = () => {
    addToCart({ slug, nombre, precio, imagen }, qty);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2400);
  };

  return (
    <div class="flex flex-col gap-4">
      <div class="flex items-center gap-3">
        <span class="eyebrow">Cantidad</span>
        <div class="qty-stepper" role="group" aria-label="Selector de cantidad">
          <button
            type="button"
            onClick={dec}
            disabled={qty <= 1}
            aria-label="Disminuir cantidad"
          >
            −
          </button>
          <span aria-live="polite">{qty}</span>
          <button
            type="button"
            onClick={inc}
            disabled={qty >= stock}
            aria-label="Aumentar cantidad"
          >
            +
          </button>
        </div>
        <span class="text-xs text-muted">
          {stock} disponibles
        </span>
      </div>

      <div class="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={handleAdd}
          disabled={stock <= 0}
          class="btn-primary"
        >
          {added ? (
            <>
              <svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M5 12l5 5 9-11" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
              Agregado al carrito
            </>
          ) : (
            <>
              Agregar al carrito · {formatPrecio(precio * qty)}
            </>
          )}
        </button>

        <a href="/carrito" class="btn-ghost">
          Ver carrito
          <svg viewBox="0 0 24 24" class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <path d="M5 12h14M13 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"></path>
          </svg>
        </a>
      </div>
    </div>
  );
}
