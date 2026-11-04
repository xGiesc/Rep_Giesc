import { defineConfig } from '@playwright/test';

// In locale si può usare il Chrome di sistema: PW_CHROME=/percorso/chrome
const executablePath = process.env.PW_CHROME || undefined;

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  outputDir: 'test-results',
  webServer: {
    command: 'node scripts/serve-test.mjs',
    port: 4173,
    reuseExistingServer: true,
  },
  use: {
    launchOptions: { executablePath, args: ['--no-sandbox'] },
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'telefono', use: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 } },
    { name: 'pc', use: { viewport: { width: 1280, height: 800 } } },
  ],
});
