import { createFileRoute } from "@tanstack/react-router";
import { errorJson, json, preflight, requireBrandId } from "@/lib/jackpot/http";
import { simulateEngine } from "@/lib/jackpot/simulator";
import type { JackpotConfigDTO } from "@/lib/jackpot/types";

/**
 * Live simulator endpoint.
 *
 * Strict contract:
 *   - Body MUST be a full JackpotConfigDTO (pool + seed required).
 *   - `wager` and `iterations` come from query string.
 *   - No caching, no mocks, no DB fallback — every request runs a fresh
 *     simulateEngine() pass and returns the raw engine output.
 *
 * For the legacy id-based flow see `/api/v1/event/simulate` (simulate.ts).
 */
export const Route = createFileRoute("/api/v1/event/simulate-bet")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      POST: async ({ request }) => {
        const brand = requireBrandId(request);
        if (brand instanceof Response) return brand;

        const url = new URL(request.url);
        const iterations = Number(url.searchParams.get("iterations") ?? "0") || 0;
        const wager = Number(url.searchParams.get("wager") ?? "0") || 0;

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return errorJson("Invalid JSON body", 400);
        }

        if (!body || typeof body !== "object") {
          return errorJson("Body must be a JackpotConfigDTO object", 400);
        }
        const candidate = body as Partial<JackpotConfigDTO>;
        if (!candidate.pool || !candidate.seed) {
          return errorJson(
            "Body must be a full JackpotConfigDTO (pool + seed required). " +
              "The id-only shortcut is not supported on /simulate-bet — use /simulate.",
            400,
          );
        }

        const jp = candidate as JackpotConfigDTO;

        // Fresh, uncached engine pass — no memoization, no stored result reuse.
        const result = simulateEngine(jp, wager, iterations);

        return json({
          brandId: brand,
          jackpotId: jp.id,
          receivedAt: new Date().toISOString(),
          requestedIterations: iterations,
          requestedWager: wager,
          ...result,
        });
      },
    },
  },
});
