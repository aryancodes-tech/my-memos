import fs from "node:fs";
import net from "node:net";
import path from "node:path";

const root = process.cwd();
const devSessionPath = path.join(root, ".dev-session");
const devPort = 5173;

/** Returns true when something is already listening on the Vite dev port. */
function isDevPortInUse() {
  return new Promise((resolve) => {
    const probe = net.createServer();

    probe.once("error", () => resolve(true));
    probe.once("listening", () => {
      probe.close(() => resolve(false));
    });

    probe.listen(devPort, "127.0.0.1");
  });
}

const forceBuild = process.env.FORCE_BUILD === "1";
const devPortBusy = await isDevPortInUse();
const hasDevSession = fs.existsSync(devSessionPath);

if (!forceBuild && (devPortBusy || hasDevSession)) {
  console.error("\n[MyMemos] Blocked production build while dev mode is active.");
  console.error(
    "npm run build replaces extension/dist with a static bundle - live reload stops working.",
  );
  console.error("\nFor live changes, use:");
  console.error("  cd extension");
  console.error("  npm run dev");
  console.error("  npm run dev:check");
  console.error(
    '\nThen reload the extension in chrome://extensions (name must be "MyMemos (Dev)").',
  );
  console.error("\nTo build for production anyway:");
  console.error("  1. Stop npm run dev (Ctrl+C)");
  console.error("  2. FORCE_BUILD=1 npm run build\n");
  process.exit(1);
}
