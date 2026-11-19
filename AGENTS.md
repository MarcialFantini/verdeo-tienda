## Project: Muebles Río Luján (09-ecommerce-marca)

Portfolio demo of an online furniture store for a fictional brand from Tucumán, Argentina. Concept: the piece is built while you choose it. Brief: `../11-marca-personal-marcial-fantini/docs/briefs/demo-ecommerce-marca.md`.

**Stack**: Astro 7 (static output) + strict TypeScript (`astro/tsconfigs/strictest`), plain CSS with custom properties, GSAP 3 loaded on demand (ScrollTrigger, Flip, Draggable, MotionPathPlugin), Astro `ClientRouter` view transitions. No framework islands, no backend, no external services.

**Commands**: `pnpm dev` / `pnpm preview` (port 4611), `pnpm build`, `pnpm check`, `pnpm test:smoke` (Playwright against `dist/`), `pnpm poster` (writes `public/poster.jpg`). Run `pnpm build` before smoke or poster.

**Rules**
- UI copy in neutral professional Spanish; identifiers and comments in English.
- Animate only transform/opacity (plus SVG attributes and canvas). Every motion needs a `prefers-reduced-motion` fallback; the simulation starts paused under reduced motion.
- `?showcase` and `?still` run on an in-memory store and must never write the saved session.
- Keep a visible "Demo" mark in the header. Data is fictional; never present it as real customers.
- House style (taste skill): no gradients, no eyebrows, no monospace, square buttons, shadows only on floating overlays.

**Layout**
- `src/data/catalog.ts`: seeded generator for the 60 products, woods, fabrics, sizes, prices and production stages. `src/data/argentina.ts`: map outline, provinces, shipping quotes.
- `src/lib/iso.ts`: isometric box renderer used for every piece of furniture (server and client). `src/lib/box.ts`: packing box scene. `src/lib/room.ts`: room scale helpers.
- `src/lib/store.ts`: single client store (cart, wishlist, orders, notices, sim state), persisted in `localStorage` key `rioLujan.demo.v2`, synced across tabs.
- `src/lib/sim.ts`: the one simulation clock (1 s = speed × 1 sim hour) behind purchases, stock, viewers and order progress.
- `src/lib/page.ts`: `mount(selector, init)` lifecycle for ClientRouter page swaps. Every view script uses it.
- `src/scripts/shell.ts`: persistent shell (counters, ticker, toasts, notifications popover, command palette, shortcuts, reset). `src/scripts/showcase.ts`: the showcase loop.
- `src/components/`: `Configurator`, `RoomScene`, `ProductionSlip`, `BoxScene`, `ShippingMap`, `Furniture`, `ProductCard`, `Icon`.
- `src/pages/`: `index`, `catalogo`, `producto/[slug]` (60), `comparar`, `showroom`, `carrito`, `checkout`, `pedido`, `favoritos`, `cuenta`, `404`.
- `src/styles/`: `global` (tokens), `shell`, `store`, `scenes`, `home`, `commerce`, `views`. All inlined at build.
- `scripts/`: `serve.mjs` (static server with compression), `smoke.mjs`, `poster.mjs`, `shot.mjs` (dev screenshots).

**Gotchas**
- `[hidden]` is forced to `display: none !important` in `global.css`; components may set `display` freely.
- Client renders that run on every sim tick must compare a signature before touching the DOM, or focus and hover are lost.
- `.furniture` uses a definite 1×1 grid so the SVG fits its box; percent heights on grid items otherwise collapse to content.
