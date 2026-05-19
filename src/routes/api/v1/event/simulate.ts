// LEGACY ENDPOINT — id-based simulator that loads a stored JackpotDTO from
// the mock store and adapts it into a JackpotConfigDTO.
//
// The admin simulator UI (src/routes/admin.simulator.tsx) does NOT call this
// route. It posts a full live JackpotConfigDTO to `/api/v1/event/simulate-bet`
// instead, so any edits to the textarea flow straight into simulateEngine
// without touching this legacy path. Keep this file only for the older
// `{ jackpotId }` callers.
import { createFileRoute } from "@tanstack/react-router";
import { errorJson, json, preflight, requireBrandId } from "@/lib/jackpot/http";
import { getJackpot, updateJackpot } from "@/lib/jackpot/store.server";
import { simulateEngine } from "@/lib/jackpot/simulator";
import { mulberry32 } from "@/lib/jackpot/rng";
import type { JackpotConfigDTO, JackpotDTO, SimulatorDTO } from "@/lib/jackpot/types";

// Adapt the legacy flat JackpotDTO stored in the mock to the engine's rich config.
function toConfig(jp: JackpotDTO): JackpotConfigDTO {
  return {
    id: jp.id,
    name: jp.name,
    enabled: jp.enabled,
    brandId: jp.brandId,
    type: "AVERAGE",
    volatility: 1,
    pool: {
      currentAmount: jp.poolBalance,
      minimumAmount: jp.seedAmount,
      maximumAmount: jp.triggerThreshold,
      contributionAmount: jp.contributionRate * 100, // rate -> percent
      contributionType: "PERCENTAGE",
    },
    seed: {
      currentAmount: jp.seedAmount,
      targetAmount: jp.seedAmount,
      contributionAmount: 0,
      contributionType: "FIXED",
    },
  };
}

export const Route = createFileRoute("/api/v1/event/simulate")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      POST: async ({ request }) => {
        const brand = requireBrandId(request);
        if (brand instanceof Response) return brand;
        let body: SimulatorDTO;
        try {
          body = (await request.json()) as SimulatorDTO;
        } catch {
          return errorJson("Invalid JSON body", 400);
        }
        const jp = await getJackpot(brand, Number(body.jackpotId));
        if (!jp) return errorJson(`Jackpot ${body.jackpotId} not found`, 404);

        const seed = Number((body as SimulatorDTO).rngSeed);
        const rng = Number.isFinite(seed) ? mulberry32(seed) : undefined;
        const result = rng
          ? simulateEngine(toConfig(jp), Number(body.wager) || 0, Number(body.iterations) || 0, rng)
          : simulateEngine(toConfig(jp), Number(body.wager) || 0, Number(body.iterations) || 0);

        // Persist new pool balance back to the database.
        await updateJackpot(brand, jp.id, { poolBalance: result.finalPool });

        return json({ jackpotId: jp.id, ...result });
      },
    },
  },
});
