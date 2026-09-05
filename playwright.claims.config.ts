import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/claims',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  workers: 4,
  fullyParallel: true,
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
    timeout: 120_000
  },
  projects: [{ name: 'claims-chromium', use: { ...devices['Desktop Chrome'] } }]
});
