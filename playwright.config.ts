import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:3101/darts-score/", trace: "on-first-retry" },
  projects: [{ name: "mobile", use: { ...devices["Pixel 5"] } }],
  webServer: {
    command: "npx vite --config demo/vite.config.ts --port 3101",
    url: "http://localhost:3101/darts-score/",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
