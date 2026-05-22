import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  errorJson,
  json,
  preflight,
  requireBrandId,
} from "@/lib/jackpot/http";
import { createGroup, listGroups } from "@/lib/jackpot/store.server";

const CreateGroupSchema = z.object({
  name: z.string().min(1).max(255),
  overlappingRule: z.enum(["split", "additive"]).optional(),
  contributionSource: z.enum(["player", "operator"]).optional(),
  contributionType: z.enum(["percentage", "fixed"]).optional(),
  masterContributionValue: z.number().min(0).max(1_000_000).optional(),
});

export const Route = createFileRoute("/api/v1/jackpot-groups/")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async ({ request }) => {
        const brand = requireBrandId(request);
        if (brand instanceof Response) return brand;
        return json(await listGroups(brand));
      },
      POST: async ({ request }) => {
        const brand = requireBrandId(request);
        if (brand instanceof Response) return brand;
        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return errorJson("Invalid JSON body", 400);
        }
        const parsed = CreateGroupSchema.safeParse(raw);
        if (!parsed.success) {
          return errorJson(
            `Invalid payload: ${parsed.error.issues
              .map((i) => `${i.path.join(".")}: ${i.message}`)
              .join("; ")}`,
            400,
          );
        }
        const grp = await createGroup(brand, parsed.data);
        return json(grp, { status: 201 });
      },
    },
  },
});
