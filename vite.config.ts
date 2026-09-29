import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: { port: 5317, strictPort: true },
  preview: { port: 4317, strictPort: true },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 900,
    assetsInlineLimit: 0,
  },
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
} as never);
