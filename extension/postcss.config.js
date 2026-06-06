import path from "node:path";
import { fileURLToPath } from "node:url";

/** Extension package root for PostCSS/Tailwind config resolution. */
const extensionRoot = path.dirname(fileURLToPath(import.meta.url));

export default {
  plugins: {
    tailwindcss: { config: path.join(extensionRoot, "tailwind.config.js") },
    autoprefixer: {},
  },
};
