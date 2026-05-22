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
      poolPercentageValue: p.poolPercentageValue,
      initialPoolAmount: p.initialPoolAmount ?? null,
    },
    seed: {
      seedPlayerContribution: p.seedPlayerContribution,
      seedOperatorContribution: p.seedOperatorContribution,
      seedPercentageValue: p.seedPercentageValue,
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


  const seedAmount = 1000;
  const contributionRate = payload.poolPercentageValue / 100;
  return {
    name: payload.name,
    enabled: true,
    contributionRate,
    seedAmount,
    poolBalance: seedAmount,
    triggerThreshold: seedAmount * 2,
    volatility: payload.volatility,
    jackpotType: payload.type,
    config: buildTriggerCondition(payload),
  };

}

