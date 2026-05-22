import { createFileRoute } from "@tanstack/react-router";
import { errorJson, json, preflight, requireBrandId } from "@/lib/jackpot/http";
import {
  deleteJackpot,
  getJackpot,
  updateJackpot,
  GroupConflictError,
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
        try {
          const jp = await getJackpot(brand, id);
          if (!jp) return errorJson(`Jackpot ${id} not found`, 404);
          return json(jp);
        } catch (e: any) {
          return errorJson(e?.message ?? "Internal error", 500);
        }
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
        try {
          const updated = await updateJackpot(brand, id, body);
          if (!updated) return errorJson(`Jackpot ${id} not found`, 404);
          return json(updated);
        } catch (e: any) {
          if (e instanceof GroupConflictError) return errorJson(e.message, 409);
          return errorJson(e?.message ?? "Update failed", 500);
        }
      },
      DELETE: async ({ request, params }) => {
        const brand = requireBrandId(request);
        if (brand instanceof Response) return brand;
        const id = parseId(params.id);
        if (id == null) return errorJson("Invalid id", 400);
        try {
          const removed = await deleteJackpot(brand, id);
          if (!removed) return errorJson(`Jackpot ${id} not found`, 404);
          return json({ id, deleted: true });
        } catch (e: any) {
          if (e instanceof GroupConflictError) return errorJson(e.message, 409);
          return errorJson(e?.message ?? "Delete failed", 500);
        }
      },
    },
  },
});
