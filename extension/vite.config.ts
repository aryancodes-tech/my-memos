import { crx } from "@crxjs/vite-plugin";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";
import manifest from "./manifest.config";

/** Vite dev server port - keep in sync with manifest.config.ts DEV_SERVER_PORT. */
const DEV_SERVER_PORT = 5173;

export default defineConfig({
  plugins: [
    react(),
    crx({
      manifest,
      contentScripts: {
        hmrTimeout: 10000,
      },
    }),
  ],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
    extensions: [".tsx", ".ts", ".jsx", ".js", ".json"],
  },
  server: {
    host: "localhost",
    port: DEV_SERVER_PORT,
    strictPort: true,
    cors: {
      origin: [/chrome-extension:\/\//],
    },
    hmr: {
      host: "localhost",
      port: DEV_SERVER_PORT,
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
