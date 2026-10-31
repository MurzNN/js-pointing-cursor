import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  workers: process.env.CI ? 1 : undefined,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  timeout: 20_000,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
    ...(process.env.CI ? {} : { channel: 'chrome' as const }),
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command:
        'pnpm --filter @js-pointing-cursor/playground-vue exec vite --host 127.0.0.1 --port 4173 --strictPort',
      url: 'http://127.0.0.1:4173',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command:
        'pnpm --filter @js-pointing-cursor/playground-react exec vite --host 127.0.0.1 --port 4174 --strictPort',
      url: 'http://127.0.0.1:4174',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
})
