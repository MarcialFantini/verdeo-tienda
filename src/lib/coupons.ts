/**
 * Cupones de descuento — fuente única para la tienda demo.
 * Validación por código (case-insensitive). Aplicado al estado del checkout
 * (no se persiste en localStorage, vive en el componente como pide el brief).
 */

export type CouponKind = "percent" | "free_shipping";

export interface Coupon {
  /** Código tal cual lo tipea el usuario (en mayúsculas). */
  code: string;
  /** Etiqueta humana que se muestra en el resumen. */
  label: string;
  /** Tipo de beneficio. */
  kind: CouponKind;
  /** Porcentaje 1-100 cuando kind === "percent". */
  percent?: number;
  /** Descripción corta que se muestra al aplicar. */
  description: string;
  /** Si true, sólo se puede usar una vez por sesión (en este checkout). */
  oneShot?: boolean;
}

export const COUPONS: Record<string, Coupon> = {
  VERDEO10: {
    code: "VERDEO10",
    label: "VERDEO10",
    kind: "percent",
    percent: 10,
    description: "10% de descuento sobre el subtotal.",
  },
  PRIMERA20: {
    code: "PRIMERA20",
    label: "PRIMERA20",
    kind: "percent",
    percent: 20,
    description: "20% de descuento en tu primera compra.",
    oneShot: true,
  },
  ENVIOGRATIS: {
    code: "ENVIOGRATIS",
    label: "ENVIOGRATIS",
    kind: "free_shipping",
    description: "Envío gratis sin mínimo.",
  },
};

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

/** Aplica el cupón al subtotal. Devuelve { descuento, envio } ya calculado. */
export interface CouponBreakdown {
  /** Monto descontado del subtotal en ARS (puede ser 0). */
  descuento: number;
  /** Costo de envío final tras el cupón. */
  envio: number;
  /** Costo de envío original sin cupón. */
  envioBase: number;
}

export function aplicarCoupon(
  subtotal: number,
  envioBase: number,
  coupon: Coupon | null,
): CouponBreakdown {
  if (!coupon) {
    return { descuento: 0, envio: envioBase, envioBase };
  }
  if (coupon.kind === "percent") {
    const descuento = coupon.percent
      ? Math.round((subtotal * coupon.percent) / 100)
      : 0;
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
