/**
 * Live real-money bet event route.
 *
 * Distinct from the simulator loops: this endpoint accepts a single accepted
 * wager, resolves the three-way Pool / Seed / House split via the production
 * ledger helper, and returns the breakdown so third-party wallets can debit
 * the operator rake (House slice) in lock-step with pool/seed credits.
 */
import { createFileRoute } from "@tanstack/react-router";
import { errorJson, json, preflight, requireBrandId } from "@/lib/jackpot/http";
import { getJackpot } from "@/lib/jackpot/store.server";
import { computeBetLedger } from "@/lib/jackpot/ledger";
import type { JackpotConfigDTO, JackpotDTO } from "@/lib/jackpot/types";

function inlineConfigFromDto(jp: JackpotDTO): JackpotConfigDTO {
  // Read v2 split + tier metadata back out of the persisted trigger_condition
  // so the ledger sees the exact contract the operator saved.
  const cfg = (jp.config ?? {}) as Record<string, unknown>;
  const v2 = (cfg.engineV2 ?? {}) as Record<string, unknown>;
  const tiers = (cfg.tiers as JackpotConfigDTO["tiers"]) ?? undefined;

  return {
    id: jp.id,
    name: jp.name,
    enabled: jp.enabled,
    brandId: jp.brandId,
    type: "AVERAGE",
    structuralType: tiers && tiers.length > 0 ? "MULTI_LEVEL" : "CLASSIC",
    volatility: jp.volatility ?? 1,
    pool: {
      currentAmount: jp.poolBalance,
      minimumAmount: jp.seedAmount,
      maximumAmount: jp.triggerThreshold,
      contributionAmount: jp.contributionRate * 100,
      contributionType: "PERCENTAGE",
    },
    seed: {
      currentAmount: jp.seedAmount,
      targetAmount: jp.seedAmount,
      contributionAmount: 0,
      contributionType: "FIXED",
    },
    tiers,
    contribution:
      v2.contributionMode === "split"
        ? {
            mode: "split",
            totalContributionAmount: Number(v2.totalContributionAmount) || 0,
            totalContributionType: (v2.totalContributionType as "FIXED" | "PERCENTAGE") ?? "FIXED",
            poolWeight: Number(v2.poolWeight) || 0,
            seedWeight: Number(v2.seedWeight) || 0,
            houseWeight: Number(v2.houseWeight) || 0,
          }
        : undefined,
  };
}

export const Route = createFileRoute("/api/v1/event/bet")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      POST: async ({ request }) => {
        const brand = requireBrandId(request);
        if (brand instanceof Response) return brand;

        let body: { jackpotId?: number; wager?: number; config?: JackpotConfigDTO; playerId?: string; eventId?: string };
        try {
          body = (await request.json()) as typeof body;
        } catch {
          return errorJson("Invalid JSON body", 400);
        }

        const wager = Number(body.wager) || 0;
        if (wager <= 0) return errorJson("wager must be a positive number", 400);

        let cfg: JackpotConfigDTO | undefined = body.config;
        if (!cfg && body.jackpotId != null) {
          const jp = await getJackpot(brand, Number(body.jackpotId));
          if (!jp) return errorJson(`Jackpot ${body.jackpotId} not found`, 404);
          cfg = inlineConfigFromDto(jp);
        }
        if (!cfg) return errorJson("Body must include `config` or `jackpotId`", 400);

        const ledger = computeBetLedger(cfg, wager);

        return json({
          brandId: brand,
          jackpotId: cfg.id,
          eventId: body.eventId ?? null,
          playerId: body.playerId ?? null,
          processedAt: new Date().toISOString(),
          wager,
          contribution: ledger.totals,
          house: ledger.totals.house,
          totalContribution: ledger.totalContribution,
          tierBreakdown: ledger.entries,
        });
      },
    },
  },
});
