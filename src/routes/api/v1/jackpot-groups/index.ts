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
  assignedCategories: z
    .array(z.enum(["Slots", "Table Games", "Live Casino", "Crash Games", "Sports"]))
    .max(5)
    .optional(),
  assignedGameIds: z.array(z.number().int().positive()).max(1000).optional(),
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
        try {
          const grp = await createGroup(brand, parsed.data);
          return json(grp, { status: 201 });
        } catch (err: unknown) {
          const e = err as { code?: string; message?: string };
          const msg = e?.message ?? "";
          if (e?.code === "23505" || msg.includes("jackpot_groups_brand_name_uniq")) {
            return errorJson(
              `A MultiJackpot named "${parsed.data.name}" already exists for this brand. Pick a different name.`,
              409,
            );
          }
          throw err;
        }
      },
    },
  },
});
