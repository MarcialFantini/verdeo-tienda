# AGENTS — Verdeo Tienda (proyecto 09)

Stack: Astro 7.3 + Preact 10 + @astrojs/vercel + nanostores + TS estricto.
Output: server (SSR). Adapter: @astrojs/vercel — el build genera `.vercel/output/`.
Persistencia: localStorage via @nanostores/persistent (cart, orders, wishlist, recent, coupons, reviews).
Categorías: velas, difusores, jabones, textiles, bundles (38 productos + 5 posts blog).
Cliente ficticio: Verdeo Tienda (productos sustentables para el hogar).
Convenciones de islands: `client:load` para header/badge/button, `client:only="preact"` para cart/checkout/catalog/buscador (toca localStorage), `client:visible` para reviews/recent.
