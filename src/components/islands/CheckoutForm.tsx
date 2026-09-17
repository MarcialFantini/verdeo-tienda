/** @jsxImportSource preact */
import { useState } from "preact/hooks";
import { useStore } from "@nanostores/preact";
import { $cart, $cartSubtotal, clearCart } from "../../lib/cart";
import { formatPrecio, calcularEnvio, generarNumeroPedido } from "../../lib/site";
import {
  aplicarCoupon,
  findCoupon,
  totalConCoupon,
  type Coupon,
} from "../../lib/coupons";

interface FormState {
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  codigoPostal: string;
  provincia: string;
  metodoPago: "efectivo" | "transferencia";
  notas: string;
}

const initial: FormState = {
  nombre: "",
  email: "",
  telefono: "",
  direccion: "",
  ciudad: "",
  codigoPostal: "",
  provincia: "Buenos Aires",
  metodoPago: "transferencia",
  notas: "",
};

interface Errors {
  nombre?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  codigoPostal?: string;
  provincia?: string;
}

function validate(f: FormState): Errors {
  const e: Errors = {};
  if (!f.nombre.trim() || f.nombre.trim().length < 3) e.nombre = "Ingresá tu nombre completo.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = "Email inválido.";
  if (f.telefono && !/^[\d\s+\-()]{6,}$/.test(f.telefono)) e.telefono = "Teléfono inválido.";
  if (!f.direccion.trim() || f.direccion.trim().length < 5) e.direccion = "Ingresá la dirección de envío.";
  if (!f.ciudad.trim()) e.ciudad = "Ingresá la ciudad.";
  if (!/^\d{4,8}$/.test(f.codigoPostal.replace(/\s/g, ""))) e.codigoPostal = "Código postal inválido (4 a 8 dígitos).";
  if (!f.provincia.trim()) e.provincia = "Ingresá la provincia.";
  return e;
}

export default function CheckoutForm() {
  const items = useStore($cart);
  const subtotal = useStore($cartSubtotal);

  // Cupón — vive en estado del componente (no se persiste en localStorage, como pide el brief).
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [couponMsg, setCouponMsg] = useState<{ tipo: "ok" | "err"; texto: string } | null>(null);

  // Totales (con cupón aplicado).
  const envioBase = calcularEnvio(subtotal);
  const breakdown = aplicarCoupon(subtotal, envioBase, coupon);
  const envio = breakdown.envio;
  const descuento = breakdown.descuento;
  const total = totalConCoupon(subtotal, envio, descuento);

  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  const setField = (k: keyof FormState) =>
    (e: Event) => {
      const target = e.currentTarget as HTMLInputElement | HTMLTextAreaElement;
      const value = target.value;
      const next = { ...form, [k]: value };
      setForm(next);
      if (touched[k as string]) {
        setErrors(validate(next));
      }
    };

  const onBlur = (k: keyof FormState) => () => {
    setTouched({ ...touched, [k as string]: true });
    setErrors(validate(form));
  };

  const handleApplyCoupon = (e: Event) => {
    e.preventDefault();
    const raw = couponInput.trim();
    if (!raw) {
      setCouponMsg({ tipo: "err", texto: "Ingresá un código primero." });
      return;
    }
    const found = findCoupon(raw);
    if (!found) {
      setCouponMsg({ tipo: "err", texto: "Cupón no válido o expirado." });
      return;
    }
    setCoupon(found);
    setCouponMsg({ tipo: "ok", texto: found.description });
    setCouponInput("");
  };

  const handleRemoveCoupon = () => {
    setCoupon(null);
    setCouponMsg(null);
    setCouponInput("");
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    setTouched(
      Object.keys(form).reduce((acc, k) => ({ ...acc, [k]: true }), {} as Record<string, boolean>),
    );
    if (Object.keys(errs).length > 0) return;
    if (items.length === 0) return;

    setSubmitting(true);
    const numeroPedido = generarNumeroPedido();
    const order = {
      numero: numeroPedido,
      fecha: new Date().toISOString(),
      items,
      subtotal,
      envio,
      descuento,
      cupon: coupon ? coupon.code : null,
      total,
      cliente: {
        nombre: form.nombre,
        email: form.email,
        telefono: form.telefono,
      },
      envio_direccion: {
        direccion: form.direccion,
        ciudad: form.ciudad,
        provincia: form.provincia,
        codigoPostal: form.codigoPostal,
      },
      metodoPago: form.metodoPago,
      notas: form.notas,
    };

    try {
      localStorage.setItem("verdeo:lastOrder:v1", JSON.stringify(order));
    } catch {
      // ignore quota errors
    }
    clearCart();

    // pequeño delay para feedback visual
    window.setTimeout(() => {
      window.location.href = `/checkout/confirmacion?n=${numeroPedido}`;
    }, 350);
  };

  if (items.length === 0 && !submitting) {
    return (
      <div class="text-center py-20">
        <div class="display text-[44px] md:text-[56px] leading-[0.95] mb-4">
          No hay productos para pagar
        </div>
        <p class="text-muted max-w-[42ch] mx-auto mb-8">
          Tu carrito está vacío. Agregá productos antes de pasar por caja.
        </p>
        <a href="/productos" class="btn-primary">Ir al catálogo</a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} novalidate class="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
      {/* Datos */}
      <section class="lg:col-span-7 flex flex-col gap-8" aria-label="Datos del pedido">
        <div>
          <h2 class="display text-[28px] mb-5">Tus datos</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2">
              <label for="nombre" class="label">Nombre y apellido *</label>
              <input
                id="nombre"
                type="text"
                autocomplete="name"
                class="field"
                value={form.nombre}
                onInput={setField("nombre")}
                onBlur={onBlur("nombre")}
                aria-invalid={!!errors.nombre}
                aria-describedby={errors.nombre ? "err-nombre" : undefined}
                required
              />
              {errors.nombre && (
                <p id="err-nombre" class="mt-1.5 text-xs text-amber-deep">{errors.nombre}</p>
              )}
            </div>
            <div>
              <label for="email" class="label">Email *</label>
              <input
                id="email"
                type="email"
                autocomplete="email"
                class="field"
                value={form.email}
                onInput={setField("email")}
                onBlur={onBlur("email")}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "err-email" : undefined}
                required
              />
              {errors.email && (
                <p id="err-email" class="mt-1.5 text-xs text-amber-deep">{errors.email}</p>
              )}
            </div>
            <div>
              <label for="telefono" class="label">Teléfono</label>
              <input
                id="telefono"
                type="tel"
                autocomplete="tel"
                class="field"
                value={form.telefono}
                onInput={setField("telefono")}
                onBlur={onBlur("telefono")}
                aria-invalid={!!errors.telefono}
                aria-describedby={errors.telefono ? "err-tel" : undefined}
              />
              {errors.telefono && (
                <p id="err-tel" class="mt-1.5 text-xs text-amber-deep">{errors.telefono}</p>
              )}
            </div>
          </div>
        </div>

        <div>
          <h2 class="display text-[28px] mb-5">Dirección de envío</h2>
          <div class="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div class="md:col-span-6">
              <label for="direccion" class="label">Calle y número *</label>
              <input
                id="direccion"
                type="text"
                autocomplete="street-address"
                class="field"
                value={form.direccion}
                onInput={setField("direccion")}
                onBlur={onBlur("direccion")}
                aria-invalid={!!errors.direccion}
                aria-describedby={errors.direccion ? "err-dir" : undefined}
                required
              />
              {errors.direccion && (
                <p id="err-dir" class="mt-1.5 text-xs text-amber-deep">{errors.direccion}</p>
              )}
            </div>
            <div class="md:col-span-3">
              <label for="ciudad" class="label">Ciudad *</label>
              <input
                id="ciudad"
                type="text"
                autocomplete="address-level2"
                class="field"
                value={form.ciudad}
                onInput={setField("ciudad")}
                onBlur={onBlur("ciudad")}
                aria-invalid={!!errors.ciudad}
                aria-describedby={errors.ciudad ? "err-ciu" : undefined}
                required
              />
              {errors.ciudad && (
                <p id="err-ciu" class="mt-1.5 text-xs text-amber-deep">{errors.ciudad}</p>
              )}
            </div>
            <div class="md:col-span-2">
              <label for="cp" class="label">Código postal *</label>
              <input
                id="cp"
                type="text"
                autocomplete="postal-code"
                inputMode="numeric"
                class="field"
                value={form.codigoPostal}
                onInput={setField("codigoPostal")}
                onBlur={onBlur("codigoPostal")}
                aria-invalid={!!errors.codigoPostal}
                aria-describedby={errors.codigoPostal ? "err-cp" : undefined}
                required
              />
              {errors.codigoPostal && (
                <p id="err-cp" class="mt-1.5 text-xs text-amber-deep">{errors.codigoPostal}</p>
              )}
            </div>
            <div class="md:col-span-1">
              <label for="prov" class="label">Prov.</label>
              <input
                id="prov"
                type="text"
                autocomplete="address-level1"
                class="field"
                value={form.provincia}
                onInput={setField("provincia")}
                onBlur={onBlur("provincia")}
                aria-invalid={!!errors.provincia}
                aria-describedby={errors.provincia ? "err-prov" : undefined}
                required
              />
            </div>
          </div>
        </div>

        <div>
          <h2 class="display text-[28px] mb-5">Método de pago</h2>
          <fieldset>
            <legend class="sr-only">Método de pago</legend>
            <div class="flex flex-col gap-3">
              <label
                class="bezel-outer cursor-pointer transition-colors duration-300 hover:bg-overlay"
                data-selected={form.metodoPago === "transferencia"}
              >
                <div class="bezel-inner p-4 md:p-5 flex items-start gap-4">
                  <input
                    type="radio"
                    name="pago"
                    value="transferencia"
                    checked={form.metodoPago === "transferencia"}
                    onChange={() => setForm({ ...form, metodoPago: "transferencia" })}
                    class="mt-1 accent-[var(--color-forest)]"
                  />
                  <div class="flex-1">
                    <div class="font-medium">Transferencia bancaria</div>
                    <p class="text-xs text-muted mt-1 leading-relaxed">
                      Te enviaremos los datos de la cuenta por email luego de confirmar.
                    </p>
                  </div>
                </div>
              </label>
              <label
                class="bezel-outer cursor-pointer transition-colors duration-300 hover:bg-overlay"
                data-selected={form.metodoPago === "efectivo"}
              >
                <div class="bezel-inner p-4 md:p-5 flex items-start gap-4">
                  <input
                    type="radio"
                    name="pago"
                    value="efectivo"
                    checked={form.metodoPago === "efectivo"}
                    onChange={() => setForm({ ...form, metodoPago: "efectivo" })}
                    class="mt-1 accent-[var(--color-forest)]"
                  />
                  <div class="flex-1">
                    <div class="font-medium">Efectivo (contra entrega)</div>
                    <p class="text-xs text-muted mt-1 leading-relaxed">
                      Disponible para envíos en CABA y GBA. Pagás al recibir.
                    </p>
                  </div>
                </div>
              </label>
            </div>
          </fieldset>
        </div>

        <div>
          <label for="notas" class="label">Notas para el envío (opcional)</label>
          <textarea
            id="notas"
            rows={3}
            class="field resize-none"
            placeholder="Ej.: dejar con portero de 9 a 17, timbre 3B."
            value={form.notas}
            onInput={setField("notas")}
          ></textarea>
        </div>
      </section>

      {/* Resumen */}
      <aside class="lg:col-span-5" aria-label="Resumen del pedido">
        <div class="sticky top-24 bezel-outer">
          <div class="bezel-inner p-6 md:p-8">
            <div class="display text-[28px] mb-5">Tu pedido</div>
            <ul class="flex flex-col gap-3 mb-5">
              {items.map((it) => (
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

            {/* Cupón de descuento */}
            <div class="mt-5">
              {coupon ? (
                <div class="flex items-start justify-between gap-3 p-3.5 bg-cream/70 rounded-2xl border border-[var(--color-hairline)]">
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                      <span class="inline-flex items-center px-2 py-0.5 rounded-full bg-forest text-cream text-[10px] uppercase tracking-[0.18em] font-medium">
                        Cupón
                      </span>
                      <span class="font-mono text-sm font-medium text-ink">
                        {coupon.code}
                      </span>
                    </div>
                    <p class="mt-1.5 text-xs text-muted leading-relaxed">
                      {couponMsg?.texto ?? coupon.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    class="shrink-0 text-xs text-muted hover:text-amber-deep transition-colors duration-300 inline-flex items-center gap-1"
                    aria-label={`Quitar cupón ${coupon.code}`}
                  >
                    <svg viewBox="0 0 24 24" class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                      <path d="M6 6l12 12M6 18L18 6" stroke-linecap="round" stroke-linejoin="round"></path>
                    </svg>
                    Quitar
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon}>
                  <label for="coupon" class="label">Código de cupón</label>
                  <div class="flex items-stretch gap-2">
                    <input
                      id="coupon"
                      type="text"
                      class="field flex-1 font-mono uppercase"
                      placeholder="VERDEO10"
                      value={couponInput}
                      onInput={(e) => {
                        const v = (e.currentTarget as HTMLInputElement).value;
                        setCouponInput(v);
                        if (couponMsg?.tipo === "err") setCouponMsg(null);
                      }}
                      autoComplete="off"
                      spellcheck={false}
                      aria-describedby={couponMsg ? "coupon-msg" : undefined}
                      aria-invalid={couponMsg?.tipo === "err"}
                    />
                    <button
                      type="submit"
                      class="btn-ghost px-5"
                      disabled={!couponInput.trim()}
                    >
                      Aplicar
                    </button>
                  </div>
                  {couponMsg && (
                    <p
                      id="coupon-msg"
                      class={`mt-2 text-xs ${couponMsg.tipo === "err" ? "text-amber-deep" : "text-forest"}`}
                      role={couponMsg.tipo === "err" ? "alert" : "status"}
                    >
                      {couponMsg.texto}
                    </p>
                  )}
                </form>
              )}
            </div>

            <dl class="flex flex-col gap-2 mt-5 text-sm">
              <div class="flex items-center justify-between">
                <dt class="text-muted">Subtotal</dt>
                <dd class="tabular-nums">{formatPrecio(subtotal)}</dd>
              </div>
              {descuento > 0 && (
                <div class="flex items-center justify-between">
                  <dt class="text-muted">
                    Descuento{" "}
                    {coupon?.kind === "percent" && coupon.percent ? (
                      <span class="text-ink/70">({coupon.percent}%)</span>
                    ) : null}
                  </dt>
                  <dd class="tabular-nums text-forest">
                    − {formatPrecio(descuento)}
                  </dd>
                </div>
              )}
              {coupon && coupon.kind === "free_shipping" && envioBase > 0 && (
                <div class="flex items-center justify-between text-xs">
                  <dt class="text-muted line-through">
                    Envío antes: {formatPrecio(envioBase)}
                  </dt>
                  <dd class="tabular-nums text-muted line-through">
                    {formatPrecio(envioBase)}
                  </dd>
                </div>
              )}
              <div class="flex items-center justify-between">
                <dt class="text-muted">Envío</dt>
                <dd class="tabular-nums">
                  {envio === 0 ? (
                    <span class="text-forest">Gratis</span>
                  ) : (
                    formatPrecio(envio)
                  )}
                </dd>
              </div>
              {subtotal > 0 && envioBase > 0 && !coupon && (
                <div class="text-xs text-muted-soft -mt-1">
                  Envío gratis a partir de {formatPrecio(25000)}.
                </div>
              )}
              <hr class="hairline my-2" />
              <div class="flex items-center justify-between text-base">
                <dt class="font-medium">Total</dt>
                <dd class="tabular-nums font-medium text-lg">{formatPrecio(total)}</dd>
              </div>
            </dl>

            <button
              type="submit"
              class="btn-primary mt-6 w-full justify-center"
              disabled={submitting}
            >
              {submitting ? "Procesando…" : "Confirmar pedido"}
              {!submitting && (
                <svg viewBox="0 0 24 24" class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                  <path d="M5 12h14M13 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
              )}
            </button>

            <p class="mt-4 text-[11px] text-muted-soft leading-relaxed">
              Esta tienda es una demo: el pedido no se procesa ni se envía.
            </p>
          </div>
        </div>
      </aside>
    </form>
  );
}
