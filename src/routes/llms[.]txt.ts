import { createFileRoute } from "@tanstack/react-router";

import { buildLlmsTxt, resolveSiteOrigin } from "@/lib/seo";

/** Serves `/llms.txt` for AI crawlers per https://llmstxt.org/ */
export const Route = createFileRoute("/llms.txt")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const requestOrigin = new URL(request.url).origin;
        const origin = resolveSiteOrigin(requestOrigin);
        const body = buildLlmsTxt(origin);

        return new Response(body, {
          headers: {
            "content-type": "text/plain; charset=utf-8",
            "cache-control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
