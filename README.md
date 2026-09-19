# Verdeo Tienda · Micro e-commerce de productos sustentables

Tienda online completa para una marca ficticia de productos sustentables para
el hogar: velas de soja, difusores, jabones artesanales, textiles de algodón
orgánico y kits temáticos. **38 productos en 5 categorías** + **5 posts de
blog**, carrito persistente, checkout simulado y confirmación de pedido,
todo mobile-first sobre Astro con output `server` (SSR) y adapter de Vercel.

---

## Problema

Una marca chica de productos sustentables (dos socias, ~38 SKUs, ventas en
ferias) necesita vender de punta a punta sin depender de Mercado Libre ni de
una plataforma de terceros. El público objetivo (25-45 años, consumidores con
gusto por el diseño consciente) espera una experiencia cuidada, rápida y
honesta: catálogo navegable, ficha de producto detallada, carrito funcional y
un cierre de pedido simple. El sitio debe verse bien en mobile, no obligar al
usuario a instalar nada y mantener el tono cálido y orgánico de la marca.

## Solución

Un e-commerce editorial construido sobre **Astro 7** con **output `server`**
(SSR) — todas las páginas con `prerender = true` salen como HTML estático
salvo `/productos` y `/categoria/[slug]`, que son SSR para aceptar filtros
por query param. Los productos viven en **Content Collections** (Markdown con
frontmatter tipado vía Zod): las socias editan precios, descripciones, stock,
variantes y bundles sin tocar código.

La interactividad se concentra en **19 islands Preact** (en
`src/components/islands/`): el contador del header, el buscador, el selector
de variantes, la vista del carrito, el formulario de checkout, la wishlist,
reseñas, recently viewed, etc. El estado persistente vive en stores de
**nanostores** + `@nanostores/persistent` (localStorage) bajo claves
`verdeo:*:v1` — el carrito, los pedidos, la wishlist, los vistos recientemente
y los cupones aplicados.

El cálculo de totales es directo: subtotal = Σ (precio × cantidad), envío
plano de ARS 3.200 o gratis a partir de ARS 25.000, total = subtotal + envío
± cupón. La confirmación archiva el pedido completo en localStorage y muestra
el número de pedido (formato `VRT-NNNNNN`) con todos los detalles.

> **Importante:** el checkout NO procesa pagos reales ni despacha pedidos.
> Es una demo visual: el "pago" se simula (efectivo/transferencia) y la
> confirmación es informativa. Toda la persistencia vive en el navegador del
> cliente.

## Stack

| Capa            | Tecnología                                                  |
| --------------- | ----------------------------------------------------------- |
| Framework       | **Astro 7.3** con `output: "server"` y `prerender` por ruta |
| Adapter         | **@astrojs/vercel** (genera `.vercel/output/`)              |
| Styling         | **Tailwind CSS v4** vía plugin Vite (`@tailwindcss/vite`)  |
| Islas UI        | **Preact 10** (`@astrojs/preact`) — 19 islands              |
| Estado global   | **nanostores** + **@nanostores/persistent** (localStorage)  |
| Bindings        | **@nanostores/preact** (`useStore`)                         |
| Datos           | **Content Collections** (Markdown + Zod)                    |
| Tipos           | TypeScript 5 (estricto vía `astro/tsconfigs/strict`)       |
| Fuente display  | **Cormorant Garamond** auto-hospedada (`@fontsource`)       |
| Fuente body     | **Plus Jakarta Sans** auto-hospedada (`@fontsource`)        |
| Package manager | **pnpm 9+** exclusivamente                                  |

### Por qué Preact (no React)

- **Tamaño:** ~3 kB vs ~45 kB de React. Crítico para una tienda mobile-first
  donde cada KB afecta el LCP del carrito.
- **API compatible con React:** los hooks (`useState`, `useEffect`) funcionan
  igual. Si el equipo necesita migrar a React, el port es trivial.
- **Integración oficial con Astro:** `client:load`, `client:only="preact"`,
  `client:visible` funcionan out-of-the-box.

### Por qué SSR (`output: "server"` + opt-in `prerender`)

El catálogo (`/productos` y `/categoria/[slug]`) necesita filtrar por
categoría (`?cat=velas`) en tiempo de request. En modo `static` puro esas
queries se ignorarían porque la página se construye una sola vez. La salida
`server` con opt-in `prerender = true` por página mantiene todo lo demás como
HTML estático (home, fichas, carrito, checkout, confirmación, blog) y solo
vuelve dinámicas las rutas del catálogo.

### Por qué nanostores (no Zustand / Redux / Context)

- **Tamaño:** ~1 kB gzipped, sin dependencias. Zustand añade ~3 kB y React.
- **Agnóstico al framework:** el mismo store se consume desde el badge del
  header (Preact), desde la vista del carrito (Preact) y desde un futuro
  endpoint del backend.
- **Persistencia lista:** `@nanostores/persistent` codifica/decodifica
  automáticamente y es SSR-safe (no toca `localStorage` en el servidor).
- **API mínima:** `atom`, `computed`, `persistentAtom`. Lo que se necesita
  para un carrito no requiere más.

### Por qué bundles como categoría

Los kits temáticos (`es_bundle: true` en el frontmatter) son una categoría
más, no un tipo de producto separado: permiten ofrecer combos curados con un
SKU propio y precio bundle, listar las piezas incluidas en la ficha vía
`bundle_slugs`, y filtrarlos con la misma query `?cat=bundles` que el
resto del catálogo.

### Por qué un VariantsPicker

Algunas velas vienen en 200g / 400g / 600g con precio y stock por variante.
Definir `variantes: [{nombre, precioMod, stock, skuSuffix}]` en el
frontmatter evita SKU duplicados en el catálogo y mantiene el stock atómico
por variante. El picker es un island aparte porque combina estado de
selección + sincronización con el stock badge y el sticky add-to-cart.

## Cómo correrlo

Requisito previo: **Node ≥ 22.12** y **pnpm ≥ 9**.

```sh
# 1. Instalar dependencias
pnpm install

# 2. Modo desarrollo (servidor en http://localhost:4321)
pnpm dev

# 3. Build de producción (genera .vercel/output/ con el adapter de Vercel)
pnpm build

# 4. Smoke test local del output estático de Vercel (puerto 4399)
node scripts/smoke-server.mjs

# 5. Type-check del proyecto (0 errores esperado)
pnpm astro check
```

## Estructura

```text
portfolio/09-ecommerce-marca/
├── astro.config.mjs          # output: "server" + @astrojs/vercel + @astrojs/preact
├── package.json              # deps: astro 7.3, preact 10, vercel adapter, fontsource, nanostores
├── tsconfig.json             # strict + jsxImportSource preact
├── public/
│   ├── favicon.svg
│   ├── favicon.ico
│   └── og-image.svg          # 1200x630, forest #2D4A2A + headline Cormorant
├── scripts/
│   └── smoke-server.mjs      # Static server para smoke-test de .vercel/output/static
└── src/
    ├── content.config.ts     # Schema Zod: productos (con variantes/bundles) + novedades
    ├── content/
    │   ├── productos/*.md    # 38 SKUs en 5 categorías
    │   └── novedades/*.md    # 5 posts de blog
    ├── data/
    │   └── promos.json       # Cupones vigentes (VERDEO10, ENVIOGRATIS, etc.)
    ├── styles/
    │   └── global.css        # Design system: tokens + Tailwind v4 + componentes
    ├── lib/
    │   ├── site.ts           # SITE, CATEGORIAS, formatPrecio, calcularEnvio, SORT_OPTIONS
    │   ├── cart.ts           # $cart + $cartCount + $cartSubtotal (persistent)
    │   ├── orders.ts         # Historial de pedidos (persistent)
    │   ├── wishlist.ts       # Lista de favoritos (persistent)
    │   ├── recent.ts         # Recently viewed (persistent, MAX 8)
    │   ├── coupons.ts        # Validador de cupones (lee promos.json)
    │   └── reviews.ts        # Reseñas seed hardcoded (3-5 por producto)
    ├── components/
    │   ├── Header.astro      # Sticky glass-header con cart + wishlist + search
    │   ├── Footer.astro
    │   ├── ProductCard.astro # Tarjeta con "double-bezel"
    │   ├── Breadcrumbs.astro # JSON-LD BreadcrumbList
    │   └── islands/
    │       ├── CartBadge.tsx          # client:load — contador header
    │       ├── AddToCart.tsx          # client:load — qty stepper + botón
    │       ├── CartView.tsx           # client:only="preact" — vista completa
    │       ├── CheckoutForm.tsx       # client:only="preact" — form + validación
    │       ├── CheckoutStepper.tsx    # client:only="preact" — paso 1/2/3
    │       ├── GiftWrapToggle.tsx     # client:only="preact" — add-on
    │       ├── OrderSummary.tsx       # client:only="preact" — confirmación
    │       ├── CatalogBrowser.tsx     # client:only="preact" — filtros + sort
    │       ├── SearchBox.tsx          # client:load — autocomplete del header
    │       ├── WishlistButton.tsx     # client:load — corazón por producto
    │       ├── WishlistChip.tsx       # client:load — contador header
    │       ├── WishlistView.tsx       # client:only="preact" — /cuenta/favoritos
    │       ├── VariantsPicker.tsx     # client:load — selector 200g/400g/600g
    │       ├── StockBadge.tsx         # client:load — In stock / Pocas / Sin stock
    │       ├── StickyAddToCart.tsx    # client:load — barra pegada al hacer scroll
    │       ├── RecentlyViewed.tsx     # client:visible — últimos N vistos
    │       ├── Reviews.tsx            # client:visible — seed + reseñas de usuario
    │       └── AccountOrders.tsx      # client:only="preact" — /cuenta/pedidos
    ├── layouts/
    │   └── Layout.astro      # SEO base (canonical, og, twitter) + Header + Footer
    └── pages/
        ├── index.astro                       # Home (hero + categorías + destacados)
        ├── carrito.astro                     # Vista del carrito
        ├── sobre-verdeo.astro                # Página de marca
        ├── cuidados.astro                    # Cuidados por categoría
        ├── envios.astro                      # Política de envíos
        ├── preguntas.astro                   # FAQ
        ├── productos/
        │   ├── index.astro                   # Catálogo con filtro ?cat= (SSR)
        │   └── [slug].astro                  # Ficha (38 rutas estáticas + JSON-LD)
        ├── categoria/
        │   └── [slug].astro                  # Editorial por categoría (SSR)
        ├── blog/
        │   ├── index.astro                   # Índice de novedades
        │   └── [slug].astro                  # Post individual (5 rutas)
        ├── checkout/
        │   ├── index.astro                   # Formulario
        │   └── confirmacion.astro            # Confirmación con VRT-NNNNNN
        └── cuenta/
            ├── favoritos.astro               # Lista de favoritos
            └── pedidos.astro                 # Historial de pedidos
```

## Rutas

| URL                              | Tipo     | Descripción                                                                                            |
| -------------------------------- | -------- | ------------------------------------------------------------------------------------------------------ |
| `/`                              | static   | Home con hero, categorías y productos destacados                                                       |
| `/productos`                     | **SSR**  | Catálogo (acepta `?cat=velas\|difusores\|jabones\|textiles\|bundles`)                                |
| `/productos/[slug]`              | static   | Ficha de producto (38 rutas generadas vía `getStaticPaths`)                                           |
| `/categoria/[slug]`              | **SSR**  | Página editorial por categoría (5 rutas)                                                               |
| `/carrito`                       | static   | Vista del carrito + cupones                                                                           |
| `/checkout`                      | static   | Formulario de pago simulado (efectivo / transferencia)                                                 |
| `/checkout/confirmacion`         | static   | Confirmación con número VRT-NNNNNN                                                                     |
| `/blog`                          | static   | Índice de novedades (5 posts)                                                                          |
| `/blog/[slug]`                   | static   | Post de blog (5 rutas)                                                                                 |
| `/cuenta/favoritos`              | static   | Wishlist persistida                                                                                    |
| `/cuenta/pedidos`                | static   | Historial de pedidos (lookup por email o VRT-NNNNNN)                                                  |
| `/sobre-verdeo`                  | static   | Página de marca                                                                                        |
| `/cuidados`                      | static   | Cuidados por categoría                                                                                 |
| `/envios`                        | static   | Política de envíos y devoluciones                                                                      |
| `/preguntas`                     | static   | Preguntas frecuentes                                                                                  |

> El **adapter `@astrojs/vercel`** genera la build en `.vercel/output/`
> (`functions/` para SSR, `static/` para las páginas prerenderizadas). El
> `dist/` que aparece en el árbol del repo es un artefacto histórico de una
> build con `@astrojs/node` — la build real corre limpia con `pnpm build` y
> produce `.vercel/output/`. El script `scripts/smoke-server.mjs` permite
> servir `.vercel/output/static/` localmente para verificación.

## Datos seed

**38 productos en 5 categorías** + **5 posts de blog**:

- **Velas** (14): Lavanda & Cedro, Verbena & Salvia, Vainilla & Sándalo,
  Cítricos & Romero, Bergamota, Eucalipto, Hoja de Higuera, Limón & Menta,
  Pequeña Soja, Traviata, Triple pabilo, Vainilla Bourbon, Verbena, Petit
  Soja.
- **Difusores** (7): Bosque, Hogar, Jazmín mini, Aire, Brisa, Menta &
  Verbena, Rosa.
- **Jabones** (9): Caléndula & Miel, Carbón & Tea Tree, Rosa Mosqueta, Avena
  & Lavanda, Coco, Menta, Vetiver, Naranja & Canela, Lavanda clásica.
- **Textiles** (6): Manta algodón, Paño de cocina, Paño de lino, Set de
  repasadores, Toalla baño, Toalla mano.
- **Bundles** (3): Kit aromaterapia, Kit relax, Kit regalo starter.

Las imágenes de producto se sirven desde Unsplash con fallback automático a
Lorem Picsum si una URL falla (atributo `onerror`).

## Persistencia

Todas las claves siguen el namespace `verdeo:*:v1` y son **same-tab**:
sobreviven a refreshes y cierres de navegador, pero **NO se sincronizan
entre pestañas del mismo navegador**. El evento `storage` del navegador sólo
dispara en pestañas distintas, así que abrir dos pestañas y agregar al
carrito en una no actualiza el badge en la otra. Es un limit conocido del
storage event — ver "Pendientes".

| Store      | Clave                     | Tipo                 | Notas                                        |
| ---------- | ------------------------- | -------------------- | -------------------------------------------- |
| Cart       | `verdeo:cart:v1`          | `CartLine[]`         | Slug, snapshot precio/nombre/imagen, qty   |
| Wishlist   | `verdeo:wishlist:v1`      | `string[]` (slugs)   | Toggle + count                               |
| Orders     | `verdeo:orders:v1`        | `OrderRecord[]`      | Schema versionado v1, lookup por email o N°  |
| Recent     | `verdeo:recent:v1`        | `string[]` (slugs)   | MAX 8, FIFO con deduplicación                |
| Last order | `verdeo:lastOrder:v1`     | `OrderRecord`        | Para que `/checkout/confirmacion` funcione tras refresh |
| Reviews    | `verdeo:reviews`          | (reservado, futuro)  | hoy las reseñas son seed en `lib/reviews.ts` |

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
- `prefers-reduced-transparency` desactiva el glassmorphism del header.
- `aria-current="page"` en los links activos del header.

## Performance

- HTML prerendered para home, fichas, carrito, checkout, confirmación, blog y
  cuenta. SSR sólo en `/productos` y `/categoria/[slug]` (necesitan leer
  query params en request time).
- Imágenes con `loading="lazy"` excepto hero (con `fetchpriority="high"`).
- Self-hosted fonts vía `@fontsource` (sin request a Google Fonts, sin FOUT).
- Sin CSS-in-JS, sin librerías de animación pesadas.

## Pendientes / deuda técnica

- **Cross-tab sync**: el `storage` event no dispara en la pestaña que
  escribió, así que dos pestañas del mismo navegador pueden divergir. Hay
  que decidir entre polling del localStorage o BroadcastChannel.
- **JSON-LD Product**: implementado en esta mejora (ver `productos/[slug]`).
  Falta `Organization` y `BreadcrumbList` en la home y `BlogPosting` en
  cada post.
- **`@astrojs/sitemap`**: no instalado. Falta `sitemap.xml` y `robots.txt`.
- **Verde pago real**: Mercado Pago / Stripe + backend con stock real.
- **Backend de pedidos**: hoy todo vive en localStorage del cliente.
- **PWA / offline**: no hay service worker.
- **i18n**: el sitio es monolingüe (es-AR).

## Disclaimer

Esta es una tienda de **demostración**. No procesa pagos reales, no envía
emails, no despacha pedidos. El "checkout" simula el flujo completo y
muestra un número de pedido ficticio para mostrar el resumen. No usar en
producción sin reemplazar la lógica de checkout por un proveedor de pagos
real (Mercado Pago, Stripe, etc.) y un backend con stock real.
