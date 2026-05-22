/**
 * Production house-ledger helpers.
 *
 * Used by live transaction handlers (real-money bet events) to compute the
 * three-way Pool / Seed / House split on every accepted wager, independent of
 * the simulator engine. Third-party wallets call into these helpers to extract
 * the operator rake (House slice) deterministically per spin.
 */
import type { ContributionSplitDTO, JackpotConfigDTO } from "./types";

export interface ContributionSlice {
  pool: number;
  seed: number;
  house: number;
}

export interface BetLedgerEntry extends ContributionSlice {
  tier?: number;
  label?: string;
}

export interface BetLedger {
  wager: number;
  totalContribution: number;
  totals: ContributionSlice;
  entries: BetLedgerEntry[];
}

function isFixed(type: string | undefined): boolean {
  return String(type ?? "").toUpperCase() === "FIXED";
}

/** Pure, side-effect-free split resolver. Mirrors simulator.resolveContribution. */
export function resolveContributionSlice(
  contribution: ContributionSplitDTO | undefined,
  fallbackPool: { type?: string; amount: number },
  fallbackSeed: { type?: string; amount: number },
  wager: number,
): ContributionSlice {
  if (contribution && contribution.mode === "split") {
    const total = Number(contribution.totalContributionAmount) || 0;
    const totalForCalc = isFixed(contribution.totalContributionType) ? total : wager * (total / 100);
    const pw = Math.max(0, Number(contribution.poolWeight) || 0) / 100;
    const sw = Math.max(0, Number(contribution.seedWeight) || 0) / 100;
    const hw = Math.max(0, Number(contribution.houseWeight) || 0) / 100;
    return { pool: totalForCalc * pw, seed: totalForCalc * sw, house: totalForCalc * hw };
  }
  const pool = isFixed(fallbackPool.type) ? fallbackPool.amount : wager * (fallbackPool.amount / 100);
  const seed = isFixed(fallbackSeed.type) ? fallbackSeed.amount : wager * (fallbackSeed.amount / 100);
  return { pool, seed, house: 0 };
}

/** Compute the full real-money bet ledger for a jackpot config. */
export function computeBetLedger(jp: JackpotConfigDTO, wager: number): BetLedger {
  const w = Number(wager) || 0;
  const entries: BetLedgerEntry[] = [];

  const pushFlat = () => {
    const slice = resolveContributionSlice(
      jp.contribution,
      { type: jp.pool.contributionType, amount: Number(jp.pool.contributionAmount) || 0 },
      { type: jp.seed.contributionType, amount: Number(jp.seed.contributionAmount) || 0 },
      w,
    );
    entries.push({ ...slice });
  };

  pushFlat();

  const totals = entries.reduce<ContributionSlice>(
    (acc, e) => ({ pool: acc.pool + e.pool, seed: acc.seed + e.seed, house: acc.house + e.house }),
    { pool: 0, seed: 0, house: 0 },
  );

  return {
    wager: w,
    totalContribution: totals.pool + totals.seed + totals.house,
    totals,
    entries,
  };
}

// ---------------------------------------------------------------------------
// Multi-campaign router
// ---------------------------------------------------------------------------

export interface MultiCampaignLedgerEntry {
  jackpotId: number;
  jackpotName: string;
  /** "split" => routed through the split denominator. "additive" => full independent rate. */
  routing: "split" | "additive";
  /** Number of concurrent split campaigns this split-routed entry was divided by (1 for additive). */
  splitDenominator: number;
  ledger: BetLedger;
}

export interface MultiCampaignLedger {
  wager: number;
  /** Count of enabled split-mode campaigns matched (the shared denominator). */
  splitDenominator: number;
  /** Aggregated pool/seed/house across every matched campaign after routing. */
  totals: ContributionSlice;
  /** Sum of all contributions credited (pool + seed + house) across campaigns. */
  totalContribution: number;
  perCampaign: MultiCampaignLedgerEntry[];
}

function scaleLedger(led: BetLedger, factor: number): BetLedger {
  const entries = led.entries.map((e) => ({
    ...e,
    pool: e.pool * factor,
    seed: e.seed * factor,
    house: e.house * factor,
  }));
  const totals = entries.reduce<ContributionSlice>(
    (acc, e) => ({ pool: acc.pool + e.pool, seed: acc.seed + e.seed, house: acc.house + e.house }),
    { pool: 0, seed: 0, house: 0 },
  );
  return {
    wager: led.wager,
    totalContribution: totals.pool + totals.seed + totals.house,
    totals,
    entries,
  };
}

/**
 * Concurrent multi-campaign router.
 *
 * Routing rules (per spec):
 *   - Split denominator counts ONLY enabled "split"-mode campaigns whose
 *     contribution.overlappingRule !== "additive" (default: "split").
 *   - Additive campaigns always compute their full, independent rate on top
 *     of the base wager. They neither dilute nor are diluted by split pools.
 *   - Non-split (flat/legacy) campaigns are treated as additive — they keep
 *     their full configured contribution and are excluded from the split
 *     denominator.
 */
export function computeMultiCampaignLedger(
  configs: JackpotConfigDTO[],
  wager: number,
): MultiCampaignLedger {
  const w = Number(wager) || 0;
  const active = configs.filter((c) => c.enabled !== false);

  const isSplitRouted = (c: JackpotConfigDTO) =>
    c.contribution?.mode === "split" &&
    (c.contribution?.overlappingRule ?? "split") !== "additive";

  const splitDenominator = active.filter(isSplitRouted).length;

  const perCampaign: MultiCampaignLedgerEntry[] = active.map((c) => {
    const base = computeBetLedger(c, w);
    const splitRouted = isSplitRouted(c);
    const denom = splitRouted ? Math.max(1, splitDenominator) : 1;
    const scaled = splitRouted && denom > 1 ? scaleLedger(base, 1 / denom) : base;
    return {
      jackpotId: c.id,
      jackpotName: c.name,
      routing: splitRouted ? "split" : "additive",
      splitDenominator: denom,
      ledger: scaled,
    };
  });

  const totals = perCampaign.reduce<ContributionSlice>(
    (acc, e) => ({
      pool: acc.pool + e.ledger.totals.pool,
      seed: acc.seed + e.ledger.totals.seed,
      house: acc.house + e.ledger.totals.house,
    }),
    { pool: 0, seed: 0, house: 0 },
  );

  return {
    wager: w,
    splitDenominator,
    totals,
    totalContribution: totals.pool + totals.seed + totals.house,
    perCampaign,
  };
}

// ---------------------------------------------------------------------------
// Community Win Mechanics — mirrors Java Community.java / Win.java
// ---------------------------------------------------------------------------

export interface CommunityPayoutBreakdown {
  isCommunity: true;
  triggeringPayout: number;
  communityPool: number;
  communitySize: number;
  communityMemberPayOut: number;
  cappedDelta: number;
}

export interface CommunityPayoutConfig {
  split: number;                    // 1..100
  maximumWinAmount: number;         // 0 = uncapped
  maximumNumberOfPlayers: number;   // upper bound for simulated qualifying group
}

/**
 * Pure helper — given a jackpot win amount and a community config, returns
 * the split between the triggering player and the community pool, plus the
 * per-member payout after the optional per-member cap is applied.
 */
export function applyCommunityPayout(
  winAmount: number,
  cfg: CommunityPayoutConfig,
  rng: () => number = Math.random,
): CommunityPayoutBreakdown {
  const win = Math.max(0, Number(winAmount) || 0);
  const splitPct = Math.min(100, Math.max(0, Number(cfg.split) || 0));
  const maxCap = Math.max(0, Number(cfg.maximumWinAmount) || 0);
  const maxPlayers = Math.max(1, Math.floor(Number(cfg.maximumNumberOfPlayers) || 1));

  const communityPool = win * (splitPct / 100);
  const triggeringPayout = win - communityPool;

  const communitySize = Math.max(1, Math.floor(rng() * maxPlayers) + 1);
  const rawShare = communitySize > 0 ? communityPool / communitySize : 0;

  let communityMemberPayOut = rawShare;
  let cappedDelta = 0;
  if (maxCap > 0 && rawShare > maxCap) {
    communityMemberPayOut = maxCap;
    cappedDelta = (rawShare - maxCap) * communitySize;
  }

  return {
    isCommunity: true,
    triggeringPayout,
    communityPool,
    communitySize,
    communityMemberPayOut,
    cappedDelta,
  };
}
