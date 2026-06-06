import { defineManifest } from "@crxjs/vite-plugin";
import type { ConfigEnv } from "vite";
import pkg from "./package.json";

/** Vite dev server port - keep in sync with vite.config.ts server.port. */
const DEV_SERVER_PORT = 5173;
const DEV_SERVER_ORIGIN = `http://localhost:${DEV_SERVER_PORT}`;

function devServerConfig(env: ConfigEnv) {
  if (env.command !== "serve") {
    return {};
  }

  return {
    host_permissions: [`${DEV_SERVER_ORIGIN}/*`],
    content_security_policy: {
      extension_pages:
        "script-src 'self' http://localhost:5173 http://127.0.0.1:5173 'wasm-unsafe-eval'; " +
        "object-src 'self'; " +
        "connect-src 'self' http://localhost:5173 ws://localhost:5173 http://127.0.0.1:5173 ws://127.0.0.1:5173;",
    },
  };
}

/** Chrome extension manifest - source of truth for CRXJS dev + production builds. */
export default defineManifest((env) => ({
  manifest_version: 3,
  name: env.command === "serve" ? "KnowledgeOS (Dev)" : "KnowledgeOS",
  version: pkg.version,
  description:
    "A Notion-inspired personal knowledge management and learning dashboard that replaces your New Tab.",
  permissions: ["storage"],
  chrome_url_overrides: {
    newtab: "newtab.html",
  },
  background: {
    service_worker: "public/background.js",
    type: "module",
  },
  action: {
    default_title: "KnowledgeOS",
    default_icon: {
      "16": "public/icons/icon-16.png",
      "48": "public/icons/icon-48.png",
      "128": "public/icons/icon-128.png",
    },
  },
  icons: {
    "16": "public/icons/icon-16.png",
    "48": "public/icons/icon-48.png",
    "128": "public/icons/icon-128.png",
  },
  ...devServerConfig(env),
}));
