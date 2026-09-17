import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// Categorías válidas para el catálogo
const categorias = ["velas", "difusores", "jabones", "textiles"] as const;

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
    stock: z.number().int().nonnegative().default(10),
    sku: z.string(),
  }),
});

export const collections = { productos };
export type Categoria = (typeof categorias)[number];
