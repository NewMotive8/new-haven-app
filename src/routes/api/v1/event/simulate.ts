import { createFileRoute } from "@tanstack/react-router";
import { errorJson, json, preflight, requireBrandId } from "@/lib/jackpot/http";
import { getJackpot, updateJackpot } from "@/lib/jackpot/store.server";
import type { SimulatorDTO } from "@/lib/jackpot/types";

// Tiny deterministic PRNG (mulberry32) — keeps simulations reproducible with rngSeed.
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
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
        const jp = getJackpot(brand, Number(body.jackpotId));
        if (!jp) return errorJson(`Jackpot ${body.jackpotId} not found`, 404);

        const iterations = Math.max(0, Math.min(Number(body.iterations) || 0, 1_000_000));
        const wager = Number(body.wager) || 0;
        const rand = mulberry32(Number(body.rngSeed ?? Date.now()));

        let pool = jp.poolBalance;
        let hits = 0;
        let totalContributed = 0;
        const hitAt: number[] = [];

        for (let i = 0; i < iterations; i++) {
          const contribution = wager * jp.contributionRate;
          pool += contribution;
          totalContributed += contribution;
          if (pool >= jp.triggerThreshold && rand() < 0.01) {
            hits++;
            hitAt.push(i + 1);
            pool = jp.seedAmount;
          }
        }

        updateJackpot(brand, jp.id, { poolBalance: pool });

        return json({
          jackpotId: jp.id,
          iterations,
          totalWagered: wager * iterations,
          totalContributed,
          hits,
          hitAt,
          finalPool: pool,
        });
      },
    },
  },
});
