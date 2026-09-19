/**
 * Orders — historial de pedidos del cliente en este navegador.
 * Persistido en localStorage bajo "verdeo:orders:v1".
 *
 * Esquema versionado (v1). El Order archiva la copia exacta de cada
 * CartLine al momento de confirmar; precios e imágenes quedan como
 * snapshot aunque el catálogo cambie.
 *
 * Decisión: la última confirmación también queda en `verdeo:lastOrder:v1`
 * para que la pantalla de confirmación funcione tras un refresh sin
 * que la clienta tenga que volver a tipear todo.
 */

import { atom, computed } from "nanostores";
import { persistentAtom } from "@nanostores/persistent";

export interface OrderLineSnapshot {
  slug: string;
  nombre: string;
  precio: number;
  cantidad: number;
  imagen: string;
}

export interface OrderRecord {
  /** Identificador del esquema ("v1"). Sirve para migraciones futuras. */
  schemaVersion: 1;
  /** VRT-NNNNNN */
  numero: string;
  /** ISO date (string). */
  fecha: string;
  items: OrderLineSnapshot[];
  subtotal: number;
  envio: number;
  descuento: number;
  cupon: string | null;
  total: number;
  cliente: {
    nombre: string;
    email: string;
    telefono?: string;
  };
  envio_direccion: {
    direccion: string;
    ciudad: string;
    provincia: string;
    codigoPostal: string;
    notas?: string;
  };
  metodoPago: "efectivo" | "transferencia";
  /** Opciones de regalo. */
  giftWrap: boolean;
  giftMessage: string;
  /** Email normalizado para lookup en /cuenta/pedidos. */
  clienteEmailKey: string;
}

const initial: OrderRecord[] = [];

function sanitize(arr: unknown): OrderRecord[] {
  if (!Array.isArray(arr)) return initial;
  return arr.filter((o): o is OrderRecord => {
    if (!o || typeof o !== "object") return false;
    const r = o as Partial<OrderRecord>;
    return (
      r.schemaVersion === 1 &&
      typeof r.numero === "string" &&
      typeof r.fecha === "string" &&
      Array.isArray(r.items) &&
      typeof r.subtotal === "number" &&
      typeof r.envio === "number" &&
      typeof r.descuento === "number" &&
      typeof r.total === "number" &&
      !!r.cliente &&
      !!r.envio_direccion
    );
  });
}

export const $orders = persistentAtom<OrderRecord[]>("verdeo:orders:v1", initial, {
  encode: JSON.stringify,
  decode: (raw) => {
    try {
      return sanitize(JSON.parse(raw));
    } catch {
      return initial;
    }
  },
});

/**
 * Cross-tab sync: si otra pestaña confirma un pedido, esta lo ve.
 * El lastOrder (clave separada) también se sincroniza.
 */
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === "verdeo:orders:v1" && e.newValue !== null) {
      try {
        $orders.set(sanitize(JSON.parse(e.newValue)));
      } catch {
        /* ignore */
      }
    }
    if (e.key === "verdeo:lastOrder:v1") {
      // El lastOrder se lee en runtime vía localStorage.getItem; el
      // refresh de la página de confirmación lo recogerá. No hace falta
      // sincronizar el atom en memoria.
    }
  });
}

/** Cantidad de pedidos guardados en el navegador. */
export const $ordersCount = computed($orders, (items) => items.length);

/** Agrega un pedido nuevo y lo deja como "último" para la confirmación. */
export function addOrder(record: Omit<OrderRecord, "schemaVersion" | "clienteEmailKey">): void {
  const emailKey = record.cliente.email.trim().toLowerCase();
  const full: OrderRecord = {
    ...record,
    schemaVersion: 1,
    clienteEmailKey: emailKey,
  };
  const next = [full, ...$orders.get()];
  $orders.set(next);
  try {
    localStorage.setItem("verdeo:lastOrder:v1", JSON.stringify(full));
  } catch {
    /* ignore quota */
  }
}

/** Busca un pedido por número (case-insensitive). */
export function findOrderByNumero(numero: string): OrderRecord | null {
  const target = numero.trim().toUpperCase();
  if (!target) return null;
  return $orders.get().find((o) => o.numero.toUpperCase() === target) ?? null;
}

/** Filtra los pedidos por email (normalizado a lower-case). */
export function ordersForEmail(email: string): OrderRecord[] {
  const key = email.trim().toLowerCase();
  if (!key) return [];
  return $orders.get().filter((o) => o.clienteEmailKey === key);
}

/** Suscripción convenience. */
export function subscribeOrders(fn: (o: readonly OrderRecord[]) => void): () => void {
  return $orders.subscribe(fn);
}

export { atom };
