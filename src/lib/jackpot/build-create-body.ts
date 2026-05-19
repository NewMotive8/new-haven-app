import type { JackpotSavePayload } from "@/components/jackpot/JackpotCreationForm";

/** Validate v2 split-mode payload — throws if weights don't sum to exactly 100. */
function validateSplitWeights(p: JackpotSavePayload): void {
  if (p.contributionMode === "split") {
    const sum = (Number(p.poolWeight) || 0) + (Number(p.seedWeight) || 0) + (Number(p.houseWeight) || 0);
    if (Math.abs(sum - 100) > 0.05) {
      throw new Error(
        `Split-mode contribution weights must sum to 100 (got ${sum.toFixed(2)}). ` +
          `Adjust Pool / Seed / House before saving.`,
      );
    }
  }
  if (p.type === "multi_level" && Array.isArray(p.tiers)) {
    p.tiers.forEach((t, idx) => {
      if (t.contributionMode === "split") {
        const sum = (Number(t.poolWeight) || 0) + (Number(t.seedWeight) || 0) + (Number(t.houseWeight) || 0);
        if (Math.abs(sum - 100) > 0.05) {
          throw new Error(
            `Tier #${idx + 1} (${t.label ?? `T${t.multiLevelTier}`}) split weights must sum to 100 ` +
              `(got ${sum.toFixed(2)}).`,
          );
        }
      }
      if (t.triggerOdds != null && t.triggerOdds < 0) {
        throw new Error(`Tier #${idx + 1} triggerOdds must be a positive integer.`);
      }
    });
  }
  if (p.triggerOdds != null && p.triggerOdds < 0) {
    throw new Error("triggerOdds must be a positive integer (or 0/empty to disable).");
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
    ...(p.type === "multi_level" && Array.isArray(p.tiers) ? { tiers: p.tiers } : {}),
  };
}

export function buildCreateBody(payload: JackpotSavePayload) {
  // Strict gate — throws BEFORE any data layer touch.
  validateSplitWeights(payload);

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
