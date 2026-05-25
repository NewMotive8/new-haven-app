import type { JackpotSavePayload } from "@/components/jackpot/JackpotCreationForm";
import { validateJackpotPayload, TRIGGER_ODDS_MAX as _TRIGGER_ODDS_MAX } from "./validate-payload";

/** Certified RNG denominator ceiling (10M). Re-exported for back-compat. */
export const TRIGGER_ODDS_MAX = _TRIGGER_ODDS_MAX;


export function buildTriggerCondition(p: JackpotSavePayload): Record<string, unknown> {
  return {
    type: p.type,
    payoutModel: p.payoutModel,
    contributionType: p.contributionType,
    seedContributionType: p.seedContributionType,
    pool: {
      playerContribution: p.playerContribution,
      operatorContribution: p.operatorContribution,
      
      initialPoolAmount: p.initialPoolAmount ?? null,
    },
    seed: {
      seedPlayerContribution: p.seedPlayerContribution,
      seedOperatorContribution: p.seedOperatorContribution,
      minimumSeedAmount: p.minimumSeedAmount ?? p.reseedingAmount ?? 0,
      maximumSeedAmount: p.maximumSeedAmount ?? 0,
    },
    recurrence: {
      recurrenceType: p.recurrenceType,
      weeklyDay: p.weeklyDay,
      monthlyDay: p.monthlyDay,
      displayFrequency: p.displayFrequency,
      weeklyFrequencyDay: p.weeklyFrequencyDay,
      monthlyFrequencyDay: p.monthlyFrequencyDay,
      separateContributionFrequency: p.separateContributionFrequency,
    },
    widget: {
      payoutInterval: p.payoutInterval,
      isSegmented: p.isSegmented,
      segments: p.segments,
      isCommunity: p.isCommunity,
      communitySplit: p.communitySplit,
      isTemplate: p.isTemplate,
      selectedWidget: p.selectedWidget,
    },
    // ── Prize Economy & Wallet Type — backend contract primitives.
    prizeEconomy: {
      walletType: p.walletType ?? "external",
      currencyId: p.walletType === "internal" ? (p.currencyId ?? null) : null,
      amountScale: p.walletType === "internal" ? 1 : 100,
    },
    description: p.description,
    // ── v2: contribution split + fixed-odds trigger (back-compat — undefined when unused).
    engineV2: {
      contributionMode: p.contributionMode ?? "legacy",
      totalContributionAmount: p.totalContributionAmount ?? null,
      totalContributionType: p.totalContributionType ?? null,
      poolWeight: p.poolWeight ?? null,
      seedWeight: p.seedWeight ?? null,
      houseWeight: p.houseWeight ?? null,
      triggerOdds: p.triggerOdds ?? null,
    },
    // ── Eligibility & Rules Engine — game/event targeting metadata for the
    //    multi-campaign router. Lives under config.eligibility.games.
    eligibility: { games: p.eligibility ?? null },
    // ── Community Win Mechanics — mirrors Java Community.java
    community: p.community ?? null,
    // ── Full wizard payload for round-trip edit fidelity. Read by
    //    dto-to-payload.ts when re-opening an existing jackpot in the editor.
    _draft: p,
  };
}

export function buildCreateBody(payload: JackpotSavePayload) {
  // Legacy multi_level guard — relational MultiJackpot groups are the only supported path.
  if ((payload as { type?: string }).type === "multi_level" || Array.isArray((payload as { tiers?: unknown }).tiers)) {
    throw new Error(
      "Legacy multi_level jackpots are deprecated. Use POST /api/v1/jackpot-groups to create a MultiJackpot.",
    );
  }
  validateJackpotPayload(payload);

  // Derive seed / pool / trigger threshold from the wizard payload instead of
  // a hardcoded constant. `reseedingAmount` is the operator-facing seed/reseed
  // floor; `initialPoolAmount` is the starting pool (defaults to the seed).
  const reseed = Number(payload.reseedingAmount) || 0;
  const initialPool = Number(payload.initialPoolAmount) || 0;
  const seedAmount = reseed > 0 ? reseed : initialPool;
  const poolBalance = initialPool > 0 ? initialPool : seedAmount;
  const triggerThreshold = Math.max(poolBalance * 2, seedAmount * 2);
  // Derive top-level contributionRate from the v2 Contribution Weight split.
  // Percentage mode: (totalContributionAmount% × poolWeight%) → fractional rate per wager.
  // Fixed mode: no meaningful per-wager rate; engine reads the fixed amount from config.engineV2.
  const totalAmt = Number(payload.totalContributionAmount) || 0;
  const poolW = Number(payload.poolWeight) || 0;
  const contributionRate = (payload.totalContributionType ?? "fixed") === "percentage"
    ? (totalAmt * poolW) / 10000
    : 0;
  const isDraft = payload.isDraft === true;
  const config = buildTriggerCondition(payload);
  if (isDraft) {
    (config as Record<string, unknown>).isDraft = true;
  }
  const casinoCats = payload.eligibility?.casino?.categories ?? [];
  const casinoGameIds = (payload.eligibility?.casino?.gameIds ?? [])
    .map((g) => Number(g))
    .filter((n) => Number.isFinite(n));
  return {
    name: payload.name,
    enabled: !isDraft,
    contributionRate,
    seedAmount,
    poolBalance,
    triggerThreshold,
    volatility: payload.volatility,
    jackpotType: payload.type,
    assignedCategories: casinoCats,
    assignedGameIds: casinoGameIds,
    config,
  };

}

