/** @jsxImportSource preact */
import { useEffect, useState } from "preact/hooks";
import { formatPrecio } from "../../lib/site";

interface Order {
  numero: string;
  fecha: string;
  items: Array<{ slug: string; nombre: string; precio: number; cantidad: number; imagen: string }>;
  subtotal: number;
  envio: number;
  total: number;
  /** Cupón aplicado (opcional, sólo si el usuario tipeó uno válido). */
  descuento?: number;
  cupon?: string | null;
  cliente: { nombre: string; email: string; telefono?: string };
  envio_direccion: {
    direccion: string;
    ciudad: string;
    provincia: string;
    codigoPostal: string;
  };
  metodoPago: "efectivo" | "transferencia";
  notas?: string;
}

const STORAGE_KEY = "verdeo:lastOrder:v1";

export default function OrderSummary() {
  const [order, setOrder] = useState<Order | null | undefined>(undefined);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setOrder(null);
        return;
      }
      const parsed = JSON.parse(raw) as Order;
      setOrder(parsed);
    } catch {
      setOrder(null);
    }
  }, []);

  if (order === undefined) {
    return (
      <div class="text-center py-20 text-muted">
        <div class="display text-[28px] mb-2">Cargando tu pedido…</div>
        <p class="text-sm">Un momento.</p>
      </div>
    );
  }

  if (order === null) {
    return (
      <div class="text-center py-20">
        <div class="display text-[44px] md:text-[56px] leading-[0.95] mb-4">
          No encontramos el pedido
        </div>
        <p class="text-muted max-w-[44ch] mx-auto mb-8 leading-relaxed">
          Es posible que la página se haya recargado o que el pedido haya caducado.
          Si realizaste una compra hace instantes, revisá tu email o contactanos.
        </p>
        <a href="/productos" class="btn-primary">Volver al catálogo</a>
      </div>
    );
  }

  const fechaFmt = new Date(order.fecha).toLocaleString("es-AR", {
    dateStyle: "long",
    timeStyle: "short",
  });

  const metodoLabel =
    order.metodoPago === "transferencia" ? "Transferencia bancaria" : "Efectivo contra entrega";

  return (
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
      {/* Confirmación */}
      <section class="lg:col-span-7" aria-label="Confirmación del pedido">
        <div class="bezel-outer mb-8">
          <div class="bezel-inner p-6 md:p-8">
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 rounded-full bg-forest text-cream inline-flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path d="M5 12l5 5 9-11" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
              </div>
              <div class="flex-1">
                <div class="eyebrow text-forest">Pedido confirmado</div>
                <h1 class="display text-[32px] md:text-[42px] leading-[1.05] mt-1">
                  Gracias, {order.cliente.nombre.split(" ")[0]}.
                </h1>
                <p class="text-muted mt-2 max-w-[52ch]">
                  Te enviamos un email a <strong class="text-ink">{order.cliente.email}</strong> con
                  los detalles y los próximos pasos según el método de pago elegido.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div>
            <div class="eyebrow mb-2">Número de pedido</div>
            <div class="display text-[24px]">{order.numero}</div>
          </div>
          <div>
            <div class="eyebrow mb-2">Fecha</div>
            <div class="text-ink">{fechaFmt}</div>
          </div>
          <div>
            <div class="eyebrow mb-2">Método de pago</div>
            <div class="text-ink">{metodoLabel}</div>
          </div>
          <div>
            <div class="eyebrow mb-2">Envío a</div>
            <div class="text-ink leading-snug">
              {order.envio_direccion.direccion}<br />
              {order.envio_direccion.ciudad}, {order.envio_direccion.provincia}<br />
              CP {order.envio_direccion.codigoPostal}
            </div>
          </div>
        </div>

        {order.notas && (
          <div class="mt-6 p-4 bg-cream/70 rounded-2xl">
            <div class="eyebrow mb-1.5">Notas</div>
            <div class="text-sm text-ink/90">{order.notas}</div>
          </div>
        )}

        <div class="mt-8 flex flex-wrap items-center gap-3">
          <a href="/productos" class="btn-primary">
            Seguir comprando
            <svg viewBox="0 0 24 24" class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <path d="M5 12h14M13 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
          </a>
          <a href="/" class="btn-ghost">Volver al inicio</a>
        </div>
      </section>

      {/* Resumen */}
      <aside class="lg:col-span-5" aria-label="Resumen del pedido">
        <div class="sticky top-24 bezel-outer">
          <div class="bezel-inner p-6 md:p-8">
            <div class="display text-[24px] mb-5">Productos</div>
            <ul class="flex flex-col gap-3 mb-5">
              {order.items.map((it) => (
                <li class="flex items-center gap-3 text-sm" key={it.slug}>
                  <img
                    src={it.imagen}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    class="w-12 h-14 rounded-md object-cover bg-linen shrink-0"
                  />
                  <div class="flex-1 min-w-0">
                    <div class="truncate">{it.nombre}</div>
                    <div class="text-xs text-muted">Cantidad: {it.cantidad}</div>
                  </div>
                  <div class="tabular-nums shrink-0">
                    {formatPrecio(it.precio * it.cantidad)}
                  </div>
                </li>
              ))}
            </ul>
            <hr class="hairline" />
            <dl class="flex flex-col gap-2 mt-4 text-sm">
              <div class="flex items-center justify-between">
                <dt class="text-muted">Subtotal</dt>
                <dd class="tabular-nums">{formatPrecio(order.subtotal)}</dd>
              </div>
              {order.descuento && order.descuento > 0 && (
                <div class="flex items-center justify-between">
                  <dt class="text-muted">
                    Descuento {order.cupon ? <span class="text-ink/70">({order.cupon})</span> : null}
                  </dt>
                  <dd class="tabular-nums text-forest">
                    − {formatPrecio(order.descuento)}
                  </dd>
                </div>
              )}
              <div class="flex items-center justify-between">
                <dt class="text-muted">Envío</dt>
                <dd class="tabular-nums">
                  {order.envio === 0 ? <span class="text-forest">Gratis</span> : formatPrecio(order.envio)}
                </dd>
              </div>
              <hr class="hairline my-2" />
              <div class="flex items-center justify-between text-base">
                <dt class="font-medium">Total</dt>
                <dd class="tabular-nums font-medium text-lg">{formatPrecio(order.total)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </aside>
    </div>
  );
}
