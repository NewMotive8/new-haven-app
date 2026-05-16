import { createFileRoute } from "@tanstack/react-router";
import { errorJson, json, preflight, requireBrandId } from "@/lib/jackpot/http";
import { simulateEngine } from "@/lib/jackpot/simulator";
import { getJackpotConfig } from "@/lib/jackpot/store.server";
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

        let body: any;
        try {
          body = await request.json();
        } catch {
          return errorJson("Invalid JSON body", 400);
        }

        let jp: JackpotConfigDTO | undefined;

        // If the body only carries an id, pull the live config from the database.
        // Otherwise treat the body as a full JackpotConfigDTO override.
        if (body?.pool && body?.seed) {
          jp = body as JackpotConfigDTO;
        } else if (body?.id != null) {
          jp = await getJackpotConfig(brand, Number(body.id));
          if (!jp) return errorJson(`Jackpot ${body.id} not found`, 404);
        } else {
          return errorJson(
            "Body must be a JackpotConfigDTO (pool + seed) or { id: number }",
            400,
          );
        }

        const result = simulateEngine(jp, wager, iterations);
        return json({ brandId: brand, jackpotId: jp.id, ...result });
      },
    },
  },
});
