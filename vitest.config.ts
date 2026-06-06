import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "extension/src"),
    },
  },
  test: {
    environment: "happy-dom",
    include: ["extension/src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["extension/src/lib/**", "extension/src/storage/**"],
    },
  },
});
