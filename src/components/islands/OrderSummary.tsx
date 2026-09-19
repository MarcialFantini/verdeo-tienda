/** @jsxImportSource preact */
import { useEffect, useState } from "preact/hooks";
import { formatPrecio } from "../../lib/site";
import type { OrderRecord } from "../../lib/orders";

const STORAGE_KEY = "verdeo:orders:v1";
const LEGACY_KEY = "verdeo:lastOrder:v1";

function loadOrder(numeroParam: string | null): OrderRecord | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw) as OrderRecord[];
      const found =
        (numeroParam && arr.find((o) => o.numero.toUpperCase() === numeroParam.toUpperCase())) ||
        arr[0];
      return found ?? null;
    }
  } catch {
    /* ignore */
  }
  // Fallback a la versión vieja single-order.
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (raw) return JSON.parse(raw) as OrderRecord;
  } catch {
    /* ignore */
  }
  return null;
}

function buildIcs(order: OrderRecord): string {
  // Estimación de entrega: 5 días desde la fecha del pedido.
  const start = new Date(order.fecha);
  const end = new Date(start.getTime() + 1000 * 60 * 60 * 24 * 5);
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Verdeo Tienda//Pedido//ES",
    "BEGIN:VEVENT",
    `UID:${order.numero}@verdeotienda.demo`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:Entrega estimada · Pedido ${order.numero}`,
    `DESCRIPTION:Pedido confirmado en Verdeo. Esta fecha es estimada y se basa en los plazos de envío habituales (5 días hábiles).`,
    "LOCATION:Argentina",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export default function OrderSummary() {
  const [order, setOrder] = useState<OrderRecord | null | undefined>(undefined);

  useEffect(() => {
    const url = new URL(window.location.href);
    const n = url.searchParams.get("n");
    setOrder(loadOrder(n));
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
    order.metodoPago === "transferencia"
      ? "Transferencia bancaria"
      : order.metodoPago === "efectivo"
        ? "Efectivo contra entrega"
        : "Tarjeta";

  const downloadIcs = () => {
    const ics = buildIcs(order);
    if (typeof window === "undefined") return;
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `verdeo-${order.numero}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 print:gap-0">
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

        {order.giftWrap && (
          <div class="bezel-outer mb-6">
            <div class="bezel-inner p-4 md:p-5 bg-amber/10 border-amber/30">
              <div class="flex items-start gap-3">
                <svg viewBox="0 0 24 24" class="w-5 h-5 mt-0.5 text-amber-deep" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                  <path d="M3 9h18M5 9v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9M7 9V6a3 3 0 0 1 6 0v3" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <div>
                  <div class="font-medium text-amber-deep">Envoltorio para regalo incluido</div>
                  {order.giftMessage && (
                    <p class="text-sm text-ink/80 mt-1 italic">
                      "{order.giftMessage}"
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

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

        {order.envio_direccion.notas && (
          <div class="mt-6 p-4 bg-cream/70 rounded-2xl">
            <div class="eyebrow mb-1.5">Notas para el envío</div>
            <div class="text-sm text-ink/90">{order.envio_direccion.notas}</div>
          </div>
        )}

        <div class="mt-8 flex flex-wrap items-center gap-3 print:hidden">
          <a href="/productos" class="btn-primary">
            Seguir comprando
            <svg viewBox="0 0 24 24" class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <path d="M5 12h14M13 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
          </a>
          <a href="/" class="btn-ghost">Volver al inicio</a>
          <button
            type="button"
            onClick={downloadIcs}
            class="btn-ghost"
          >
            <svg viewBox="0 0 24 24" class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M3 9h18M8 3v4M16 3v4" stroke-linecap="round" />
            </svg>
            Sumar a calendario
          </button>
          <button
            type="button"
            onClick={() => typeof window !== "undefined" && window.print()}
            class="btn-ghost"
          >
            <svg viewBox="0 0 24 24" class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v7H6z" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            Imprimir
          </button>
        </div>
      </section>

      {/* Resumen */}
      <aside class="lg:col-span-5" aria-label="Resumen del pedido">
        <div class="sticky top-24 bezel-outer print:static print:shadow-none">
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
              {order.giftWrap && (
                <div class="flex items-center justify-between">
                  <dt class="text-muted">Envoltorio para regalo</dt>
                  <dd class="tabular-nums text-amber-deep">incluido</dd>
                </div>
              )}
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
