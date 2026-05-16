import { createFileRoute } from "@tanstack/react-router";
import { errorJson, json, preflight, requireBrandId } from "@/lib/jackpot/http";
import { setEnabled } from "@/lib/jackpot/store.server";

export const Route = createFileRoute("/api/v1/jackpots/enable/$id")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async ({ request, params }) => {
        const brand = requireBrandId(request);
        if (brand instanceof Response) return brand;
        const id = Number(params.id);
        if (!Number.isFinite(id)) return errorJson("Invalid id", 400);
        const updated = setEnabled(brand, id, true);
        if (!updated) return errorJson(`Jackpot ${id} not found`, 404);
        return json(updated);
      },
    },
  },
});
