import { defineConfig } from "vitest/config";
export default defineConfig({
  test: { include: ["tests/**/*.test.{ts,tsx}"], testTimeout: 120000 },
  resolve: { alias: { "@": new URL("./src", import.meta.url).pathname } },
});
