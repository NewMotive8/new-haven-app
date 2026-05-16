import { createFileRoute } from "@tanstack/react-router";
import { errorJson, json, preflight, requireBrandId } from "@/lib/jackpot/http";
import {
  deleteJackpot,
  getJackpot,
  updateJackpot,
} from "@/lib/jackpot/store.server";
import type { JackpotDTO } from "@/lib/jackpot/types";

function parseId(raw: string): number | null {
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export const Route = createFileRoute("/api/v1/jackpots/$id")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async ({ request, params }) => {
        const brand = requireBrandId(request);
        if (brand instanceof Response) return brand;
        const id = parseId(params.id);
        if (id == null) return errorJson("Invalid id", 400);
        const jp = getJackpot(brand, id);
        if (!jp) return errorJson(`Jackpot ${id} not found`, 404);
        return json(jp);
      },
      PUT: async ({ request, params }) => {
        const brand = requireBrandId(request);
        if (brand instanceof Response) return brand;
        const id = parseId(params.id);
        if (id == null) return errorJson("Invalid id", 400);
        let body: Partial<JackpotDTO>;
        try {
          body = (await request.json()) as Partial<JackpotDTO>;
        } catch {
          return errorJson("Invalid JSON body", 400);
        }
        const updated = updateJackpot(brand, id, body);
        if (!updated) return errorJson(`Jackpot ${id} not found`, 404);
        return json(updated);
      },
      DELETE: async ({ request, params }) => {
        const brand = requireBrandId(request);
        if (brand instanceof Response) return brand;
        const id = parseId(params.id);
        if (id == null) return errorJson("Invalid id", 400);
        const removed = deleteJackpot(brand, id);
        if (!removed) return errorJson(`Jackpot ${id} not found`, 404);
        return json({ id, deleted: true });
      },
    },
  },
});
