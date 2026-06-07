import fs from "node:fs";
import type { Server as HttpServer, ServerResponse } from "node:http";
import path from "node:path";
import type { Plugin, ViteDevServer } from "vite";
import { createServer as createViteServer } from "vite";

/** URL prefix for the embedded live demo. */
const WEB_DEMO_PREFIX = "/demo";

/** Built demo artifacts consumed during preview. */
const PUBLIC_DEMO_DIR = path.resolve(process.cwd(), "public/demo");

/**
 * Mounts the extension Vite app at /demo during landing-site dev.
 * TanStack Start otherwise captures /demo and returns the marketing SSR shell.
 */
export function webAppDevPlugin(): Plugin {
  let webAppServer: ViteDevServer | undefined;

  return {
    name: "mymemos-web-demo-dev",
    enforce: "pre",
    async configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? "").split("?")[0];
        if (url === WEB_DEMO_PREFIX) {
          const query = req.url?.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
          res.writeHead(301, { Location: `${WEB_DEMO_PREFIX}/${query}` });
          res.end();
          return;
        }
        next();
      });

      // Post hook: parent httpServer is available after internal middleware is installed.
      return async () => {
        if (webAppServer) {
          return;
        }

        const parentHttpServer = server.httpServer as HttpServer | undefined;
        const parentPort =
          typeof server.config.server.port === "number" ? server.config.server.port : 8080;

        // vite.web.config.ts skips its standalone HMR port when this flag is set.
        process.env.MYMEMOS_EMBEDDED_DEV = "1";

        webAppServer = await createViteServer({
          configFile: path.resolve(process.cwd(), "extension/vite.web.config.ts"),
          root: path.resolve(process.cwd(), "extension"),
          server: {
            middlewareMode: true,
            // Route HMR through the landing dev server (8080), not a separate port.
            hmr: parentHttpServer
              ? {
                  server: parentHttpServer,
                  path: WEB_DEMO_PREFIX,
                  port: parentPort,
                  clientPort: parentPort,
                }
              : false,
          },
          appType: "spa",
          optimizeDeps: {
            entries: [path.resolve(process.cwd(), "extension/index.html")],
          },
        });

        server.middlewares.use(WEB_DEMO_PREFIX, webAppServer.middlewares);
      };
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? "").split("?")[0];

        if (url === WEB_DEMO_PREFIX) {
          const query = req.url?.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
          res.writeHead(301, { Location: `${WEB_DEMO_PREFIX}/${query}` });
          res.end();
          return;
        }

        if (!url.startsWith(`${WEB_DEMO_PREFIX}/`)) {
          next();
          return;
        }

        serveBuiltDemo(url, res, next);
      });
    },
    async closeBundle() {
      await webAppServer?.close();
    },
  };
}

/** Serves prebuilt files from public/demo/ during preview. */
function serveBuiltDemo(url: string, res: ServerResponse, next: () => void) {
  const relative =
    url === `${WEB_DEMO_PREFIX}/` ? "index.html" : url.slice(`${WEB_DEMO_PREFIX}/`.length);
  const filePath = path.join(PUBLIC_DEMO_DIR, relative);
  const resolved = path.resolve(filePath);

  if (!resolved.startsWith(PUBLIC_DEMO_DIR)) {
    next();
    return;
  }

  if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
    res.setHeader("Content-Type", contentType(resolved));
    fs.createReadStream(resolved).pipe(res);
    return;
  }

  const indexPath = path.join(PUBLIC_DEMO_DIR, "index.html");
  if (fs.existsSync(indexPath)) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    fs.createReadStream(indexPath).pipe(res);
    return;
  }

  next();
}

function contentType(filePath: string): string {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".png")) return "image/png";
  if (filePath.endsWith(".svg")) return "image/svg+xml";
  return "application/octet-stream";
}
