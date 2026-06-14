import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        resolve: {
          alias: {
            "@": path.resolve(__dirname, "extension/src"),
          },
        },
        test: {
          name: "extension",
          environment: "happy-dom",
          include: ["extension/src/**/*.test.ts"],
        },
      },
      {
        resolve: {
          alias: {
            "@": path.resolve(__dirname, "src"),
          },
        },
        test: {
          name: "landing",
          environment: "happy-dom",
          include: ["src/**/*.test.ts"],
        },
      },
    ],
    coverage: {
      provider: "v8",
      include: ["extension/src/lib/**", "extension/src/storage/**", "src/lib/**"],
    },
  },
});
