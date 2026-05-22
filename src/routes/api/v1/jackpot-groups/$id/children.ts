import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  errorJson,
  json,
  preflight,
  requireBrandId,
} from "@/lib/jackpot/http";
import {
  getGroup,
  addChildJackpot,
  GroupConflictError,
} from "@/lib/jackpot/store.server";

const AttachSchema = z.object({
  jackpotId: z.number().int().positive(),
  tierRank: z.number().int().min(0),
  triggerProbability: z.number().min(0).max(1).optional(),
  contributionRate: z.number().min(0).max(1).optional(),
  name: z.string().min(1).max(255).optional(),
});

export const Route = createFileRoute("/api/v1/jackpot-groups/$id/children")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async ({ request, params }) => {
        const brand = requireBrandId(request);
        if (brand instanceof Response) return brand;
        const grp = await getGroup(params.id);
        if (!grp) return errorJson(`Group ${params.id} not found`, 404);
        if (Number(grp.brandId) !== Number(brand)) {
          return errorJson("Group does not belong to brand", 403);
        }
        return json(grp.children);
      },
      POST: async ({ request, params }) => {
        const brand = requireBrandId(request);
        if (brand instanceof Response) return brand;
        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return errorJson("Invalid JSON body", 400);
        }
        const parsed = AttachSchema.safeParse(raw);
        if (!parsed.success) {
          return errorJson(
            `Invalid payload: ${parsed.error.issues
              .map((i) => `${i.path.join(".")}: ${i.message}`)
              .join("; ")}`,
            400,
          );
        }
        const existing = await getGroup(params.id);
        if (!existing) return errorJson(`Group ${params.id} not found`, 404);
        if (Number(existing.brandId) !== Number(brand)) {
          return errorJson("Group does not belong to brand", 403);
        }
        try {
          const dto = await addChildJackpot(
            params.id,
            parsed.data.jackpotId,
            parsed.data.tierRank,
            {
              triggerProbability: parsed.data.triggerProbability,
              contributionRate: parsed.data.contributionRate,
              name: parsed.data.name,
            },
          );
          return json(dto, { status: 201 });
        } catch (e: any) {
          if (e instanceof GroupConflictError) {
            return errorJson(e.message, 409);
          }
          throw e;
        }
      },
    },
  },
});
