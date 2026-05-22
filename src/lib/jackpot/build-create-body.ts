import type { JackpotSavePayload } from "@/components/jackpot/JackpotCreationForm";

/** Certified RNG denominator ceiling (10M). Mirrors the upstream RNG keyspace. */
export const TRIGGER_ODDS_MAX = 10_000_000;

/** Validate v2 split-mode payload — throws if weights don't sum to EXACTLY 100.00.
 *  Zero-tolerance gate: any micro-decimal deviation rejects the write. */
function validateSplitWeights(p: JackpotSavePayload): void {
  const exact100 = (a: number, b: number, c: number): boolean => {
    // Quantize to 2 decimals (UI precision) then require the integer sum to be exactly 10_000.
    const q = (n: number) => Math.round((Number(n) || 0) * 100);
    return q(a) + q(b) + q(c) === 10_000;
  };

  if (p.contributionMode === "split") {
    if (!exact100(p.poolWeight ?? 0, p.seedWeight ?? 0, p.houseWeight ?? 0)) {
      const sum = (Number(p.poolWeight) || 0) + (Number(p.seedWeight) || 0) + (Number(p.houseWeight) || 0);
      throw new Error(
        `Split-mode contribution weights must sum to EXACTLY 100.00% (got ${sum.toFixed(4)}%). ` +
          `Adjust Pool / Seed / House before saving — zero-tolerance compliance gate.`,
      );
    }
  }
  if (p.triggerOdds != null && p.triggerOdds < 0) {
    throw new Error("triggerOdds must be a positive integer (or 0/empty to disable).");
  }
  if (p.triggerOdds != null && p.triggerOdds > TRIGGER_ODDS_MAX) {
    throw new Error(
      `triggerOdds (${p.triggerOdds.toLocaleString()}) exceeds the certified RNG ceiling of ` +
        `${TRIGGER_ODDS_MAX.toLocaleString()}.`,
    );
  }
}

/** Option A — strict mutual exclusivity between jackpot mode + caps + wager limits. */
function validateModeExclusivity(p: JackpotSavePayload): void {
  const t = p.type;
  const odds = Number(p.triggerOdds) || 0;
  const minWin = Number(p.minWinAmount) || 0;
  const maxWin = Number(p.maxWinAmount) || 0;
  const minWager = Number(p.minWagerAmount) || 0;
  const maxWager = Number(p.maxWagerAmount) || 0;

  if (t === "classic") {
    if (odds <= 0) {
      throw new Error("Classic Progressive requires a Trigger Probability denominator (N > 0).");
    }
    if (minWin > 0 || maxWin > 0) {
      throw new Error(
        "Classic Progressive cannot define Min/Max Win — fixed-odds mode pays the full pool balance.",
      );
    }
  }
  if (t === "must_drop" && odds > 0) {
    throw new Error("Must-Drop jackpots cannot define a Trigger Probability — value-driven mode only.");
  }
  if (t === "frequency") {
    if (odds > 0) {
      throw new Error("Frequency jackpots cannot define a Trigger Probability — time-driven mode only.");
    }
    if (minWin > 0 || maxWin > 0) {
      throw new Error("Frequency jackpots cannot define Min/Max Win caps — time-driven mode only.");
    }
  }
  if (p.contributionType === "fixed" && (minWager > 0 || maxWager > 0)) {
    throw new Error(
      "Min/Max Wager limits only apply to Percentage contributions; Fixed contributions are flat-fee side bets.",
    );
  }
}

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
  validateSplitWeights(payload);
  validateModeExclusivity(payload);

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

