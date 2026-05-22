/**
 * Live real-money bet event route — Phase 1 S2S microservice contract.
 *
 * Accepts a fully structured server-to-server transaction payload, applies
 * an in-memory idempotency (deduplication) filter keyed by `transactionId`,
 * and optionally consumes a caller-supplied certified RNG float
 * (`systemRngValue`) instead of the local PRNG when evaluating jackpot
 * win triggers. When a campaign has community payout enabled, the win
 * branch routes through the existing `applyCommunityPayout` helper.
 */
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { errorJson, json, preflight, requireBrandId, requireInternalSecret } from "@/lib/jackpot/http";
import {
  getJackpot,
  listJackpots,
  getGroupForBet,
  recordGroupTransaction,
  GroupConflictError,
} from "@/lib/jackpot/store.server";
import {
  applyCommunityPayout,
  computeBetLedger,
  computeMultiCampaignLedger,
} from "@/lib/jackpot/ledger";
import type { JackpotConfigDTO, JackpotDTO } from "@/lib/jackpot/types";

// ---------------------------------------------------------------------------
// Request schema
// ---------------------------------------------------------------------------

const BetEventSchema = z
  .object({
    transactionId: z.string().min(1).max(128),
    wager: z.number().positive().finite(),
    gameId: z.string().min(1).max(128),
    playerSegments: z.array(z.string().min(1).max(64)).max(64).default([]),
    systemRngValue: z.number().min(0).max(1).optional(),
    // Optional back-compat / routing hints (mutually exclusive)
    jackpotId: z.number().int().optional(),
    groupId: z.number().int().positive().optional(),
    playerId: z.string().max(128).optional(),
    eventId: z.string().max(128).optional(),
    config: z.any().optional(),
    configs: z.array(z.any()).optional(),
  })
  .superRefine((val, ctx) => {
    const routes = [
      val.groupId != null,
      val.jackpotId != null,
      val.config != null,
      Array.isArray(val.configs) && val.configs.length > 0,
    ].filter(Boolean).length;
    if (routes > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "ROUTING_CONFLICT: provide at most one of groupId, jackpotId, config, configs.",
      });
    }
  });

type BetEventBody = z.infer<typeof BetEventSchema>;

// ---------------------------------------------------------------------------
// In-memory idempotency cache (per-Worker-instance; sufficient for sandbox /
// S2S verification, not a cluster-wide guarantee).
// ---------------------------------------------------------------------------

const DEDUPE_MAX = 1000;
const processedTransactions = new Map<string, { at: number; response: unknown }>();

function rememberTransaction(id: string, response: unknown) {
  processedTransactions.set(id, { at: Date.now(), response });
  while (processedTransactions.size > DEDUPE_MAX) {
    const oldest = processedTransactions.keys().next().value;
    if (oldest === undefined) break;
    processedTransactions.delete(oldest);
  }
}

// ---------------------------------------------------------------------------
// Phase 3 — Append-only audit ledger (in-memory, capped, per-Worker instance).
// Only successful, non-replay bet transactions append a slice. The buffer is
// exported so the sibling `bet.ledger.ts` read endpoint can expose it to the
// sandbox compliance grid.
// ---------------------------------------------------------------------------

export const AUDIT_MAX = 200;

export type AuditSlice = { pool: number; seed: number; house: number };

export type AuditEntry = {
  loggedAt: string;
  transactionId: string;
  brandId: string;
  gameId: string;
  playerSegments: string[];
  playerId: string | null;
  wager: number;
  rngSource: "external" | "local";
  contribution: AuditSlice;
  totalContribution: number;
  perJackpot:
    | Array<{
        jackpotId: number;
        jackpotName: string;
        routing: "split" | "additive";
        contribution: AuditSlice;
        totalContribution: number;
      }>
    | null;
  win: Record<string, unknown> | null;
};

export const jackpot_ledger_logs: AuditEntry[] = [];

function appendAudit(entry: AuditEntry) {
  jackpot_ledger_logs.push(entry);
  if (jackpot_ledger_logs.length > AUDIT_MAX) {
    jackpot_ledger_logs.splice(0, jackpot_ledger_logs.length - AUDIT_MAX);
  }
}

// ---------------------------------------------------------------------------

function inlineConfigFromDto(jp: JackpotDTO): JackpotConfigDTO {
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
            totalContributionType:
              (v2.totalContributionType as "FIXED" | "PERCENTAGE") ?? "FIXED",
            poolWeight: Number(v2.poolWeight) || 0,
            seedWeight: Number(v2.seedWeight) || 0,
            houseWeight: Number(v2.houseWeight) || 0,
            overlappingRule:
              (v2.overlappingRule as "split" | "additive") ?? "split",
          }
        : undefined,
  };
}

// Read trigger odds (probability per spin) out of the persisted config blob.
// Falls back to contributionRate as a coarse heuristic so the win branch is
// always exercisable in the sandbox.
function readTriggerProbability(jp: JackpotDTO): number {
  const cfg = (jp.config ?? {}) as Record<string, unknown>;
  const odds = Number(cfg.triggerOdds);
  if (Number.isFinite(odds) && odds > 0) return 1 / odds;
  const rate = Number(jp.contributionRate);
  if (Number.isFinite(rate) && rate > 0) return Math.min(rate, 0.05);
  return 0.001;
}

function readCommunityConfig(jp: JackpotDTO) {
  const cfg = (jp.config ?? {}) as Record<string, unknown>;
  const c = cfg.community as
    | {
        enabled?: boolean;
        split?: number;
        maximumWinAmount?: number;
        maximumNumberOfPlayers?: number;
      }
    | undefined;
  if (!c || !c.enabled) return null;
  return {
    split: Number(c.split) || 0,
    maximumWinAmount: Number(c.maximumWinAmount) || 0,
    maximumNumberOfPlayers: Number(c.maximumNumberOfPlayers) || 1,
  };
}

// GLI-12/19 compliant secure RNG fallback using Web Crypto API.
const secureRandomFloat = () => crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;

export const Route = createFileRoute("/api/v1/event/bet")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      POST: async ({ request }) => {
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

        const parsed = BetEventSchema.safeParse(raw);
        if (!parsed.success) {
          return errorJson(
            `Invalid bet event payload: ${parsed.error.issues
              .map((i) => `${i.path.join(".")}: ${i.message}`)
              .join("; ")}`,
            400,
          );
        }
        const body: BetEventBody = parsed.data;

        // -----------------------------------------------------------------
        // Idempotency filter
        // -----------------------------------------------------------------
        const cached = processedTransactions.get(body.transactionId);
        if (cached) {
          return json(
            {
              ...(cached.response as Record<string, unknown>),
              idempotentReplay: true,
            },
            { headers: { "X-Idempotent-Replay": "true" } },
          );
        }

        const wager = body.wager;
        const rngSource: "external" | "local" =
          typeof body.systemRngValue === "number" ? "external" : "local";
        const rng: () => number =
          typeof body.systemRngValue === "number"
            ? () => body.systemRngValue!
            : secureRandomFloat;

        // -----------------------------------------------------------------
        // Phase 2 — relational jackpot-group fan-out branch.
        // -----------------------------------------------------------------
        if (body.groupId != null) {
          let group;
          let children;
          try {
            const res = await getGroupForBet(body.groupId, brand);
            group = res.group;
            children = res.children;
          } catch (e: any) {
            if (e instanceof GroupConflictError) {
              return errorJson(e.message, (e as any).status ?? 409);
            }
            throw e;
          }

          if (children.length === 0) {
            const empty = {
              brandId: brand,
              transactionId: body.transactionId,
              idempotentReplay: false,
              rngSource,
              gameId: body.gameId,
              playerSegments: body.playerSegments,
              eventId: body.eventId ?? null,
              playerId: body.playerId ?? null,
              processedAt: new Date().toISOString(),
              wager,
              groupId: group.id,
              routingMode: "group" as const,
              matched: 0,
              splitDenominator: 0,
              contribution: { pool: 0, seed: 0, house: 0 },
              house: 0,
              totalContribution: 0,
              perJackpot: [],
              win: null as Record<string, unknown> | null,
            };
            rememberTransaction(body.transactionId, empty);
            return json(empty);
          }

          const configs = children.map(inlineConfigFromDto);
          const multi = computeMultiCampaignLedger(configs, wager);

          // Precision: truncate to 6 decimal places (floor) to eliminate
          // binary float drift in the persisted ledger.
          const t6 = (n: number) =>
            Math.trunc((Number(n) || 0) * 1_000_000) / 1_000_000;
          const truncSlice = (s: { pool: number; seed: number; house: number }) => ({
            pool: t6(s.pool),
            seed: t6(s.seed),
            house: t6(s.house),
          });

          const totals = truncSlice(multi.totals);
          const totalContribution = t6(multi.totalContribution);
          const perJackpot = multi.perCampaign.map((e) => ({
            jackpotId: e.jackpotId,
            jackpotName: e.jackpotName,
            routing: e.routing,
            splitDenominator: e.splitDenominator,
            contribution: truncSlice(e.ledger.totals),
            house: t6(e.ledger.totals.house),
            totalContribution: t6(e.ledger.totalContribution),
            tierBreakdown: e.ledger.entries,
          }));

          // Hierarchical win evaluation: highest tier_rank → lowest.
          let win: Record<string, unknown> | null = null;
          const ranked = [...children].sort(
            (a, b) => (b.tierRank ?? 0) - (a.tierRank ?? 0),
          );
          for (const child of ranked) {
            const p =
              child.triggerProbability > 0
                ? child.triggerProbability
                : readTriggerProbability(child);
            if (rng() < p) {
              const winAmount = Number(child.poolBalance) || 0;
              const community = readCommunityConfig(child);
              if (community && community.split > 0) {
                const breakdown = applyCommunityPayout(winAmount, community, rng);
                win = {
                  jackpotId: child.id,
                  tierRank: child.tierRank,
                  amount: winAmount,
                  isCommunity: true,
                  communitySize: breakdown.communitySize,
                  communityMemberPayOut: breakdown.communityMemberPayOut,
                  triggeringPayout: breakdown.triggeringPayout,
                  communityPool: breakdown.communityPool,
                  cappedDelta: breakdown.cappedDelta,
                };
              } else {
                win = {
                  jackpotId: child.id,
                  tierRank: child.tierRank,
                  amount: winAmount,
                  isCommunity: false,
                };
              }
              break;
            }
          }

          const response = {
            brandId: brand,
            transactionId: body.transactionId,
            idempotentReplay: false,
            rngSource,
            gameId: body.gameId,
            playerSegments: body.playerSegments,
            eventId: body.eventId ?? null,
            playerId: body.playerId ?? null,
            processedAt: new Date().toISOString(),
            wager,
            groupId: group.id,
            routingMode: "group" as const,
            matched: perJackpot.length,
            splitDenominator: multi.splitDenominator,
            contribution: totals,
            house: totals.house,
            totalContribution,
            perJackpot,
            win,
          };

          // Atomic DB write — pool deltas + transaction row in one tx.
          const poolDeltas = perJackpot.map((e) => ({
            jackpotId: e.jackpotId,
            delta: e.contribution.pool,
          }));
          let isReplay = false;
          try {
            const rec = await recordGroupTransaction({
              transactionId: body.transactionId,
              brandId: Number(brand),
              groupId: group.id,
              totals,
              response,
              poolDeltas,
            });
            isReplay = rec.isReplay;
            if (isReplay && rec.row?.response) {
              return json(
                {
                  ...(rec.row.response as Record<string, unknown>),
                  idempotentReplay: true,
                },
                { headers: { "X-Idempotent-Replay": "true" } },
              );
            }
          } catch (e: any) {
            return errorJson(
              `Atomic group bet failed: ${e?.message ?? String(e)}`,
              500,
            );
          }

          appendAudit({
            loggedAt: new Date().toISOString(),
            transactionId: body.transactionId,
            brandId: brand,
            gameId: body.gameId,
            playerSegments: body.playerSegments,
            playerId: body.playerId ?? null,
            wager,
            rngSource,
            contribution: totals,
            totalContribution,
            perJackpot: perJackpot.map((e) => ({
              jackpotId: e.jackpotId,
              jackpotName: e.jackpotName,
              routing: e.routing,
              contribution: e.contribution,
              totalContribution: e.totalContribution,
            })),
            win,
          });
          rememberTransaction(body.transactionId, response);
          return json(response);
        }

        // -----------------------------------------------------------------
        // Legacy single-jackpot path (back-compat, still supported).
        // -----------------------------------------------------------------
        if (body.config || body.jackpotId != null) {
          let cfg: JackpotConfigDTO | undefined = body.config as
            | JackpotConfigDTO
            | undefined;
          let jpDto: JackpotDTO | null = null;
          if (!cfg && body.jackpotId != null) {
            jpDto = (await getJackpot(brand, Number(body.jackpotId))) ?? null;
            if (!jpDto)
              return errorJson(`Jackpot ${body.jackpotId} not found`, 404);
            cfg = inlineConfigFromDto(jpDto);
          }
          if (!cfg) return errorJson("Body must include `config` or `jackpotId`", 400);

          const ledger = computeBetLedger(cfg, wager);

          // Win evaluation against injected RNG.
          let win: Record<string, unknown> | null = null;
          if (jpDto) {
            const p = readTriggerProbability(jpDto);
            if (rng() < p) {
              const winAmount = Number(jpDto.poolBalance) || 0;
              const community = readCommunityConfig(jpDto);
              if (community && community.split > 0) {
                const breakdown = applyCommunityPayout(winAmount, community, rng);
                win = {
                  jackpotId: jpDto.id,
                  amount: winAmount,
                  isCommunity: true,
                  communitySize: breakdown.communitySize,
                  communityMemberPayOut: breakdown.communityMemberPayOut,
                  triggeringPayout: breakdown.triggeringPayout,
                  communityPool: breakdown.communityPool,
                  cappedDelta: breakdown.cappedDelta,
                };
              } else {
                win = { jackpotId: jpDto.id, amount: winAmount, isCommunity: false };
              }
            }
          }

          const response = {
            brandId: brand,
            transactionId: body.transactionId,
            idempotentReplay: false,
            rngSource,
            gameId: body.gameId,
            playerSegments: body.playerSegments,
            jackpotId: cfg.id,
            eventId: body.eventId ?? null,
            playerId: body.playerId ?? null,
            processedAt: new Date().toISOString(),
            wager,
            contribution: ledger.totals,
            house: ledger.totals.house,
            totalContribution: ledger.totalContribution,
            tierBreakdown: ledger.entries,
            win,
          };
          appendAudit({
            loggedAt: new Date().toISOString(),
            transactionId: body.transactionId,
            brandId: brand,
            gameId: body.gameId,
            playerSegments: body.playerSegments,
            playerId: body.playerId ?? null,
            wager,
            rngSource,
            contribution: {
              pool: ledger.totals.pool,
              seed: ledger.totals.seed,
              house: ledger.totals.house,
            },
            totalContribution: ledger.totalContribution,
            perJackpot: null,
            win,
          });
          rememberTransaction(body.transactionId, response);
          return json(response);
        }

        // -----------------------------------------------------------------
        // Multi-campaign router.
        // -----------------------------------------------------------------
        let configs: JackpotConfigDTO[];
        let dtos: JackpotDTO[] = [];
        if (Array.isArray(body.configs) && body.configs.length > 0) {
          configs = body.configs as JackpotConfigDTO[];
        } else {
          const all = await listJackpots(brand);
          dtos = all.filter((j) => j.enabled);
          configs = dtos.map(inlineConfigFromDto);
        }

        if (configs.length === 0) {
          const empty = {
            brandId: brand,
            transactionId: body.transactionId,
            idempotentReplay: false,
            rngSource,
            gameId: body.gameId,
            playerSegments: body.playerSegments,
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
            win: null as Record<string, unknown> | null,
          };
          rememberTransaction(body.transactionId, empty);
          return json(empty);
        }

        const multi = computeMultiCampaignLedger(configs, wager);

        // First-match win evaluation across active DTOs (sandbox-style).
        let win: Record<string, unknown> | null = null;
        for (const jpDto of dtos) {
          const p = readTriggerProbability(jpDto);
          if (rng() < p) {
            const winAmount = Number(jpDto.poolBalance) || 0;
            const community = readCommunityConfig(jpDto);
            if (community && community.split > 0) {
              const breakdown = applyCommunityPayout(winAmount, community, rng);
              win = {
                jackpotId: jpDto.id,
                amount: winAmount,
                isCommunity: true,
                communitySize: breakdown.communitySize,
                communityMemberPayOut: breakdown.communityMemberPayOut,
                triggeringPayout: breakdown.triggeringPayout,
                communityPool: breakdown.communityPool,
                cappedDelta: breakdown.cappedDelta,
              };
            } else {
              win = { jackpotId: jpDto.id, amount: winAmount, isCommunity: false };
            }
            break;
          }
        }

        const response = {
          brandId: brand,
          transactionId: body.transactionId,
          idempotentReplay: false,
          rngSource,
          gameId: body.gameId,
          playerSegments: body.playerSegments,
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
          win,
        };
        appendAudit({
          loggedAt: new Date().toISOString(),
          transactionId: body.transactionId,
          brandId: brand,
          gameId: body.gameId,
          playerSegments: body.playerSegments,
          playerId: body.playerId ?? null,
          wager,
          rngSource,
          contribution: {
            pool: multi.totals.pool,
            seed: multi.totals.seed,
            house: multi.totals.house,
          },
          totalContribution: multi.totalContribution,
          perJackpot: multi.perCampaign.map((e) => ({
            jackpotId: e.jackpotId,
            jackpotName: e.jackpotName,
            routing: e.routing,
            contribution: {
              pool: e.ledger.totals.pool,
              seed: e.ledger.totals.seed,
              house: e.ledger.totals.house,
            },
            totalContribution: e.ledger.totalContribution,
          })),
          win,
        });
        rememberTransaction(body.transactionId, response);
        return json(response);
      },
    },
  },
});
