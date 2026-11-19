# Muebles Río Luján · demo de tienda

Demo de portfolio: tienda online de una mueblería ficticia de Tucumán. El mueble se fabrica mientras lo elegís: la silla se arma con el scroll, cambia de madera y tela, se prueba en una habitación a escala, pasa por los quince días del taller, se embala y viaja en camión a tu provincia.

Marca, productos, personas, compras y pagos son ficticios. No hay backend, APIs ni servicios externos: todo corre en el navegador.

## Cómo correrlo

Requiere Node 22.12 o superior y pnpm.

```bash
pnpm install
pnpm dev          # http://localhost:4611
pnpm build        # salida estática en dist/
pnpm preview      # sirve dist/ en http://localhost:4611
pnpm check        # astro check (TypeScript estricto)
pnpm test:smoke   # Playwright contra dist/: todas las vistas, 390 px, movimiento reducido, compra completa y modo vitrina
pnpm poster       # regenera public/poster.jpg (1600x900) desde la página real
```

`pnpm test:smoke` y `pnpm poster` levantan su propio servidor estático en el puerto 4611 (o reutilizan uno que ya esté escuchando). Necesitan Chromium de Playwright: `pnpm exec playwright install chromium`.

## Grabar el modo vitrina

1. `pnpm build && pnpm preview`
2. Abrí `http://localhost:4611/?showcase` en una ventana de 1440x900 (o 1600x900).
3. La página recorre sola las seis escenas en un loop de unos 24 segundos: la silla se arma, cambia de madera y medida, el sillón se mueve por la habitación, avanzan los quince días del taller, la caja se cierra y se etiqueta, y el camión viaja a Santa Cruz y a Misiones. Entre medio aparecen compras en vivo.
4. El cursor se oculta. Grabá con cualquier capturador de pantalla.

El modo vitrina arranca siempre desde un estado limpio en memoria y nunca escribe sobre la sesión guardada del visitante. Con `prefers-reduced-motion` no se mueve solo.

## Qué incluye

- **Inicio**: las seis escenas del brief (armado con el scroll, configurador, habitación a escala con regla en centímetros, producción con orden de taller, embalaje y mapa de envío) y la carta del taller.
- **Catálogo**: 60 muebles con filtros por ambiente, madera y tapizado, búsqueda, orden (incluido "más vendidos ahora") y reordenamiento con GSAP Flip. Los filtros quedan en la URL.
- **Ficha de producto** (60 páginas): configurador de madera, tela y medida con precio rodante, personas viendo y cupos en vivo, envío por provincia, habitación a escala y producción.
- **Comparar medidas**: dos muebles superpuestos de frente y desde arriba, con tabla de diferencias.
- **Showroom**: cuatro ambientes armados, con opción de comprar el ambiente completo.
- **Carrito**, **checkout** en cuatro pasos con datos de prueba precargados, **confirmación y seguimiento** del pedido (etapas, barra de avance y camión en el mapa), **favoritos** y **mi cuenta**.
- **Capa en vivo**: un único motor de simulación (`src/lib/sim.ts`) mueve compras de otras personas (ticker y avisos), stock que baja, personas viendo cada mueble, pedidos que avanzan y una central de notificaciones con contador. Se puede pausar y acelerar (1×, 2×, 4×).
- **Atajos**: Ctrl/⌘ + K abre la paleta de comandos, `?` muestra todos los atajos, `G` + letra navega, `P` pausa la simulación.
- Estado compartido en `localStorage` con botón **Reiniciar demo**.

## Datos

`src/data/catalog.ts` genera los 60 productos con una semilla fija (`mulberry32`), así el build y el navegador producen exactamente el mismo catálogo. `src/data/argentina.ts` tiene un contorno simplificado del país y las capitales provinciales para calcular plazos y costos de envío desde Tucumán.

## Créditos

Tipografías Instrument Serif e Instrument Sans (SIL Open Font License), servidas desde `public/fonts/`. Todos los muebles, la habitación, el taller y el mapa están dibujados en SVG por código.
