import { defineConfig, devices } from "@playwright/test";

/**
 * Alvo do Playwright:
 * - CI smoke: E2E_BASE_URL=http://127.0.0.1:3000 (build local do commit)
 * - Specs logados no CI: E2E_BASE_URL=produção (contas dos secrets)
 * - Local sem env: localhost (evita acertar produção por engano)
 * Specs logados: docs/e2e-secrets.md
 */
const baseURL = process.env.E2E_BASE_URL || "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? "github" : "list",
  timeout: 45_000,
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
