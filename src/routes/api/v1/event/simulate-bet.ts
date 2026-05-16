import { createFileRoute } from "@tanstack/react-router";
import { errorJson, json, preflight, requireBrandId } from "@/lib/jackpot/http";
import type { JackpotDTO } from "@/lib/jackpot/types";

export const Route = createFileRoute("/api/v1/event/simulate-bet")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      POST: async ({ request }) => {
        const brand = requireBrandId(request);
        if (brand instanceof Response) return brand;

        const url = new URL(request.url);
        const iterations = Math.max(
          0,
          Math.min(Number(url.searchParams.get("iterations") ?? "0") || 0, 1_000_000),
        );
        const wager = Number(url.searchParams.get("wager") ?? "0") || 0;

        let jp: JackpotDTO;
        try {
          jp = (await request.json()) as JackpotDTO;
        } catch {
          return errorJson("Invalid JSON body", 400);
        }
        if (typeof jp?.contributionRate !== "number") {
          return errorJson("Body must include a JackpotDTO", 400);
        }

        let pool = Number(jp.poolBalance) || 0;
        const seed = Number(jp.seedAmount) || 0;
        const trigger = Number(jp.triggerThreshold) || 0;
        const rate = Number(jp.contributionRate) || 0;

        let hits = 0;
        let contributions = 0;
        const sample: Array<{ i: number; pool: number; hit: boolean }> = [];
        const sampleEvery = Math.max(1, Math.floor(iterations / 50));

        for (let i = 0; i < iterations; i++) {
          const c = wager * rate;
          pool += c;
          contributions += c;
          let hit = false;
          if (pool >= trigger && Math.random() < 0.01) {
            hits++;
            hit = true;
            pool = seed;
          }
          if (i % sampleEvery === 0 || hit) {
            sample.push({ i: i + 1, pool, hit });
          }
        }

        return json({
          brandId: brand,
          jackpotId: jp.id,
          iterations,
          wager,
          contributions,
          hits,
          finalPool: pool,
          sample,
        });
      },
    },
  },
});
