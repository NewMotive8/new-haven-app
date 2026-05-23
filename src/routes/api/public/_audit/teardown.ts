/**
 * Audit-suite fixture teardown. Bearer-gated by INTERNAL_SERVICE_SECRET.
 * Deletes all rows scoped to the isolated brandId (999999). The
 * admin_audit_log table has an append-only trigger that BLOCKS DELETE;
 * we surface that fact in the response so the audit suite can verify the
 * trigger fired (GLI-12 immutability requirement).
 */
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  errorJson,
  json,
  preflight,
  requireInternalSecret,
} from "@/lib/jackpot/http";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const TeardownSchema = z.object({
  brandId: z.literal(999999),
});

export const Route = createFileRoute("/api/public/_audit/teardown")({
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
        const parsed = TeardownSchema.safeParse(raw);
        if (!parsed.success) {
          return errorJson("Invalid teardown payload (brandId must be 999999)", 400);
        }
        const { brandId } = parsed.data;

        // Collect jackpot ids for this brand so we can clean pools/seeds.
        const jps = await supabaseAdmin
          .from("jackpots")
          .select("id")
          .eq("brand_id", brandId);
        const jpIds = (jps.data ?? []).map((r: any) => Number(r.id));

        // FK-safe deletion order. jackpot_wins / jackpot_transactions are
        // brand-scoped directly.
        await supabaseAdmin.from("jackpot_wins").delete().in("jackpot_id", jpIds.length ? jpIds : [-1]);
        await supabaseAdmin.from("jackpot_transactions").delete().eq("brand_id", brandId);
        if (jpIds.length) {
          await supabaseAdmin.from("jackpot_pools").delete().in("jackpot_id", jpIds);
          await supabaseAdmin.from("jackpot_seeds").delete().in("jackpot_id", jpIds);
        }

        // Flip groups to draft so child jackpots can be deleted under the
        // jackpots_group_guard rule.
        await supabaseAdmin
          .from("jackpot_groups")
          .update({ status: "draft" })
          .eq("brand_id", brandId);

        const delJp = await supabaseAdmin
          .from("jackpots")
          .delete()
          .eq("brand_id", brandId);
        const delGroup = await supabaseAdmin
          .from("jackpot_groups")
          .delete()
          .eq("brand_id", brandId);

        // Attempt to delete admin_audit_log rows — the append-only trigger
        // MUST raise. We capture and report.
        // Clean up games rows seeded by the audit fixture (identified by id=brandId).
        await supabaseAdmin.from("games").delete().eq("id", brandId);

        // Attempt to delete admin_audit_log rows — the append-only trigger
        // MUST raise. We capture and report.
        const auditDel = await supabaseAdmin
          .from("admin_audit_log")
          .delete()
          .eq("brand_id", brandId);
        const auditDeleteBlocked = !!auditDel.error;

        return json({
          ok: true,
          jackpotsDeleted: !delJp.error,
          groupsDeleted: !delGroup.error,
          auditDeleteBlocked,
          auditDeleteError: auditDel.error?.message ?? null,
          jackpotIdsRemoved: jpIds,
        });
      },
    },
  },
});
