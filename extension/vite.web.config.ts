import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

/** Public URL path where the standalone web app is served (landing site + deploy). */
export const WEB_DEMO_BASE = "/demo/";

/**
 * Vite config for the standalone web build of the extension UI.
 * Produces a static SPA in public/demo/ for the TanStack Start site to serve.
 */
export default defineConfig({
  plugins: [react()],
  base: WEB_DEMO_BASE,
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
    extensions: [".tsx", ".ts", ".jsx", ".js", ".json"],
  },
  css: {
    postcss: path.resolve(__dirname, "postcss.config.js"),
  },
  build: {
    outDir: path.resolve(__dirname, "../public/demo"),
    emptyOutDir: true,
  },
  server: {
    host: "localhost",
    port: 5174,
    strictPort: true,
    hmr: {
      port: 5175,
    },
  },
});
