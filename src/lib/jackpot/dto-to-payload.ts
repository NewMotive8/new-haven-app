/**
 * Reverse mapper: JackpotDTO (server) → JackpotSavePayload (wizard form state).
 *
 * Round-trip fidelity strategy:
 *   On save, `buildCreateBody` stores the full wizard payload under
 *   `config._draft`. When that key is present we use it verbatim. Otherwise we
 *   reconstruct from the structured `config` blob (which `buildTriggerCondition`
 *   produces) and fall back to sensible defaults so older records still hydrate
 *   without silently flipping fields to 0.
 */
import type { JackpotDTO } from "./types";
import type { JackpotSavePayload } from "@/components/jackpot/JackpotCreationForm";

const num = (v: unknown, fallback = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

export function dtoToPayload(dto: JackpotDTO): JackpotSavePayload {
  const cfg = (dto.config ?? {}) as Record<string, any>;

  // Structured-config slices — referenced by both the _draft fast-path (as
  // a last-resort hydration for missing fields) and the fallback below.
  const pool = (cfg.pool ?? {}) as Record<string, any>;
  const seed = (cfg.seed ?? {}) as Record<string, any>;
  const recurrence = (cfg.recurrence ?? {}) as Record<string, any>;
  const widget = (cfg.widget ?? {}) as Record<string, any>;
  const engineV2 = (cfg.engineV2 ?? {}) as Record<string, any>;
  const econ = (cfg.prizeEconomy ?? {}) as Record<string, any>;
  const eligibility = (cfg.eligibility?.games ?? undefined) as
    | JackpotSavePayload["eligibility"]
    | undefined;
  const community = (cfg.community ?? undefined) as
    | JackpotSavePayload["community"]
    | undefined;

  const seedAmount = num(dto.seedAmount);
  const poolBalance = num(dto.poolBalance);

  // Prefer the persisted draft for full fidelity, but back-fill any missing
  // keys from the structured config so half-hydrated drafts don't surface as
  // zeros in the editor.
  if (cfg._draft && typeof cfg._draft === "object") {
    const draft = cfg._draft as Partial<JackpotSavePayload>;
    const merged: JackpotSavePayload = {
      // structured-config baseline (lowest priority)
      description: cfg.description ?? "",
      walletType: econ.walletType === "internal" ? "internal" : "external",

      currencyId: econ.walletType === "internal" ? (econ.currencyId ?? null) : null,
      amountScale: econ.walletType === "internal" ? 1 : 100,
      type: (cfg.type ?? dto.jackpotType ?? "classic") as JackpotSavePayload["type"],
      payoutModel: (cfg.payoutModel ?? "maximum") as JackpotSavePayload["payoutModel"],
      contributionType: (cfg.contributionType ?? "fixed") as JackpotSavePayload["contributionType"],
      seedContributionType: (cfg.seedContributionType ?? "fixed") as JackpotSavePayload["seedContributionType"],
      volatility: num(dto.volatility ?? cfg.volatility, 5),
      playerContribution: num(pool.playerContribution, 0),
      operatorContribution: num(pool.operatorContribution, 100),
      seedPlayerContribution: num(seed.seedPlayerContribution, 100),
      seedOperatorContribution: num(seed.seedOperatorContribution, 0),
      recurrenceType: (recurrence.recurrenceType ?? "single") as JackpotSavePayload["recurrenceType"],
      weeklyDay: recurrence.weeklyDay ?? "",
      monthlyDay: recurrence.monthlyDay ?? "",
      displayFrequency: (recurrence.displayFrequency ?? "daily") as JackpotSavePayload["displayFrequency"],
      weeklyFrequencyDay: recurrence.weeklyFrequencyDay ?? "",
      monthlyFrequencyDay: recurrence.monthlyFrequencyDay ?? "",
      separateContributionFrequency: Boolean(recurrence.separateContributionFrequency ?? false),
      payoutInterval: widget.payoutInterval ?? "logged_in",
      isSegmented: Boolean(widget.isSegmented ?? false),
      segments: Array.isArray(widget.segments) ? widget.segments : ["Segment 1"],
      isCommunity: Boolean(widget.isCommunity ?? community?.enabled ?? false),
      communitySplit: num(widget.communitySplit ?? community?.split, 50),
      isTemplate: Boolean(widget.isTemplate ?? false),
      selectedWidget: widget.selectedWidget ?? "jewels",
      fixedWinAmount: 0,
      averageWinAmount: 0,
      minWinAmount: num(pool.minimumWinAmount, 0),
      maxWinAmount: num(pool.maximumWinAmount, 0),
      minWagerAmount: 0,
      maxWagerAmount: 0,
      reseedingAmount: num(seed.minimumSeedAmount ?? seedAmount),
      minimumSeedAmount: num(seed.minimumSeedAmount ?? seedAmount),
      maximumSeedAmount: num(seed.maximumSeedAmount, 0),
      initialPoolAmount: poolBalance || seedAmount,
      // Preserve operator-set pool cap across edit round-trips.
      maximumPoolAmount: num(
        pool.maximumPoolAmount ?? pool.maximumAmount ?? pool.maximumWinAmount,
        0,
      ),
      contributionMode: (engineV2.contributionMode ?? "split") as JackpotSavePayload["contributionMode"],
      totalContributionAmount: num(engineV2.totalContributionAmount, 0.1),
      totalContributionType: (engineV2.totalContributionType ?? "fixed") as JackpotSavePayload["totalContributionType"],
      poolWeight: num(engineV2.poolWeight, 60),
      seedWeight: num(engineV2.seedWeight, 30),
      houseWeight: num(engineV2.houseWeight, 10),
      triggerOdds: num(engineV2.triggerOdds, 0),
      previewWager: 1.0,
      eligibility,
      community,
      // draft overlay (highest priority) — wins for every key it owns
      ...draft,
      // identity always derived from the canonical DTO
      name: dto.name ?? draft.name ?? "",
      isDraft: cfg.isDraft === true || draft.isDraft === true,
    } as JackpotSavePayload;
    return merged;
  }

  // Fallback reconstruction from structured config (legacy / repaired rows).
  const walletType: JackpotSavePayload["walletType"] =
    econ.walletType === "internal" ? "internal" : "external";

  return {
    name: dto.name ?? "",
    description: cfg.description ?? "",
    walletType,
    currencyId: walletType === "internal" ? (econ.currencyId ?? null) : null,
    amountScale: walletType === "internal" ? 1 : 100,
    type: (cfg.type ?? dto.jackpotType ?? "classic") as JackpotSavePayload["type"],
    payoutModel: (cfg.payoutModel ?? "maximum") as JackpotSavePayload["payoutModel"],
    contributionType: (cfg.contributionType ?? "fixed") as JackpotSavePayload["contributionType"],
    seedContributionType: (cfg.seedContributionType ?? "fixed") as JackpotSavePayload["seedContributionType"],
    volatility: num(dto.volatility ?? cfg.volatility, 5),
    playerContribution: num(pool.playerContribution, 0),
    operatorContribution: num(pool.operatorContribution, 100),
    seedPlayerContribution: num(seed.seedPlayerContribution, 100),
    seedOperatorContribution: num(seed.seedOperatorContribution, 0),
    recurrenceType: (recurrence.recurrenceType ?? "single") as JackpotSavePayload["recurrenceType"],
    weeklyDay: recurrence.weeklyDay ?? "",
    monthlyDay: recurrence.monthlyDay ?? "",
    displayFrequency: (recurrence.displayFrequency ?? "daily") as JackpotSavePayload["displayFrequency"],
    weeklyFrequencyDay: recurrence.weeklyFrequencyDay ?? "",
    monthlyFrequencyDay: recurrence.monthlyFrequencyDay ?? "",
    separateContributionFrequency: Boolean(recurrence.separateContributionFrequency ?? false),
    payoutInterval: widget.payoutInterval ?? "logged_in",
    isSegmented: Boolean(widget.isSegmented ?? false),
    segments: Array.isArray(widget.segments) ? widget.segments : ["Segment 1"],
    isCommunity: Boolean(widget.isCommunity ?? community?.enabled ?? false),
    communitySplit: num(widget.communitySplit ?? community?.split, 50),
    isTemplate: Boolean(widget.isTemplate ?? false),
    selectedWidget: widget.selectedWidget ?? "jewels",
    fixedWinAmount: 0,
    averageWinAmount: 0,
    minWinAmount: num(pool.minimumWinAmount, 0),
    maxWinAmount: num(pool.maximumWinAmount, 0),
    minWagerAmount: 0,
    maxWagerAmount: 0,
    reseedingAmount: num(seed.minimumSeedAmount ?? seedAmount),
    minimumSeedAmount: num(seed.minimumSeedAmount ?? seedAmount),
    maximumSeedAmount: num(seed.maximumSeedAmount, 0),
    initialPoolAmount: poolBalance || seedAmount,
    maximumPoolAmount: num(
      pool.maximumPoolAmount ?? pool.maximumAmount ?? pool.maximumWinAmount,
      0,
    ),
    contributionMode: (engineV2.contributionMode ?? "split") as JackpotSavePayload["contributionMode"],
    totalContributionAmount: num(engineV2.totalContributionAmount, 0.1),
    totalContributionType: (engineV2.totalContributionType ?? "fixed") as JackpotSavePayload["totalContributionType"],
    poolWeight: num(engineV2.poolWeight, 60),
    seedWeight: num(engineV2.seedWeight, 30),
    houseWeight: num(engineV2.houseWeight, 10),
    triggerOdds: num(engineV2.triggerOdds, 0),
    previewWager: 1.0,
    eligibility,
    community,
  };
}
