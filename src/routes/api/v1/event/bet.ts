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
import { getJackpot, listJackpots } from "@/lib/jackpot/store.server";
import { computeBetLedger, computeMultiCampaignLedger } from "@/lib/jackpot/ledger";
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
            overlappingRule: (v2.overlappingRule as "split" | "additive") ?? "split",
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

        let body: {
          jackpotId?: number;
          wager?: number;
          config?: JackpotConfigDTO;
          configs?: JackpotConfigDTO[];
          playerId?: string;
          eventId?: string;
        };
        try {
          body = (await request.json()) as typeof body;
        } catch {
          return errorJson("Invalid JSON body", 400);
        }

        const wager = Number(body.wager) || 0;
        if (wager <= 0) return errorJson("wager must be a positive number", 400);

        // -----------------------------------------------------------------
        // Legacy single-jackpot path (back-compat).
        // -----------------------------------------------------------------
        if (body.config || body.jackpotId != null) {
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
        }

        // -----------------------------------------------------------------
        // Multi-campaign router. Matches every enabled jackpot for the brand
        // and routes each one through split / additive math per spec.
        // -----------------------------------------------------------------
        let configs: JackpotConfigDTO[];
        if (Array.isArray(body.configs) && body.configs.length > 0) {
          configs = body.configs;
        } else {
          const all = await listJackpots(brand);
          configs = all.filter((j) => j.enabled).map(inlineConfigFromDto);
        }

        if (configs.length === 0) {
          return json({
            brandId: brand,
            eventId: body.eventId ?? null,
            playerId: body.playerId ?? null,
            processedAt: new Date().toISOString(),
            wager,
            matched: 0,
            splitDenominator: 0,
            contribution: { pool: 0, seed: 0, house: 0 },
            house: 0,
            totalContribution: 0,
            perJackpot: [],
          });
        }

        const multi = computeMultiCampaignLedger(configs, wager);
        return json({
          brandId: brand,
          eventId: body.eventId ?? null,
          playerId: body.playerId ?? null,
          processedAt: new Date().toISOString(),
          wager,
          matched: multi.perCampaign.length,
          splitDenominator: multi.splitDenominator,
          contribution: multi.totals,
          house: multi.totals.house,
          totalContribution: multi.totalContribution,
          perJackpot: multi.perCampaign.map((e) => ({
            jackpotId: e.jackpotId,
            jackpotName: e.jackpotName,
            routing: e.routing,
            splitDenominator: e.splitDenominator,
            contribution: e.ledger.totals,
            house: e.ledger.totals.house,
            totalContribution: e.ledger.totalContribution,
            tierBreakdown: e.ledger.entries,
          })),
        });
      },
    },
  },
});
