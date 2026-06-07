import path from "node:path";
import { fileURLToPath } from "node:url";

/** Extension package root - content globs must be absolute (Tailwind resolves from cwd). */
const extensionRoot = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    path.join(extensionRoot, "newtab.html"),
    path.join(extensionRoot, "index.html"),
    path.join(extensionRoot, "src/**/*.{ts,tsx}"),
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "-apple-system",
          "BlinkMacSystemFont",
          "Inter",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
    },
  },
  plugins: [],
};
