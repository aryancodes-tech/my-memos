import fs from "node:fs";
import net from "node:net";
import path from "node:path";

import { c, command, errorBlock, numbered } from "../../scripts/cli-style.mjs";

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
  errorBlock("Blocked production build while dev mode is active", [
    `${c.bold("npm run build")} replaces extension/dist with a static bundle — live reload stops.`,
    "",
    c.bold("For live changes, use"),
  ]);
  command("cd extension");
  command("npm run dev");
  command("npm run dev:check");
  console.error("");
  console.error(
    `  ${c.dim('Then reload the extension (name must be "MyMemos (Dev)").')}`,
  );
  console.error("");
  console.error(`  ${c.bold("To build for production anyway")}`);
  numbered(["Stop npm run dev (Ctrl+C)", "FORCE_BUILD=1 npm run build"]);
  console.error("");
  process.exit(1);
}
