import { defineConfig } from '@playwright/test';

// E2E runs against the production build served by `vite preview` (port 4317),
// so missing hashed assets or base-path mistakes show up as test failures.
const PORT = 4317;

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30 * 60 * 1000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  outputDir: 'test-results',
  use: {
    baseURL: process.env.E2E_URL ?? `http://localhost:${PORT}/`,
    viewport: { width: 1600, height: 900 },
    // No tracing: the bot polls the debug view every few frames for minutes, which makes
    // a 700 MB trace whose teardown stalls. Failures still get a screenshot + error context.
    trace: 'off',
    screenshot: 'only-on-failure',
    actionTimeout: 15_000,
    launchOptions: {
      // Use the real GPU when present; Chromium falls back to SwiftShader otherwise.
      args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'],
    },
  },
  webServer: process.env.E2E_URL
    ? undefined
    : {
        command: `npx vite build && npx vite preview --port ${PORT} --strictPort`,
        url: `http://localhost:${PORT}/`,
        reuseExistingServer: true,
        timeout: 180_000,
      },
});
