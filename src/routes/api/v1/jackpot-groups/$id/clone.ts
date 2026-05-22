import { createFileRoute } from "@tanstack/react-router";
import {
  errorJson,
  json,
  preflight,
  requireBrandId,
} from "@/lib/jackpot/http";
import { cloneGroup, getGroup } from "@/lib/jackpot/store.server";

export const Route = createFileRoute("/api/v1/jackpot-groups/$id/clone")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      POST: async ({ request, params }) => {
        const brand = requireBrandId(request);
        if (brand instanceof Response) return brand;
        const existing = await getGroup(params.id);
        if (!existing) return errorJson(`Group ${params.id} not found`, 404);
        if (Number(existing.brandId) !== Number(brand)) {
          return errorJson("Group does not belong to brand", 403);
        }
        try {
          const cloned = await cloneGroup(brand, params.id);
          return json(cloned, { status: 201 });
        } catch (e: any) {
          return errorJson(e?.message ?? "Clone failed", 500);
        }
      },
    },
  },
});
