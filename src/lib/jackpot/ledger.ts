/**
 * Production house-ledger helpers.
 *
 * Used by live transaction handlers (real-money bet events) to compute the
 * three-way Pool / Seed / House split on every accepted wager, independent of
 * the simulator engine. Third-party wallets call into these helpers to extract
 * the operator rake (House slice) deterministically per spin.
 */
import type { ContributionSplitDTO, JackpotConfigDTO, TierDTO } from "./types";

export interface ContributionSlice {
  pool: number;
  seed: number;
  house: number;
}

export interface BetLedgerEntry extends ContributionSlice {
  /** Tier rank when MULTI_LEVEL (undefined for flat jackpots). */
  tier?: number;
  label?: string;
}

export interface BetLedger {
  wager: number;
  totalContribution: number;
  /** Aggregated split across all tiers (or the single flat slice). */
  totals: ContributionSlice;
  /** Per-target breakdown (one entry for CLASSIC, N entries for MULTI_LEVEL). */
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

  if (jp.structuralType === "MULTI_LEVEL" && Array.isArray(jp.tiers) && jp.tiers.length > 0) {
    jp.tiers.forEach((t: TierDTO) => {
      const tierWager = w * (Number(t.multiLevelWeight) || 0);
      const slice = resolveContributionSlice(
        t.contribution,
        { type: t.pool.contributionType, amount: Number(t.pool.contributionAmount) || 0 },
        { type: t.seed.contributionType, amount: Number(t.seed.contributionAmount) || 0 },
        tierWager,
      );
      entries.push({ ...slice, tier: t.multiLevelTier, label: t.label });
    });
  } else {
    pushFlat();
  }

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
