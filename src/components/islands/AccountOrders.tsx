/** @jsxImportSource preact */
import { useEffect, useMemo, useState } from "preact/hooks";
import { useStore } from "@nanostores/preact";
import { $orders, ordersForEmail } from "../../lib/orders";
import { formatPrecio } from "../../lib/site";

/**
 * Histórico de pedidos para el cliente actual.
 * "Mock login" por email — sin password, sin backend.
 * Sólo se ven los pedidos guardados en este navegador (localStorage).
 */
export default function AccountOrders() {
  const orders = useStore($orders);
  const [email, setEmail] = useState("");
  const [lookup, setLookup] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Hidrata desde localStorage al primer mount.
    setHydrated(true);
  }, []);

  const orderList = useMemo(
    () => (lookup ? ordersForEmail(lookup) : []),
    [orders, lookup],
  );

  // Búsqueda por número de pedido (otra vía de entrada).
  const [numero, setNumero] = useState("");
  const foundByNumber = useMemo(() => {
    const v = numero.trim().toUpperCase();
    if (!v) return null;
    return orders.find((o) => o.numero.toUpperCase() === v) ?? null;
  }, [numero, orders]);

  if (!hydrated) {
    return (
      <div class="text-muted text-center py-20">
        Cargando tu historial…
      </div>
    );
  }

  return (
    <div class="flex flex-col gap-10">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setLookup(email.trim().toLowerCase());
          }}
          class="bezel-outer"
        >
          <div class="bezel-inner p-6 md:p-7">
            <div class="eyebrow mb-2">Por email</div>
            <label for="lookup-email" class="label">
              Email usado en el pedido
            </label>
            <input
              id="lookup-email"
              type="email"
              class="field mb-4"
              placeholder="ejemplo@correo.com"
              value={email}
              onInput={(e) => setEmail((e.currentTarget as HTMLInputElement).value)}
              required
            />
            <button type="submit" class="btn-primary w-full justify-center">
              Buscar mis pedidos
            </button>
            <p class="mt-3 text-[11px] text-muted-soft leading-relaxed">
              Buscamos los pedidos guardados en este navegador (localStorage).
              Tienda demo: no usamos backend.
            </p>
          </div>
        </form>

        <form
          onSubmit={(e) => {
            e.preventDefault();
          }}
          class="bezel-outer"
        >
          <div class="bezel-inner p-6 md:p-7">
            <div class="eyebrow mb-2">Por número de pedido</div>
            <label for="lookup-numero" class="label">
              Número (VRT-NNNNNN)
            </label>
            <input
              id="lookup-numero"
              type="text"
              class="field mb-4 font-mono uppercase"
              placeholder="VRT-000000"
              value={numero}
              onInput={(e) => setNumero((e.currentTarget as HTMLInputElement).value)}
              spellcheck={false}
            />
            {foundByNumber ? (
              <div class="p-3 rounded-xl bg-forest/10 border border-forest/30 text-sm">
                <div class="font-medium">Encontrado: {foundByNumber.numero}</div>
                <div class="text-xs text-muted mt-0.5">
                  {foundByNumber.cliente.nombre} · {formatPrecio(foundByNumber.total)}
                </div>
                <a href="/checkout/confirmacion" class="text-xs underline mt-2 inline-block hover:text-forest">
                  Ir a la confirmación →
                </a>
              </div>
            ) : numero.trim() ? (
              <p class="text-xs text-amber-deep mb-3" role="alert">
                No encontramos un pedido con ese número en este navegador.
              </p>
            ) : (
              <p class="text-xs text-muted-soft mb-3">
                Tip: el número está en el email de confirmación.
              </p>
            )}
          </div>
        </form>
      </div>

      {/* Lista de pedidos encontrados */}
      {lookup && (
        <section aria-label={`Pedidos de ${lookup}`}>
          <div class="flex items-center justify-between mb-5">
            <h2 class="display text-[24px] md:text-[32px] leading-[1]">
              {orderList.length > 0
                ? `${orderList.length} pedido${orderList.length === 1 ? "" : "s"} encontrado${orderList.length === 1 ? "" : "s"}`
                : "Sin pedidos para ese email"}
            </h2>
            <button
              type="button"
              onClick={() => setLookup(null)}
              class="text-xs text-muted hover:text-amber-deep transition-colors duration-300"
            >
              Limpiar
            </button>
          </div>

          {orderList.length === 0 ? (
            <div class="bezel-outer">
              <div class="bezel-inner p-8 md:p-10 text-center">
                <p class="text-muted">
                  No encontramos pedidos guardados con ese email en este navegador.
                  Si realizaste la compra desde otro dispositivo o borraste los datos del
                  navegador, el pedido no se puede recuperar (es una tienda demo).
                </p>
              </div>
            </div>
          ) : (
            <ul class="flex flex-col gap-4">
              {orderList.map((o) => (
                <li key={o.numero} class="bezel-outer">
                  <div class="bezel-inner p-5 md:p-6">
                    <div class="flex items-start justify-between flex-wrap gap-3">
                      <div>
                        <div class="eyebrow mb-1">{formatFechaCorta(o.fecha)}</div>
                        <div class="display text-[24px]">{o.numero}</div>
                      </div>
                      <div class="text-right">
                        <div class="text-xs text-muted">{o.items.length} producto{o.items.length === 1 ? "" : "s"}</div>
                        <div class="display text-[24px] tabular-nums">{formatPrecio(o.total)}</div>
                      </div>
                    </div>
                    <hr class="hairline my-4" />
                    <ul class="flex flex-col gap-2 text-sm">
                      {o.items.map((it) => (
                        <li key={it.slug} class="flex items-center gap-3">
                          <img
                            src={it.imagen}
                            alt=""
                            class="w-10 h-12 rounded-md object-cover bg-linen shrink-0"
                            loading="lazy"
                          />
                          <div class="flex-1 min-w-0 truncate">{it.nombre}</div>
                          <div class="text-xs text-muted shrink-0">
                            {it.cantidad} × {formatPrecio(it.precio)}
                          </div>
                        </li>
                      ))}
                    </ul>
                    {o.giftWrap && (
                      <p class="mt-3 text-xs text-amber-deep">
                        Pedido envuelto para regalo{o.giftMessage ? `: "${o.giftMessage}"` : ""}.
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

function formatFechaCorta(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-AR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
