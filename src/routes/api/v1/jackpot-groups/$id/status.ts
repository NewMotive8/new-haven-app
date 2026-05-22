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
  setGroupStatus,
  GroupConflictError,
} from "@/lib/jackpot/store.server";

const StatusSchema = z.object({
  status: z.enum(["draft", "active", "disabled"]),
});

export const Route = createFileRoute("/api/v1/jackpot-groups/$id/status")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      POST: async ({ request, params }) => {
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
        const parsed = StatusSchema.safeParse(raw);
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
          const updated = await setGroupStatus(params.id, parsed.data.status);
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
