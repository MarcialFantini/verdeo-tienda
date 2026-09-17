/**
 * Formateadores y constantes compartidas.
 */

export const SITE = {
  nombre: "Verdeo Tienda",
  tagline: "Productos sustentables para el hogar",
  email: "hola@verdeotienda.demo",
  telefono: "+54 11 5555 0000",
  envio_gratis_desde: 25000, // ARS
  envio_costo_base: 3200, // ARS
  redes: {
    instagram: "https://instagram.com/verdeotienda.demo",
    facebook: "https://facebook.com/verdeotienda.demo",
  },
};

export const CATEGORIAS = [
  { id: "velas", nombre: "Velas", descripcion: "Cera de soja, pabilo de algodón." },
  { id: "difusores", nombre: "Difusores", descripcion: "Varillas de ratán, alcohol de cereal." },
  { id: "jabones", nombre: "Jabones", descripcion: "Saponificación en frío, 100% naturales." },
  { id: "textiles", nombre: "Textiles", descripcion: "Algodón orgánico y lino belga." },
] as const;

export type CategoriaId = (typeof CATEGORIAS)[number]["id"];

/** Format precio en pesos argentinos. */
export function formatPrecio(valor: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(valor);
}

/** Genera el siguiente ID de pedido (6 dígitos, zero-padded). */
export function generarNumeroPedido(): string {
  const base = Math.floor(100000 + Math.random() * 900000);
  return `VRT-${base}`;
}

/** Calcula costo de envío según subtotal. */
export function calcularEnvio(subtotal: number): number {
  return subtotal >= SITE.envio_gratis_desde || subtotal === 0 ? 0 : SITE.envio_costo_base;
}
