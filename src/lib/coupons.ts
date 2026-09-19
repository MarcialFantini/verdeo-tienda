/**
 * Cupones de descuento — fuente única para la tienda demo.
 * Lee desde `src/data/promos.json` (creado y mantenible a mano) y expone
 * validadores + breakdown idénticos al comportamiento previo, pero ahora
 * extensible sin tocar código.
 */

import promosData from "../data/promos.json";

export type CouponKind = "percent" | "free_shipping" | "fixed_amount";

export interface Coupon {
  /** Código tal cual lo tipea el usuario (en mayúsculas). */
  code: string;
  /** Etiqueta humana que se muestra en el resumen. */
  label: string;
  /** Tipo de beneficio. */
  kind: CouponKind;
  /** Porcentaje 1-100 cuando kind === "percent". */
  percent?: number;
  /** Monto fijo en ARS cuando kind === "fixed_amount". */
  amount?: number;
  /** Mínimo de subtotal para aplicar (todos los tipos). */
  minimo?: number;
  /** Descripción corta que se muestra al aplicar. */
  description: string;
  /** Si true, sólo se puede usar una vez por sesión (en este checkout). */
  oneShot?: boolean;
  /** Si false, el cupón está deshabilitado. */
  vigente?: boolean;
}

interface RawCoupon {
  code: string;
  label?: string;
  kind: CouponKind;
  percent?: number;
  amount?: number;
  minimo?: number;
  description: string;
  oneShot?: boolean;
  vigente?: boolean;
}

const RAW = (promosData as { promos: RawCoupon[] }).promos;

const COUPONS: Record<string, Coupon> = Object.fromEntries(
  RAW
    .filter((c) => c.vigente !== false)
    .map((c) => [
      c.code.toUpperCase(),
      {
        code: c.code.toUpperCase(),
        label: (c.label ?? c.code).toUpperCase(),
        kind: c.kind,
        percent: c.percent,
        amount: c.amount,
        minimo: c.minimo,
        description: c.description,
        oneShot: c.oneShot,
        vigente: c.vigente ?? true,
      } satisfies Coupon,
    ]),
);

/** Lista readonly de cupones vigentes, útil para pantallas de ayuda. */
export const CUPONES_VIGENTES: ReadonlyArray<Coupon> = Object.values(COUPONS);

/** Normaliza el input del usuario (trim + uppercase). */
export function normalizeCouponCode(raw: string): string {
  return raw.trim().toUpperCase();
}

/** Busca un cupón por código normalizado. */
export function findCoupon(rawCode: string): Coupon | null {
  const code = normalizeCouponCode(rawCode);
  if (!code) return null;
  return COUPONS[code] ?? null;
}

/** Resultado de aplicarCoupon. */
export interface CouponBreakdown {
  /** Monto descontado del subtotal en ARS (puede ser 0). */
  descuento: number;
  /** Costo de envío final tras el cupón. */
  envio: number;
  /** Costo de envío original sin cupón. */
  envioBase: number;
  /** Mensaje de error si el cupón no pudo aplicarse (mínimo, etc.). */
  error?: string;
}

/**
 * Aplica el cupón al subtotal. Devuelve { descuento, envio, envioBase, error? }.
 * Devuelve `error` cuando el cupón existe pero no aplica al carrito actual
 * (por ejemplo, no llega al mínimo) — eso permite al formulario mostrar un
 * mensaje claro en vez de "aplicado".
 */
export function aplicarCoupon(
  subtotal: number,
  envioBase: number,
  coupon: Coupon | null,
): CouponBreakdown {
  if (!coupon) {
    return { descuento: 0, envio: envioBase, envioBase };
  }
  if (coupon.minimo && subtotal < coupon.minimo) {
    return {
      descuento: 0,
      envio: envioBase,
      envioBase,
      error: `Este cupón aplica a compras mayores a ARS ${coupon.minimo.toLocaleString("es-AR")}.`,
    };
  }
  if (coupon.kind === "percent") {
    const descuento = coupon.percent
      ? Math.round((subtotal * coupon.percent) / 100)
      : 0;
    return { descuento, envio: envioBase, envioBase };
  }
  if (coupon.kind === "fixed_amount") {
    const descuento = coupon.amount ?? 0;
    return { descuento, envio: envioBase, envioBase };
  }
  // free_shipping
  return { descuento: 0, envio: 0, envioBase };
}

/** Total final tras descuento + envío. */
export function totalConCoupon(
  subtotal: number,
  envio: number,
  descuento: number,
): number {
  return Math.max(0, subtotal - descuento + envio);
}
