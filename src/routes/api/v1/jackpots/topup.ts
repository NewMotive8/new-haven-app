import { createFileRoute } from "@tanstack/react-router";
import { errorJson, json, preflight, requireBrandId } from "@/lib/jackpot/http";
import { applyTopup } from "@/lib/jackpot/store.server";
import type { TopupDTO } from "@/lib/jackpot/types";

export const Route = createFileRoute("/api/v1/jackpots/topup")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      POST: async ({ request }) => {
        const brand = requireBrandId(request);
        if (brand instanceof Response) return brand;
        let body: TopupDTO;
        try {
          body = (await request.json()) as TopupDTO;
        } catch {
          return errorJson("Invalid JSON body", 400);
        }
        if (
          typeof body?.jackpotId !== "number" ||
          typeof body?.amount !== "number" ||
          typeof body?.backofficeUser !== "string" ||
          typeof body?.isSeed !== "boolean"
        ) {
          return errorJson(
            "Body must be { jackpotId: number, amount: number, backofficeUser: string, isSeed: boolean }",
            400,
          );
        }
        const updated = await applyTopup(brand, body);
        if (!updated) return errorJson(`Jackpot ${body.jackpotId} not found`, 404);
        return json(updated);
      },
    },
  },
});
