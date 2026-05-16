import { createFileRoute } from "@tanstack/react-router";
import { errorJson, json, preflight, requireBrandId } from "@/lib/jackpot/http";
import { createJackpot, listJackpots } from "@/lib/jackpot/store.server";
import type { JackpotDTO } from "@/lib/jackpot/types";

export const Route = createFileRoute("/api/v1/jackpots/")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async ({ request }) => {
        const brand = requireBrandId(request);
        if (brand instanceof Response) return brand;
        const url = new URL(request.url);
        const filterExp = url.searchParams.get("filterExp");
        return json(await listJackpots(brand, filterExp));
      },
      POST: async ({ request }) => {
        const brand = requireBrandId(request);
        if (brand instanceof Response) return brand;
        let body: Partial<JackpotDTO>;
        try {
          body = (await request.json()) as Partial<JackpotDTO>;
        } catch {
          return errorJson("Invalid JSON body", 400);
        }
        return json(await createJackpot(brand, body), { status: 201 });
      },
    },
  },
});
