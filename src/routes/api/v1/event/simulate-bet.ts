import { createFileRoute } from "@tanstack/react-router";
import { errorJson, json, preflight, requireBrandId } from "@/lib/jackpot/http";
import { simulateEngine } from "@/lib/jackpot/simulator";
import type { JackpotConfigDTO } from "@/lib/jackpot/types";

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

        let jp: JackpotConfigDTO;
        try {
          jp = (await request.json()) as JackpotConfigDTO;
        } catch {
          return errorJson("Invalid JSON body", 400);
        }
        if (!jp?.pool || !jp?.seed) {
          return errorJson(
            "Body must be a JackpotConfigDTO with pool and seed objects",
            400,
          );
        }

        const result = simulateEngine(jp, wager, iterations);
        return json({ brandId: brand, jackpotId: jp.id, ...result });
      },
    },
  },
});
