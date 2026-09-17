# Verdeo Tienda · Micro e-commerce de productos sustentables

Tienda online completa para una marca ficticia de productos sustentables para
el hogar: velas de soja, difusores, jabones artesanales y textiles de algodón
orgánico. Quince SKUs reales, carrito persistente, checkout y confirmación de
pedido, todo mobile-first.

---

## Problema

Una marca chica de productos sustentables (dos socias, 15 SKUs, ventas en
ferias) necesita vender de punta a punta sin depender de Mercado Libre ni de
una plataforma de terceros. El público objetivo (25-45 años, consumidores con
gusto por el diseño consciente) espera una experiencia cuidada, rápida y
honesta: catálogo navegable, ficha de producto detallada, carrito funcional y
un cierre de pedido simple. El sitio debe verse bien en mobile, no obligar al
usuario a instalar nada y mantener el tono cálido y orgánico de la marca.

## Solución

Un e-commerce editorial construido sobre Astro 7 con rendering híbrido
(server-rendered para el catálogo con filtros por categoría, prerendered
para home / fichas / carrito / checkout / confirmación). Los productos viven
en Content Collections como Markdown con frontmatter tipado, lo que permite a
las socias editar precios, descripciones y stock sin tocar código.

La interactividad se concentra en islas Preact aisladas: el contador del
header, el selector de cantidad en la ficha, la vista del carrito, el
formulario de checkout y la pantalla de confirmación. El estado del carrito
vive en un store de **nanostores** persistido en **localStorage** bajo la
clave `verdeo:cart:v1` — sobrevive a refreshes, pestañas cruzadas y cierres
de navegador.

El cálculo de totales es directo: subtotal = Σ (precio × cantidad), envío
plano de ARS 3.200 o gratis a partir de ARS 25.000, total = subtotal + envío.
La confirmación persiste el pedido completo en `localStorage` y muestra el
número de pedido (formato `VRT-NNNNNN`) con todos los detalles.

> **Importante:** el checkout NO procesa pagos reales ni despacha pedidos.
> Es una demo visual: el "pago" se simula y la confirmación es informativa.

## Stack

| Capa            | Tecnología                                                 |
| --------------- | ---------------------------------------------------------- |
| Framework       | **Astro 7** (modo híbrido SSR + páginas prerendered)      |
| Adapter         | **@astrojs/node** (modo `standalone`)                      |
| Styling         | **Tailwind CSS v4** vía plugin Vite (`@tailwindcss/vite`) |
| Islas UI        | **Preact 10** (`@astrojs/preact`)                          |
| Estado global   | **nanostores** + **@nanostores/persistent** (localStorage) |
| Bindings        | **@nanostores/preact** (`useStore`)                        |
| Datos           | **Content Collections** (Markdown + frontmatter tipado)    |
| Tipos           | TypeScript 5 (estricto vía `astro/tsconfigs/strict`)       |
| Fuente display  | Cormorant Garamond (Google Fonts)                          |
| Fuente body     | Plus Jakarta Sans (Google Fonts)                           |
| Package manager | **pnpm 9+** exclusivamente                                 |

### Por qué nanostores (no Zustand / Redux / Context)

- **Tamaño:** ~1 kB gzipped, sin dependencias. Zustand añade ~3 kB y React.
- **Agnóstico al framework:** el mismo store se consume desde el badge del
  header (Preact), desde la vista del carrito (Preact) y desde un futuro
  endpoint Node del backend.
- **Persistencia lista:** `@nanostores/persistent` codifica/decodifica
  automáticamente y es SSR-safe (no toca `localStorage` en el servidor).
- **API mínima:** `atom`, `computed`, `persistentAtom`. Lo que se necesita
  para un carrito no requiere más.

### Por qué Preact (no React)

- ~3 kB vs ~45 kB de React. Crítico para una tienda mobile-first donde cada
  KB afecta el LCP del carrito.
- API compatible con React. Los hooks (`useState`, `useEffect`) funcionan
  igual. Si el equipo necesita migrar a React, el port es trivial.
- Integración oficial con Astro: `client:load`, `client:only="preact"`,
  `client:idle` funcionan out-of-the-box.

### Por qué SSR híbrido

El catálogo necesita filtrar por categoría (`?cat=velas`) en tiempo de
request. En modo `static` puro esa query se ignora porque la página se
construye una sola vez. La salida `server` con opt-in `prerender = true` por
página mantiene todo lo demás como HTML estático (home, fichas, carrito,
checkout, confirmación) y solo vuelve dinámica la ruta del catálogo.

## Cómo correrlo

Requisito previo: **Node ≥ 22.12** y **pnpm ≥ 9**.

```sh
# 1. Instalar dependencias
pnpm install

# 2. Modo desarrollo (servidor en http://localhost:4321)
pnpm dev

# 3. Build de producción (SSR standalone, genera ./dist/)
pnpm build

# 4. Servidor de producción en local (puerto 4321 por defecto)
pnpm preview

# 5. Type-check del proyecto (0 errores esperado)
pnpm astro check
```

Variables de entorno opcionales:

| Variable | Default | Descripción                          |
| -------- | ------- | ------------------------------------ |
| `HOST`   | `0.0.0.0` | Bind address para `node dist/server/entry.mjs` |
| `PORT`   | `4321`  | Puerto del servidor SSR             |

## Estructura

```text
src/
├── content.config.ts           # Schema de Content Collections (productos)
├── content/productos/*.md      # 15 SKUs seed (velas, difusores, jabones, textiles)
├── styles/global.css           # Design system: tokens + componentes Tailwind v4
├── lib/
│   ├── site.ts                 # SITE, CATEGORIAS, formatPrecio, calcularEnvio
│   └── cart.ts                 # Store del carrito (nanostores + persistent)
├── components/
│   ├── Header.astro            # Header sticky con cart indicator
│   ├── Footer.astro
│   ├── ProductCard.astro       # Tarjeta con "Double-Bezel"
│   └── islands/
│       ├── CartBadge.tsx       # Contador de unidades (Preact)
│       ├── AddToCart.tsx       # Selector qty + botón (Preact)
│       ├── CartView.tsx        # Vista completa del carrito (Preact)
│       ├── CheckoutForm.tsx    # Formulario con validación (Preact)
│       └── OrderSummary.tsx    # Resumen del pedido confirmado (Preact)
├── layouts/Layout.astro        # Layout base (fonts, header, footer, grain)
└── pages/
    ├── index.astro             # Home (hero + categorías + destacados + propuesta)
    ├── productos/
    │   ├── index.astro         # Catálogo con filtro ?cat=
    │   └── [slug].astro        # Ficha de producto (15 rutas estáticas)
    ├── carrito.astro           # Vista del carrito
    └── checkout/
        ├── index.astro         # Formulario de checkout
        └── confirmacion.astro  # Confirmación con número de pedido
```

## Rutas

| URL                              | Tipo      | Descripción                                  |
| -------------------------------- | --------- | -------------------------------------------- |
| `/`                              | static    | Home con hero, categorías y destacados       |
| `/productos`                     | **SSR**   | Catálogo (acepta `?cat=velas\|difusores\|jabones\|textiles`) |
| `/productos/[slug]`              | static    | Ficha de producto (15 rutas generadas)       |
| `/carrito`                       | static    | Vista del carrito + resumen                  |
| `/checkout`                      | static    | Formulario de pago simulado                  |
| `/checkout/confirmacion`         | static    | Confirmación con número de pedido            |

## Datos seed

15 productos divididos en 4 categorías:

- **Velas** (5): Lavanda & Cedro, Verbena & Salvia, Vainilla & Sándalo, Cítricos & Romero, Soja Pura sin aroma.
- **Difusores** (3): Bosque, Hogar, Jazmín mini.
- **Jabones** (4): Caléndula & Miel, Carbón & Tea Tree, Rosa Mosqueta, Avena & Lavanda.
- **Textiles** (3): Toalla de algodón orgánico GOTS, Set de repasadores de lino, Paño de cocina.

Las imágenes de producto se sirven desde Unsplash con fallback automático a
Lorem Picsum si una URL falla (atributo `onerror`).

## Accesibilidad

- `lang="es-AR"` en `<html>`, `meta viewport` correcto.
- Skip link "Saltar al contenido" visible al foco.
- Contraste WCAG AA en todos los textos (forest `#2D4A2A` sobre paper
  `#F1ECDF` supera 7:1; ink `#1E2A1B` sobre paper supera 12:1).
- Todos los `<img>` con `alt` descriptivo; íconos decorativos con
  `aria-hidden="true"`.
- Labels asociados a inputs en el formulario de checkout; mensajes de error
  con `aria-invalid` + `aria-describedby`.
- Estados de focus visibles (outline forest 2px con offset 3px).
- `prefers-reduced-motion` desactiva todas las animaciones y transiciones.

## Performance

- HTML prerendered para home, fichas, carrito, checkout y confirmación.
- Imágenes con `loading="lazy"` excepto hero (con `fetchpriority="high"`).
- Bundle JS del carrito: **5.1 KB** gzipped. Bundle de checkout: **9 KB**.
- Total JS crítico en `/productos` (después de hidratar): < 1 KB
  (solo el IntersectionObserver inline).
- Sin CSS-in-JS, sin librerías de animación pesadas, sin fuentes bloqueantes
  (preconnect + display=swap).

## Disclaimer

Esta es una tienda de **demostración**. No procesa pagos reales, no envía
emails, no despacha pedidos. El "checkout" simula el flujo completo y
muestra un número de pedido ficticio para mostrar el resumen. No usar en
producción sin reemplazar la lógica de checkout por un proveedor de pagos
real (Mercado Pago, Stripe, etc.) y un backend con stock real.
