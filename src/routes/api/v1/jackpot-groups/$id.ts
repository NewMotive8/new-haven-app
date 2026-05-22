import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  errorJson,
  json,
  preflight,
  requireBrandId,
  requireInternalSecret,
} from "@/lib/jackpot/http";
import {
  getGroup,
  updateGroupProfile,
  GroupConflictError,
} from "@/lib/jackpot/store.server";

const PatchSchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    overlappingRule: z.enum(["split", "additive"]).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "At least one field is required",
  });

export const Route = createFileRoute("/api/v1/jackpot-groups/$id")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async ({ request, params }) => {
        const blocked = requireInternalSecret(request);
        if (blocked) return blocked;
        const brand = requireBrandId(request);
        if (brand instanceof Response) return brand;
        const grp = await getGroup(params.id);
        if (!grp) return errorJson(`Group ${params.id} not found`, 404);
        if (Number(grp.brandId) !== Number(brand)) {
          return errorJson("Group does not belong to brand", 403);
        }
        return json(grp);
      },
      PATCH: async ({ request, params }) => {
        const blocked = requireInternalSecret(request);
        if (blocked) return blocked;
        const brand = requireBrandId(request);
        if (brand instanceof Response) return brand;
        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return errorJson("Invalid JSON body", 400);
        }
        const parsed = PatchSchema.safeParse(raw);
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
          const updated = await updateGroupProfile(params.id, parsed.data);
          if (!updated) return errorJson(`Group ${params.id} not found`, 404);
          return json(updated);
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
