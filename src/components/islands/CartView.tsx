/** @jsxImportSource preact */
import { useStore } from "@nanostores/preact";
import { $cart, removeFromCart, setCantidad, clearCart } from "../../lib/cart";
import { formatPrecio, SITE, calcularEnvio } from "../../lib/site";

/**
 * Vista completa del carrito. Se monta como client:only="preact"
 * porque depende 100% de localStorage (no se puede renderizar en SSR).
 */
export default function CartView() {
  const items = useStore($cart);
  const subtotal = items.reduce((acc, it) => acc + it.precio * it.cantidad, 0);
  const envio = calcularEnvio(subtotal);
  const total = subtotal + envio;

  if (items.length === 0) {
    return (
      <div class="text-center py-20 md:py-28">
        <div class="display text-[44px] md:text-[64px] leading-[0.95] mb-4">
          Tu carrito está vacío
        </div>
        <p class="text-muted max-w-[44ch] mx-auto mb-8 leading-relaxed">
          Aún no agregaste productos. Te invitamos a recorrer nuestro catálogo de
          velas, difusores, jabones y textiles hechos a mano.
        </p>
        <a href="/productos" class="btn-primary">
          Explorar el catálogo
          <svg
            viewBox="0 0 24 24"
            class="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            aria-hidden="true"
          >
            <path
              d="M5 12h14M13 5l7 7-7 7"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></path>
          </svg>
        </a>
      </div>
    );
  }

  return (
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
      {/* Lista de items */}
      <section class="lg:col-span-7" aria-label="Productos en el carrito">
        <ul class="flex flex-col gap-4">
          {items.map((it) => (
            <li class="bezel-outer" key={it.slug}>
              <div class="bezel-inner flex items-stretch gap-3 md:gap-5 p-3 md:p-4">
                <a
                  href={`/productos/${it.slug}`}
                  class="shrink-0 w-20 h-24 md:w-28 md:h-32 rounded-xl overflow-hidden bg-linen block"
                  aria-label={`Ver ${it.nombre}`}
                >
                  <img
                    src={it.imagen}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    class="w-full h-full object-cover"
                  />
                </a>
                <div class="flex-1 min-w-0 flex flex-col gap-1.5 py-1">
                  <a
                    href={`/productos/${it.slug}`}
                    class="display text-[18px] md:text-[20px] leading-tight hover:text-forest transition-colors duration-300"
                  >
                    {it.nombre}
                  </a>
                  <div class="text-xs text-muted">
                    Precio unitario: <span class="tabular-nums">{formatPrecio(it.precio)}</span>
                  </div>
                  <div class="mt-auto flex items-center justify-between gap-3 pt-2">
                    <div class="qty-stepper" role="group" aria-label={`Cantidad de ${it.nombre}`}>
                      <button
                        type="button"
                        onClick={() => setCantidad(it.slug, it.cantidad - 1)}
                        aria-label="Disminuir cantidad"
                      >
                        −
                      </button>
                      <span aria-live="polite">{it.cantidad}</span>
                      <button
                        type="button"
                        onClick={() => setCantidad(it.slug, it.cantidad + 1)}
                        aria-label="Aumentar cantidad"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(it.slug)}
                      class="text-xs text-muted hover:text-amber-deep transition-colors duration-300 inline-flex items-center gap-1"
                      aria-label={`Quitar ${it.nombre} del carrito`}
                    >
                      <svg viewBox="0 0 24 24" class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke-linecap="round" stroke-linejoin="round"></path>
                      </svg>
                      Quitar
                    </button>
                  </div>
                </div>
                <div class="hidden md:flex flex-col items-end justify-between py-1 pr-1">
                  <div class="font-medium tabular-nums text-ink">
                    {formatPrecio(it.precio * it.cantidad)}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div class="mt-6 flex items-center justify-between">
          <a href="/productos" class="btn-ghost">
            <svg viewBox="0 0 24 24" class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <path d="M19 12H5M11 5l-7 7 7 7" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
            Seguir comprando
          </a>
          <button
            type="button"
            onClick={() => {
              if (confirm("¿Vaciar todo el carrito?")) clearCart();
            }}
            class="text-xs text-muted hover:text-amber-deep transition-colors duration-300"
          >
            Vaciar carrito
          </button>
        </div>
      </section>

      {/* Resumen */}
      <aside class="lg:col-span-5" aria-label="Resumen de compra">
        <div class="sticky top-24 bezel-outer">
          <div class="bezel-inner p-6 md:p-8">
            <div class="display text-[28px] mb-6">Resumen</div>
            <dl class="flex flex-col gap-3 text-sm">
              <div class="flex items-center justify-between">
                <dt class="text-muted">Subtotal</dt>
                <dd class="tabular-nums text-ink">{formatPrecio(subtotal)}</dd>
              </div>
              <div class="flex items-center justify-between">
                <dt class="text-muted">Envío</dt>
                <dd class="tabular-nums text-ink">
                  {envio === 0 ? (
                    <span class="text-forest">Gratis</span>
                  ) : (
                    formatPrecio(envio)
                  )}
                </dd>
              </div>
              {envio > 0 && (
                <div class="text-xs text-muted-soft -mt-1">
                  Envío gratis a partir de {formatPrecio(SITE.envio_gratis_desde)}.
                </div>
              )}
              <hr class="hairline my-2" />
              <div class="flex items-center justify-between text-base">
                <dt class="font-medium">Total</dt>
                <dd class="tabular-nums font-medium text-lg">{formatPrecio(total)}</dd>
              </div>
            </dl>

            <a href="/checkout" class="btn-primary mt-6 w-full justify-center">
              Continuar al checkout
              <svg viewBox="0 0 24 24" class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                <path d="M5 12h14M13 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
            </a>

            <p class="mt-4 text-[11px] text-muted-soft leading-relaxed">
              El pago es simulado. Esta tienda es una demo: no procesamos pagos
              reales ni despachamos pedidos.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
