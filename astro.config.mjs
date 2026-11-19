// @ts-check
import { defineConfig } from 'astro/config';

// Static demo store: no server, no adapters, no external services.
export default defineConfig({
  site: 'https://09-ecommerce-marca.vercel.app',
  output: 'static',
  trailingSlash: 'ignore',
  build: {
    inlineStylesheets: 'always',
  },
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
  devToolbar: { enabled: false },
  server: { port: 4611 },
});
