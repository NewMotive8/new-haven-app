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

        // 1. Ensure a games row exists for this operator_game_id. The
        //    resolveGroupForBet helper maps operator_game_id → games.id and
        //    then looks for a group whose assigned_game_ids contains it.
        const existingGame = await supabaseAdmin
          .from("games")
          .select("id")
          .eq("operator_game_id", gameId)
          .maybeSingle();

        let gameNumericId: number;
        if (existingGame.data) {
          gameNumericId = Number((existingGame.data as any).id);
          await supabaseAdmin.from("games").update({ enabled: true }).eq("id", gameNumericId);
        } else {
          // Use brandId as the deterministic game id to keep isolation simple.
          gameNumericId = brandId;
          const insGame = await supabaseAdmin
            .from("games")
            .insert({
              id: gameNumericId,
              name: `__audit__-game-${brandId}`,
              master_category: "slots",
              provider: "audit",
              operator_game_id: gameId,
              enabled: true,
            })
            .select("id")
            .single();
          if (insGame.error || !insGame.data) {
            return errorJson(
              `Game insert failed: ${insGame.error?.message ?? "unknown"}`,
              500,
            );
          }
          gameNumericId = Number((insGame.data as any).id);
        }

        // 2. Look up or create the group (idempotent on name).
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
          // Force to draft so we can edit children.
          await supabaseAdmin
            .from("jackpot_groups")
            .update({ status: "draft" })
            .eq("id", groupId);
        } else {
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
              assigned_categories: [],
              assigned_game_ids: [gameNumericId],
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
        }

        // 3. Ensure a child jackpot exists.
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
              assigned_game_ids: [gameNumericId],
              assigned_categories: [],
            })
            .select("id")
            .single();
          if (insJp.error || !insJp.data) {
            return errorJson(
              `Jackpot insert failed: ${insJp.error?.message ?? "unknown"}`,
              500,
            );
          }
          jackpotId = Number(insJp.data.id);
        }

        // 4. Ensure pool + seed rows exist.
        await supabaseAdmin
          .from("jackpot_pools")
          .upsert({ jackpot_id: jackpotId, current_balance: 0 }, { onConflict: "jackpot_id" });
        await supabaseAdmin
          .from("jackpot_seeds")
          .upsert({ jackpot_id: jackpotId, base_seed_amount: 0 }, { onConflict: "jackpot_id" });

        // 5. Activate the group with the gameId mapped.
        const reAct = await supabaseAdmin
          .from("jackpot_groups")
          .update({
            status: "active",
            assigned_game_ids: [gameNumericId],
            assigned_categories: [],
          })
          .eq("id", groupId);
        if (reAct.error) {
          return errorJson(`Group re-activation failed: ${reAct.error.message}`, 500);
        }

        return json({ groupId, jackpotId, gameId, gameNumericId });

        return json({ groupId, jackpotId, gameId });
      },
    },
  },
});

void CORS_HEADERS;
