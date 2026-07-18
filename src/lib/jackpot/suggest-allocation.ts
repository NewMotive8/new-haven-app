/**
 * MultiJackpot allocation suggester.
 *
 * Given the number of tiers, the master contribution and a strategy, this
 * module produces a per-tier suggestion for split share, trigger probability,
 * initial pool, reseeding amount, and pool/seed/house weights.
 *
 * Design principles:
 * - Top tier rank = N (highest). It should fire least often and carry the
 *   largest prize + reseed floor, so it accrues over many spins.
 * - Bottom tier rank = 1. It should fire most often with a small prize.
 * - Split share is inverted vs prize size: the top tier receives the SMALLEST
 *   ongoing contribution share (its pool grows slowly and pays out rarely);
 *   the bottom tier receives the LARGEST share (fast churn, frequent small
 *   payouts).
 * - Aggregate expected hit rate is tuned to ~1 hit per 500-2000 spins across
 *   the whole ladder, so demos feel alive without depleting liquidity.
 */

export type StrategyId = "balanced" | "top_heavy" | "flat_frequent";

export const STRATEGIES: ReadonlyArray<{
  id: StrategyId;
  label: string;
  description: string;
  spread: number; // geometric factor r
  aggregateHitOne: number; // aggregate hit rate 1 in N spins
}> = [
  {
    id: "balanced",
    label: "Balanced",
    description: "Moderate ladder — mid-sized top prize, steady lower tiers.",
    spread: 4,
    aggregateHitOne: 1200,
  },
  {
    id: "top_heavy",
    label: "Top-heavy",
    description: "Steep ladder — huge, rare top prize; frequent small hits.",
    spread: 10,
    aggregateHitOne: 2000,
  },
  {
    id: "flat_frequent",
    label: "Flat-frequent",
    description: "Shallow ladder — tiers hit at similar rates & sizes.",
    spread: 2,
    aggregateHitOne: 600,
  },
];

export interface SuggestedTier {
  /** 1-based rank; 1 = bottom, N = top. */
  tierRank: number;
  suggestedName: string;
  /** 0..100 — share of master contribution routed to this tier. */
  splitShare: number;
  /** Fractional probability per spin (0..1) — for classic pure-chance tiers. */
  triggerProbability: number;
  /** 1-in-N spins representation of triggerProbability. */
  spinsInterval: number;
  /** Starting pool value at launch. */
  initialPoolAmount: number;
  /** Re-seed floor. */
  reseedingAmount: number;
  /** Max pool ceiling (safety cap). */
  maxPoolAmount: number;
  poolWeight: number;
  seedWeight: number;
  houseWeight: number;
  /** Expected value/spin: master * splitShare/100. Used for previews. */
  derivedRate: number;
  /** Expected average prize at hit: derivedRate * spinsInterval. */
  expectedAvgPrize: number;
}

export interface SuggestInputs {
  tierCount: number;
  /** Master contribution value as stored (percent as fraction, or fixed amount). */
  masterValue: number;
  masterType: "percentage" | "fixed";
  strategy: StrategyId;
}

const TIER_NAMES = [
  "Mini",
  "Minor",
  "Major",
  "Grand",
  "Mega",
  "Ultra",
] as const;

function suggestName(rank: number, total: number): string {
  // Rank counts from bottom (1) to top (N). Map to the last N presets.
  const offset = TIER_NAMES.length - total;
  const idx = Math.max(0, Math.min(TIER_NAMES.length - 1, offset + (rank - 1)));
  return TIER_NAMES[idx];
}

/** Round to 2 decimals (currency / percent). */
function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Core suggester. Returns tiers ordered bottom (rank 1) → top (rank N).
 */
export function suggestTierAllocation(inputs: SuggestInputs): SuggestedTier[] {
  const N = Math.max(1, Math.trunc(inputs.tierCount));
  const strat = STRATEGIES.find((s) => s.id === inputs.strategy) ?? STRATEGIES[0];
  const r = strat.spread;

  // Geometric weights w_k = r^(k-1). k = 1..N.
  const weights: number[] = [];
  for (let k = 1; k <= N; k += 1) weights.push(Math.pow(r, k - 1));
  const wSum = weights.reduce((a, b) => a + b, 0);

  // Per-tier probability: aggregate p_agg = 1 / aggregateHitOne, split
  // geometrically so top tier is rarest. Use w[k-1] as *inverse* weight for
  // frequency (higher rank => lower probability).
  const pAgg = 1 / strat.aggregateHitOne;
  const invWeights = weights.map((w) => 1 / w);
  const invSum = invWeights.reduce((a, b) => a + b, 0);

  // For each tier: split share is INVERSE-proportional to weight, so top tier
  // gets the smallest ongoing share and the bottom tier gets the largest.
  const shareRawInv = weights.map((_, i) => invWeights[i] / invSum); // sums to 1

  // Reseed / initial pool: PROPORTIONAL to weight — top tier has the largest
  // floor because it accumulates and pays big.
  const reseedBase = inputs.masterType === "percentage" ? 500 : 100; // sensible defaults
  const reseeds = weights.map((w) => r2(reseedBase * w));

  const suggestions: SuggestedTier[] = weights.map((w, i) => {
    const rank = i + 1;
    const splitShare = r2(shareRawInv[i] * 100);
    // Per-tier probability derived from aggregate: p_k = p_agg * (1/w_k) / Σ(1/w).
    const triggerProbability = pAgg * (invWeights[i] / invSum);
    const spinsInterval = Math.max(1, Math.round(1 / triggerProbability));
    const reseedingAmount = reseeds[i];
    const initialPoolAmount = r2(reseedingAmount * 1.5);
    const maxPoolAmount = r2(reseedingAmount * (5 + w)); // top tier gets a bigger ceiling
    // Derived per-spin contribution to this tier.
    const derivedRate =
      inputs.masterType === "percentage"
        ? (inputs.masterValue * splitShare) / 100 // fractional per unit wager
        : (inputs.masterValue * splitShare) / 100; // amount per spin
    const expectedAvgPrize = r2(derivedRate * spinsInterval + reseedingAmount);

    return {
      tierRank: rank,
      suggestedName: suggestName(rank, N),
      splitShare,
      triggerProbability: Number(triggerProbability.toFixed(8)),
      spinsInterval,
      initialPoolAmount,
      reseedingAmount,
      maxPoolAmount,
      poolWeight: 70,
      seedWeight: 25,
      houseWeight: 5,
      derivedRate,
      expectedAvgPrize,
    };
  });

  // Rounding drift correction on splitShare — force sum to exactly 100.00.
  const sumShares = suggestions.reduce((a, t) => a + t.splitShare, 0);
  const drift = r2(100 - sumShares);
  if (drift !== 0 && suggestions.length > 0) {
    // Apply drift to the bottom tier (largest share, absorbs rounding cleanly).
    suggestions[0].splitShare = r2(suggestions[0].splitShare + drift);
  }

  return suggestions;
}

/** Named ladder preset shortcuts. */
export type LadderPresetId = "bronze-silver-gold" | "mega-ladder" | "twin-tier";

export const LADDER_PRESETS: ReadonlyArray<{
  id: LadderPresetId;
  label: string;
  description: string;
  tierCount: number;
  strategy: StrategyId;
  names: string[];
}> = [
  {
    id: "bronze-silver-gold",
    label: "Bronze / Silver / Gold",
    description: "3 tiers, balanced ladder — the safe classic setup.",
    tierCount: 3,
    strategy: "balanced",
    names: ["Bronze", "Silver", "Gold"],
  },
  {
    id: "mega-ladder",
    label: "4-tier Mega Ladder",
    description: "4 tiers, top-heavy — rare Grand prize, frequent Mini hits.",
    tierCount: 4,
    strategy: "top_heavy",
    names: ["Bronze", "Silver", "Gold", "Platinum"],
  },
  {
    id: "twin-tier",
    label: "Twin Tier",
    description: "2 tiers, flat-frequent — simple dual-drop cadence.",
    tierCount: 2,
    strategy: "flat_frequent",
    names: ["Minor", "Major"],
  },
];

export function buildLadderPreset(
  presetId: LadderPresetId,
  masterValue: number,
  masterType: "percentage" | "fixed",
): SuggestedTier[] {
  const preset = LADDER_PRESETS.find((p) => p.id === presetId) ?? LADDER_PRESETS[0];
  const tiers = suggestTierAllocation({
    tierCount: preset.tierCount,
    masterValue,
    masterType,
    strategy: preset.strategy,
  });
  // Rename with preset-specific names (bottom → top).
  return tiers.map((t, i) => ({
    ...t,
    suggestedName: preset.names[i] ?? t.suggestedName,
  }));
}
