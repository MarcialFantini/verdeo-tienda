/**
 * Formateadores, constantes compartidas y metadatos editoriales.
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

/**
 * Categorías con metadata editorial extendida.
 * `introLargo` se usa en /categoria/[slug] y en secciones de la home.
 * `cuidados` apunta a /cuidados#<slug> en la página de cuidados.
 */
export const CATEGORIAS = [
  {
    id: "velas",
    nombre: "Velas",
    descripcion: "Cera de soja, pabilo de algodón.",
    introLargo:
      "Velas elaboradas a mano con cera de soja sin parafinas y pabilo de algodón certificado. Cada aroma se construye en el taller a partir de aceites esenciales destilados, no de fragancias sintéticas.",
    cuidados: "velas",
  },
  {
    id: "difusores",
    nombre: "Difusores",
    descripcion: "Varillas de ratán, alcohol de cereal.",
    introLargo:
      "Difusores de varillas con base de alcohol de cereal y aromas naturales. Ideales para perfumar ambientes de manera sutil y continua durante semanas, sin aerosol ni calor.",
    cuidados: "difusores",
  },
  {
    id: "jabones",
    nombre: "Jabones",
    descripcion: "Saponificación en frío, 100% naturales.",
    introLargo:
      "Jabones saponificados en frío durante seis semanas. Sin sulfatos, sin parabenos, sin fragancias sintéticas. Cada pastilla conserva la glicerina natural que hidrata la piel.",
    cuidados: "jabones",
  },
  {
    id: "textiles",
    nombre: "Textiles",
    descripcion: "Algodón orgánico y lino belga.",
    introLargo:
      "Textiles para el hogar en algodón orgánico certificado GOTS y lino belga. Hilados peinados, tintes libres de metales pesados, costuras reforzadas a punto cadena.",
    cuidados: "textiles",
  },
  {
    id: "bundles",
    nombre: "Kits & bundles",
    descripcion: "Combos a precio bundle.",
    introLargo:
      "Kits temáticos curados por nosotras para regalar o regalarte: una selección de productos a un precio menor que la suma de cada pieza.",
    cuidados: "bundles",
  },
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

/**
 * Genera el siguiente ID de pedido (6 dígitos, zero-padded).
 * Acepta un RNG inyectable para tests.
 */
export function generarNumeroPedido(rng: () => number = Math.random): string {
  const base = Math.floor(100000 + rng() * 900000);
  return `VRT-${base}`;
}

/** Calcula costo de envío según subtotal. */
export function calcularEnvio(subtotal: number): number {
  return subtotal >= SITE.envio_gratis_desde || subtotal === 0 ? 0 : SITE.envio_costo_base;
}

/**
 * Suma ARS X al final de envío (gift wrap). Por defecto ARS 800.
 * Vive acá para que la lógica del total sea centralizada.
 */
export const COSTO_GIFT_WRAP = 800;

/** Devuelve el label legible de un slug de categoría, con fallback defensivo. */
export function labelCategoria(slug: string): string {
  const found = CATEGORIAS.find((c) => c.id === slug);
  return found?.nombre ?? slug;
}

/**
 * Slug de stock label: deriva la etiqueta humana a partir del número.
 * - 0 → "Sin stock"
 * - <= stock_bajo (3 default) → "Pocas unidades"
 * - else → "En stock"
 */
export type StockLabel = "in_stock" | "low" | "out";

export function stockLabel(stock: number, low = 3): StockLabel {
  if (stock <= 0) return "out";
  if (stock <= low) return "low";
  return "in_stock";
}

export function stockLabelTexto(label: StockLabel): string {
  if (label === "out") return "Sin stock";
  if (label === "low") return "Pocas unidades";
  return "En stock";
}

/**
 * Opciones de sort para el catálogo (reutilizadas por CatalogBrowser).
 */
export type SortKey =
  | "relevancia"
  | "precio_asc"
  | "precio_desc"
  | "rating_desc"
  | "mas_vendidos"
  | "mas_recientes";

export const SORT_OPTIONS: ReadonlyArray<{ key: SortKey; label: string }> = [
  { key: "relevancia", label: "Relevancia" },
  { key: "precio_asc", label: "Menor precio" },
  { key: "precio_desc", label: "Mayor precio" },
  { key: "rating_desc", label: "Mejor rating" },
  { key: "mas_vendidos", label: "Más vendidos" },
  { key: "mas_recientes", label: "Más recientes" },
];

/**
 * Pequeña normalización de búsqueda (lowercase + sin acentos).
 */
export function normalizeForSearch(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}
