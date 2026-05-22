import { createFileRoute } from "@tanstack/react-router";
import {
  errorJson,
  json,
  preflight,
  requireBrandId,
} from "@/lib/jackpot/http";
import { cloneJackpot } from "@/lib/jackpot/store.server";

export const Route = createFileRoute("/api/v1/jackpots/clone/$id")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      POST: async ({ request, params }) => {
        const brand = requireBrandId(request);
        if (brand instanceof Response) return brand;
        const id = Number(params.id);
        if (!Number.isFinite(id)) return errorJson("Invalid id", 400);
        try {
          const cloned = await cloneJackpot(brand, id);
          if (!cloned) return errorJson(`Jackpot ${id} not found`, 404);
          return json(cloned, { status: 201 });
        } catch (e: any) {
          return errorJson(e?.message ?? "Clone failed", 500);
        }
      },
    },
  },
});
