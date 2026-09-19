import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// Categorías válidas para el catálogo
const categorias = ["velas", "difusores", "jabones", "textiles", "bundles"] as const;

/**
 * Variante: SKU derivado del producto base + nombre de la variante.
 * El precio puede modificarse (+ARS) y el stock es por variante.
 * Ej.: vela "Cítricos & Romero · 200g" o "Cítricos & Romero · 400g".
 */
const varianteShape = z.object({
  nombre: z.string().min(1).max(40),
  precioMod: z.number().int().nonnegative().default(0),
  stock: z.number().int().nonnegative().default(0),
  skuSuffix: z.string().max(8).default(""),
});

const productos = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/productos" }),
  schema: z.object({
    nombre: z.string(),
    categoria: z.enum(categorias),
    precio: z.number().positive(),
    moneda: z.literal("ARS").default("ARS"),
    descripcion_corta: z.string().min(10).max(140),
    descripcion_larga: z.string().min(40),
    ingredientes: z.string().optional(),
    dimensiones: z.string().optional(),
    peso: z.string().optional(),
    tiempo_quema: z.string().optional(),
    aroma: z.string().optional(),
    imagen: z.string().url(),
    imagen_alt: z.string(),
    destacado: z.boolean().default(false),
    /**
     * Stock global. Los productos sin variantes usan este número.
     * Si el producto tiene variantes, este stock sigue representando la
     * suma teórica pero el picker de variantes lee `stock` por variante.
     */
    stock: z.number().int().nonnegative().default(10),
    /**
     * Umbral para marcar "pocas unidades" (badge ámbar en la card).
     */
    stock_bajo: z.number().int().nonnegative().default(3),
    sku: z.string(),

    // === NUEVOS CAMPOS ===

    /** Tags normalizados para filtros de catálogo. */
    aromas: z.array(z.string()).optional(),
    ingredientes_tags: z.array(z.string()).optional(),
    materiales: z.array(z.string()).optional(),

    /**
     * Si el producto admite variantes (ej. vela 200g / 400g / 600g).
     * Cada variante suma precio y maneja su propio stock.
     */
    variantes: z.array(varianteShape).optional(),

    /**
     * Si el producto es un bundle, lista los slugs que lo componen
     * para mostrarlos en la ficha (informativo; el bundle se vende
     * como un solo SKU al precio `precio`).
     */
    es_bundle: z.boolean().default(false),
    bundle_slugs: z.array(z.string()).optional(),

    /** Rating promedio precomputado (1-5 con 1 decimal). */
    rating_promedio: z.number().min(1).max(5).optional(),
    rating_cantidad: z.number().int().nonnegative().default(0),

    /** Cuántos "veces visto" para sort "más vendidos" (cosmético). */
    ventas_simuladas: z.number().int().nonnegative().default(0),

    /** Fecha aditiva (YYYY-MM-DD) para sort "más reciente". */
    fecha_agregado: z.string().optional(),
  }),
});

/**
 * Novedades — posts cortos del blog.
 * Frontmatter minimal: título, eyebrow, descripción, autor, fecha, imagen, tags.
 */
const novedades = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/novedades" }),
  schema: z.object({
    titulo: z.string(),
    eyebrow: z.string().max(40).default("Novedades"),
    descripcion: z.string().min(20).max(200),
    autor: z.string().default("Equipo Verdeo"),
    fecha: z.string(), // YYYY-MM-DD
    imagen: z.string().url(),
    imagen_alt: z.string(),
    tags: z.array(z.string()).default([]),
    destacado: z.boolean().default(false),
  }),
});

export const collections = { productos, novedades };
export type Categoria = (typeof categorias)[number];
