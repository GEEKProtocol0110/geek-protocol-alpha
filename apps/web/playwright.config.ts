import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    // Playwright's default is 60s. Under `npm run verify` this task starts
    // alongside the other turbo tasks, and a cold Next dev boot on a loaded
    // machine regularly runs past a minute — which failed the suite before a
    // single test had run. Two minutes is slack, not patience for a real hang.
    timeout: 120_000,
    // Surface Next's own startup output when it does fail, rather than leaving
    // only "Timed out waiting for http://localhost:3000".
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
