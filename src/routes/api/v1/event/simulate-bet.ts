import { createFileRoute } from "@tanstack/react-router";
import { errorJson, json, preflight, requireBrandId } from "@/lib/jackpot/http";
import { simulateEngine } from "@/lib/jackpot/simulator";
import { constantRng, mulberry32 } from "@/lib/jackpot/rng";
import type { RngSource } from "@/lib/jackpot/math";
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
        const candidate = body as Partial<JackpotConfigDTO> & {
          externalRoll?: number;
          externalRollMax?: number;
          rngSeed?: number;
        };
        if (!candidate.pool || !candidate.seed) {
          return errorJson(
            "Body must be a full JackpotConfigDTO (pool + seed required). " +
              "The id-only shortcut is not supported on /simulate-bet — use /simulate.",
            400,
          );
        }

        const jp = candidate as JackpotConfigDTO;

        // ── Deterministic RNG injection (query or body).
        //    externalRoll + externalRollMax → constantRng (single-shot pre-rolled value).
        //    rngSeed (fallback) → mulberry32 seeded stream.
        const qRoll = url.searchParams.get("externalRoll");
        const qRollMax = url.searchParams.get("externalRollMax");
        const qSeed = url.searchParams.get("rngSeed");
        const externalRoll = qRoll != null ? Number(qRoll) : candidate.externalRoll;
        const externalRollMaxRaw = qRollMax != null ? Number(qRollMax) : candidate.externalRollMax;
        // Compliance default: if a deterministic roll is supplied without an explicit
        // denominator, snap the max to the certified 10M RNG keyspace.
        const externalRollMax =
          Number.isFinite(externalRoll) && !Number.isFinite(externalRollMaxRaw)
            ? 10_000_000
            : externalRollMaxRaw;
        const rngSeed = qSeed != null ? Number(qSeed) : candidate.rngSeed;

        let rng: RngSource | undefined;
        if (Number.isFinite(externalRoll) && Number.isFinite(externalRollMax) && Number(externalRollMax) > 0) {
          const unit = Number(externalRoll) / Number(externalRollMax);
          rng = constantRng(unit);
        } else if (Number.isFinite(rngSeed)) {
          rng = mulberry32(Number(rngSeed));
        }

        const result = rng
          ? simulateEngine(jp, wager, iterations, rng)
          : simulateEngine(jp, wager, iterations);

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
