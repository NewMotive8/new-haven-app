/**
 * Live real-money bet event route — Phase 1 S2S microservice contract.
 *
 * Accepts a fully structured server-to-server transaction payload, applies
 * an in-memory idempotency (deduplication) filter keyed by `transactionId`,
 * and ALWAYS evaluates jackpot win triggers using a server-side
 * cryptographically secure RNG (Web Crypto). Client-supplied RNG overrides
 * are forbidden (GLI-12 compliance). When a campaign has community payout
 * enabled, the win branch routes through `applyCommunityPayout`.
 */
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  errorJson,
  json,
  preflight,
  requireBrandId,
  requireInternalSecret,
  verifyOperatorSignature,
} from "@/lib/jackpot/http";
import {
  getJackpot,
  listJackpots,
  getGroupForBet,
  recordGroupTransaction,
  findExistingTransaction,
  resolveGroupForBet,
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

// ---------------------------------------------------------------------------
// Open-ended `attributes` metadata bag — verticals-agnostic (sportsbook,
// casino, channel/device context). Persisted as JSONB into
// public.jackpot_transactions.attributes; never influences math.
// ---------------------------------------------------------------------------
const ATTRIBUTES_MAX_BYTES = 8 * 1024;
const ATTRIBUTES_MAX_DEPTH = 6;
const ATTRIBUTES_MAX_KEYS = 200;
const ATTRIBUTES_MAX_ARRAY = 100;
const ATTRIBUTES_MAX_STRING = 1024;
const ATTRIBUTES_KEY_RE = /^[A-Za-z0-9_.:-]{1,64}$/;

type AttrIssue = { path: (string | number)[]; message: string };

function walkAttributes(
  node: unknown,
  path: (string | number)[],
  depth: number,
  counters: { keys: number },
  issues: AttrIssue[],
): void {
  if (depth > ATTRIBUTES_MAX_DEPTH) {
    issues.push({ path, message: `exceeds max depth ${ATTRIBUTES_MAX_DEPTH}` });
    return;
  }
  if (node === null) return;
  if (Array.isArray(node)) {
    if (node.length > ATTRIBUTES_MAX_ARRAY) {
      issues.push({
        path,
        message: `array length ${node.length} exceeds max ${ATTRIBUTES_MAX_ARRAY}`,
      });
      return;
    }
    node.forEach((v, i) => walkAttributes(v, [...path, i], depth + 1, counters, issues));
    return;
  }
  const t = typeof node;
  if (t === "string") {
    if ((node as string).length > ATTRIBUTES_MAX_STRING) {
      issues.push({ path, message: `string exceeds ${ATTRIBUTES_MAX_STRING} chars` });
    }
    return;
  }
  if (t === "number") {
    if (!Number.isFinite(node)) issues.push({ path, message: "non-finite number" });
    return;
  }
  if (t === "boolean") return;
  if (t === "object") {
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      counters.keys += 1;
      if (counters.keys > ATTRIBUTES_MAX_KEYS) {
        issues.push({ path, message: `exceeds max ${ATTRIBUTES_MAX_KEYS} keys` });
        return;
      }
      if (!ATTRIBUTES_KEY_RE.test(k)) {
        issues.push({ path: [...path, k], message: "invalid key (must match [A-Za-z0-9_.:-]{1,64})" });
        continue;
      }
      walkAttributes(v, [...path, k], depth + 1, counters, issues);
    }
    return;
  }
  issues.push({ path, message: `unsupported value type: ${t}` });
}

const zJsonAttributes = z
  .unknown()
  .superRefine((val, ctx) => {
    if (val === null || typeof val !== "object" || Array.isArray(val)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "attributes must be a plain JSON object",
      });
      return;
    }
    let serialized: string;
    try {
      serialized = JSON.stringify(val);
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "attributes not JSON-serializable" });
      return;
    }
    if (serialized.length > ATTRIBUTES_MAX_BYTES) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `attributes serialized size ${serialized.length}B exceeds ${ATTRIBUTES_MAX_BYTES}B`,
      });
      return;
    }
    const issues: AttrIssue[] = [];
    walkAttributes(val, [], 0, { keys: 0 }, issues);
    for (const i of issues) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: i.path,
        message: i.message,
      });
    }
  })
  .transform((v) => v as Record<string, unknown>);

const BetEventSchema = z
  .object({
    transactionId: z.string().min(1).max(128),
    // B2B canonical fields (preferred)
    wagerAmount: z.number().positive().finite().optional(),
    currency: z
      .string()
      .regex(/^[A-Za-z0-9_-]{2,16}$/, "currency must be 2–16 ISO/token chars")
      .optional(),
    timestamp: z.string().datetime({ offset: true }).optional(),
    // Legacy aliases (back-compat with sandbox / simulator)
    wager: z.number().positive().finite().optional(),
    gameId: z.string().min(1).max(128),
    playerSegments: z.array(z.string().min(1).max(64)).max(64).default([]),
    // Open-ended vertical/channel metadata (sportsbook, casino, device, etc.).
    // Persisted verbatim; never affects jackpot math or routing.
    attributes: zJsonAttributes.optional(),
    // systemRngValue removed (GLI-12): server-side crypto RNG is the
    // single source of truth for win-trigger evaluation. Client overrides
    // are no longer accepted.
    // Optional back-compat / routing hints (mutually exclusive)
    jackpotId: z.number().int().optional(),
    groupId: z.number().int().positive().optional(),
    playerId: z.string().max(128).optional(),
    eventId: z.string().max(128).optional(),
    config: z.any().optional(),
    configs: z.array(z.any()).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.wagerAmount == null && val.wager == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["wagerAmount"],
        message: "wagerAmount (or legacy 'wager') is required",
      });
    }
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
  attributes: Record<string, unknown> | null;
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

  return {
    id: jp.id,
    name: jp.name,
    enabled: jp.enabled,
    brandId: jp.brandId,
    type: "AVERAGE",
    structuralType: "CLASSIC",
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
        // ---- Vault door: dual-layer authentication ----------------------
        const blocked = requireInternalSecret(request);
        if (blocked) return blocked;

        const brand = requireBrandId(request);
        if (brand instanceof Response) return brand;

        // Read raw body once — HMAC verification needs the exact bytes
        // before any JSON parsing/normalization.
        let rawBody: string;
        try {
          rawBody = await request.text();
        } catch {
          return errorJson("Unable to read request body", 400);
        }

        const sigBlocked = await verifyOperatorSignature(request, rawBody, brand);
        if (sigBlocked) return sigBlocked;

        let raw: unknown;
        try {
          raw = JSON.parse(rawBody);
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
        // Normalize wager (B2B prefers `wagerAmount`, legacy callers use `wager`).
        const wager: number = (body.wagerAmount ?? body.wager) as number;

        // -----------------------------------------------------------------
        // Idempotency filter — fast in-memory cache + authoritative DB check
        // -----------------------------------------------------------------
        const cached = processedTransactions.get(body.transactionId);
        if (cached) {
          return json(
            {
              ...(cached.response as Record<string, unknown>),
              status: "duplicate_ignored",
              idempotentReplay: true,
            },
            { headers: { "X-Idempotent-Replay": "true" } },
          );
        }
        try {
          const existing = await findExistingTransaction(brand, body.transactionId);
          if (existing) {
            rememberTransaction(body.transactionId, existing.response);
            return json(
              {
                ...existing.response,
                status: "duplicate_ignored",
                idempotentReplay: true,
              },
              { headers: { "X-Idempotent-Replay": "true" } },
            );
          }
        } catch (e: any) {
          // Idempotency lookup failure is non-fatal — fall through to write
          // path; the DB unique constraint will still catch duplicates.
          console.warn("[bet] idempotency pre-check failed:", e?.message ?? e);
        }

        // -----------------------------------------------------------------
        // Routing target resolution — explicit groupId/jackpotId, or
        // dynamic lookup of an active group mapped to this gameId.
        // -----------------------------------------------------------------
        if (
          body.groupId == null &&
          body.jackpotId == null &&
          body.config == null &&
          !(Array.isArray(body.configs) && body.configs.length > 0)
        ) {
          try {
            const resolved = await resolveGroupForBet(brand, {
              gameId: body.gameId,
            });
            if (!resolved) {
              return errorJson(
                `NO_ACTIVE_GROUP_FOR_GAME: no active jackpot group routes gameId=${body.gameId} for brand=${brand}`,
                404,
              );
            }
            body.groupId = resolved.groupId;
          } catch (e: any) {
            return errorJson(
              `Routing resolution failed: ${e?.message ?? String(e)}`,
              500,
            );
          }
        }

        // GLI-12: secure server-side RNG only. `rngSource` retained as a
        // constant for back-compat with downstream audit consumers.
        const rngSource: "local" = "local";
        const rng: () => number = secureRandomFloat;


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
          status: "ok" as const,
          currency: body.currency ?? null,
          operatorTimestamp: body.timestamp ?? null,
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
          status: "ok" as const,
          currency: body.currency ?? null,
          operatorTimestamp: body.timestamp ?? null,
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

          // Atomic DB write — pool deltas + win settlement + transaction row
          // committed together inside `apply_group_bet` (SELECT ... FOR UPDATE
          // row-lock + clamp + decrement + ledger insert).
          const poolDeltas = perJackpot.map((e) => ({
            jackpotId: e.jackpotId,
            delta: e.contribution.pool,
          }));
          const winJackpotId =
            win && typeof win.jackpotId === "number" ? win.jackpotId : null;
          const winAmountRequested =
            win && typeof win.amount === "number" ? win.amount : 0;
          let isReplay = false;
          try {
            const rec = await recordGroupTransaction({
              transactionId: body.transactionId,
              brandId: Number(brand),
              groupId: group.id,
              totals,
              response,
              poolDeltas,
              winJackpotId,
              winAmount: winAmountRequested,
              playerId: body.playerId ?? null,
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
            // GLI-12: trust the DB-clamped payout as the authoritative
            // win amount in the HTTP response (the pool may have been
            // smaller than the requested winAmount).
            if (win && rec.win && typeof rec.win.amount !== "undefined") {
              const settledAmount = Number(rec.win.amount) || 0;
              win.amount = settledAmount;
              (response as Record<string, unknown>).win = win;
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
          status: "ok" as const,
          currency: body.currency ?? null,
          operatorTimestamp: body.timestamp ?? null,
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
          status: "ok" as const,
          currency: body.currency ?? null,
          operatorTimestamp: body.timestamp ?? null,
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
          status: "ok" as const,
          currency: body.currency ?? null,
          operatorTimestamp: body.timestamp ?? null,

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
