/**
 * Audit-suite fixture seeder. Bearer-gated by INTERNAL_SERVICE_SECRET so it
 * cannot be hit publicly. Lives under /api/public/_audit/ purely so it
 * bypasses Lovable's published-site page-auth — the bearer is the real gate.
 *
 * Creates an isolated jackpot group + child jackpot + pool/seed rows scoped
 * to the supplied brandId (must be 999999 per the audit plan) and gameId.
 * Idempotent: if the fixture already exists, it returns the same ids.
 */
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  CORS_HEADERS,
  errorJson,
  json,
  preflight,
  requireInternalSecret,
} from "@/lib/jackpot/http";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const SeedSchema = z.object({
  brandId: z.literal(999999),
  gameId: z.string().min(1).max(128),
});

export const Route = createFileRoute("/api/public/_audit/seed")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      POST: async ({ request }) => {
        const blocked = requireInternalSecret(request);
        if (blocked) return blocked;

        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return errorJson("Invalid JSON body", 400);
        }
        const parsed = SeedSchema.safeParse(raw);
        if (!parsed.success) {
          return errorJson(
            `Invalid seed payload: ${parsed.error.issues
              .map((i) => `${i.path.join(".")}: ${i.message}`)
              .join("; ")}`,
            400,
          );
        }
        const { brandId, gameId } = parsed.data;

        // Look up or create the group (idempotent on name).
        const groupName = `__audit__-${brandId}`;
        const existingGroup = await supabaseAdmin
          .from("jackpot_groups")
          .select("id, status")
          .eq("brand_id", brandId)
          .eq("name", groupName)
          .maybeSingle();
        if (existingGroup.error) {
          return errorJson(`Group lookup failed: ${existingGroup.error.message}`, 500);
        }

        let groupId: number;
        if (existingGroup.data) {
          groupId = Number(existingGroup.data.id);
          // Ensure it's active and has the right gameId mapped.
          const upd = await supabaseAdmin
            .from("jackpot_groups")
            .update({
              status: "active",
              assigned_game_ids: [],
              assigned_categories: [gameId],
            })
            .eq("id", groupId);
          if (upd.error) {
            return errorJson(`Group update failed: ${upd.error.message}`, 500);
          }
        } else {
          // Insert as draft, then flip to active (status guard enforces the
          // draft → active transition).
          const ins = await supabaseAdmin
            .from("jackpot_groups")
            .insert({
              brand_id: brandId,
              name: groupName,
              status: "draft",
              overlapping_rule: "split",
              contribution_source: "player",
              contribution_type: "percentage",
              master_contribution_value: 0.01,
              assigned_categories: [gameId],
              assigned_game_ids: [],
            })
            .select("id")
            .single();
          if (ins.error || !ins.data) {
            return errorJson(
              `Group insert failed: ${ins.error?.message ?? "unknown"}`,
              500,
            );
          }
          groupId = Number(ins.data.id);
          const act = await supabaseAdmin
            .from("jackpot_groups")
            .update({ status: "active" })
            .eq("id", groupId);
          if (act.error) {
            return errorJson(`Group activation failed: ${act.error.message}`, 500);
          }
        }

        // Group must be DRAFT to modify children (jackpots_group_guard). Flip
        // back to draft, ensure jackpot exists, then re-activate.
        await supabaseAdmin
          .from("jackpot_groups")
          .update({ status: "draft" })
          .eq("id", groupId);

        const jpName = `__audit__-jackpot-${brandId}`;
        const existingJp = await supabaseAdmin
          .from("jackpots")
          .select("id")
          .eq("brand_id", brandId)
          .eq("name", jpName)
          .maybeSingle();

        let jackpotId: number;
        if (existingJp.data) {
          jackpotId = Number(existingJp.data.id);
        } else {
          const insJp = await supabaseAdmin
            .from("jackpots")
            .insert({
              brand_id: brandId,
              group_id: groupId,
              name: jpName,
              enabled: true,
              volatility: 1,
              contribution_percentage: 1,
              trigger_probability: 0.001,
              split_share: 1,
              tier_rank: 1,
              trigger_condition: {},
              assigned_game_ids: [],
              assigned_categories: [gameId],
            })
            .select("id")
            .single();
          if (insJp.error || !insJp.data) {
            await supabaseAdmin
              .from("jackpot_groups")
              .update({ status: "active" })
              .eq("id", groupId);
            return errorJson(
              `Jackpot insert failed: ${insJp.error?.message ?? "unknown"}`,
              500,
            );
          }
          jackpotId = Number(insJp.data.id);
        }

        // Ensure pool + seed rows exist.
        await supabaseAdmin
          .from("jackpot_pools")
          .upsert({ jackpot_id: jackpotId, current_balance: 0 }, { onConflict: "jackpot_id" });
        await supabaseAdmin
          .from("jackpot_seeds")
          .upsert({ jackpot_id: jackpotId, base_seed_amount: 0 }, { onConflict: "jackpot_id" });

        // Re-activate the group with the gameId mapped (category-based routing).
        const reAct = await supabaseAdmin
          .from("jackpot_groups")
          .update({
            status: "active",
            assigned_categories: [gameId],
          })
          .eq("id", groupId);
        if (reAct.error) {
          return errorJson(`Group re-activation failed: ${reAct.error.message}`, 500);
        }

        return json({ groupId, jackpotId, gameId });
      },
    },
  },
});

void CORS_HEADERS;
