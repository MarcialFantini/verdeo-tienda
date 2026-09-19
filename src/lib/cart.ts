/**
 * Store del carrito — nanostores + persistent (localStorage).
 * Tipos, store y helpers expuestos para los Preact islands.
 */

import { atom, computed } from "nanostores";
import { persistentAtom } from "@nanostores/persistent";

export interface CartLine {
  /** slug del producto (identificador estable) */
  slug: string;
  /** nombre (snapshot al agregar) */
  nombre: string;
  /** precio unitario (snapshot al agregar) */
  precio: number;
  /** URL de imagen miniatura */
  imagen: string;
  /** cantidad */
  cantidad: number;
}

const initialCart: CartLine[] = [];

/**
 * Carrito persistido en localStorage bajo la clave "verdeo:cart:v1".
 * Codificado como JSON (array de CartLine).
 */
export const $cart = persistentAtom<CartLine[]>("verdeo:cart:v1", initialCart, {
  encode: JSON.stringify,
  decode: (raw) => {
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return initialCart;
      // Validación defensiva: descartar items corruptos
      return parsed.filter(
        (it): it is CartLine =>
          it &&
          typeof it.slug === "string" &&
          typeof it.nombre === "string" &&
          typeof it.precio === "number" &&
          typeof it.imagen === "string" &&
          typeof it.cantidad === "number" &&
          it.cantidad > 0,
      );
    } catch {
      return initialCart;
    }
  },
});

/**
 * Cross-tab sync: el evento `storage` sólo dispara en pestañas distintas a
 * la que escribió, así que dos pestañas del mismo navegador convergen sin
 * polling ni BroadcastChannel. Si otra pestaña modifica el carrito, esta
 * se actualiza. Si la clave se borra (e.g. clearCart desde otra pestaña),
 * `e.newValue === null` y respetamos el vacío.
 */
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== "verdeo:cart:v1") return;
    if (e.newValue === null) {
      $cart.set(initialCart);
      return;
    }
    try {
      const parsed = JSON.parse(e.newValue);
      if (!Array.isArray(parsed)) return;
      const next = parsed.filter(
        (it): it is CartLine =>
          it &&
          typeof it.slug === "string" &&
          typeof it.nombre === "string" &&
          typeof it.precio === "number" &&
          typeof it.imagen === "string" &&
          typeof it.cantidad === "number" &&
          it.cantidad > 0,
      );
      $cart.set(next);
    } catch {
      /* ignore */
    }
  });
}

/** Cantidad total de unidades en el carrito. */
export const $cartCount = computed($cart, (items) =>
  items.reduce((acc, it) => acc + it.cantidad, 0),
);

/** Subtotal del carrito en ARS. */
export const $cartSubtotal = computed($cart, (items) =>
  items.reduce((acc, it) => acc + it.precio * it.cantidad, 0),
);

/** Agrega un item al carrito. Si ya existe, suma cantidad. */
export function addToCart(item: Omit<CartLine, "cantidad">, qty = 1): void {
  const current = $cart.get();
  const existing = current.find((it) => it.slug === item.slug);
  if (existing) {
    $cart.set(
      current.map((it) =>
        it.slug === item.slug
          ? { ...it, cantidad: Math.min(99, it.cantidad + qty) }
          : it,
      ),
    );
  } else {
    $cart.set([...current, { ...item, cantidad: qty }]);
  }
}

/** Quita completamente un item del carrito. */
export function removeFromCart(slug: string): void {
  $cart.set($cart.get().filter((it) => it.slug !== slug));
}

/** Cambia la cantidad de un item. Si <=0, lo elimina. */
export function setCantidad(slug: string, cantidad: number): void {
  if (cantidad <= 0) {
    removeFromCart(slug);
    return;
  }
  $cart.set(
    $cart.get().map((it) =>
      it.slug === slug ? { ...it, cantidad: Math.min(99, cantidad) } : it,
    ),
  );
}

/** Vacía el carrito. */
export function clearCart(): void {
  $cart.set([]);
}

/** Catálogo rápido del carrito por slug (helper para la confirmación). */
export const $cartItems = computed($cart, (items) => items);

/** Suscribirse a cambios desde código no-React. */
export function subscribeCart(
  fn: (items: readonly CartLine[]) => void,
): () => void {
  return $cart.subscribe(fn);
}

/** Re-export del atom para casos de uso avanzados. */
export { atom };
