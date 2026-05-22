/**
 * Reverse mapper: JackpotDTO (server) → JackpotSavePayload (wizard form state).
 *
 * Round-trip fidelity strategy:
 *   On save, `buildCreateBody` stores the full wizard payload under
 *   `config._draft`. When that key is present we use it verbatim. Otherwise we
 *   reconstruct from the structured `config` blob (which `buildTriggerCondition`
 *   produces) and fall back to sensible defaults so older records still hydrate.
 */
import type { JackpotDTO } from "./types";
import type { JackpotSavePayload } from "@/components/jackpot/JackpotCreationForm";

export function dtoToPayload(dto: JackpotDTO): JackpotSavePayload {
  const cfg = (dto.config ?? {}) as Record<string, any>;

  // Prefer the persisted draft for full fidelity.
  if (cfg._draft && typeof cfg._draft === "object") {
    const draft = cfg._draft as JackpotSavePayload;
    return {
      ...draft,
      name: dto.name ?? draft.name ?? "",
      isDraft: cfg.isDraft === true || draft.isDraft === true,
    };
  }

  // Fallback reconstruction from structured config.
  const pool = (cfg.pool ?? {}) as Record<string, any>;
  const seed = (cfg.seed ?? {}) as Record<string, any>;
  const recurrence = (cfg.recurrence ?? {}) as Record<string, any>;
  const widget = (cfg.widget ?? {}) as Record<string, any>;
  const engineV2 = (cfg.engineV2 ?? {}) as Record<string, any>;
  const eligibility = (cfg.eligibility?.games ?? undefined) as JackpotSavePayload["eligibility"];

  const seedAmount = Number(dto.seedAmount ?? 0);
  const poolBalance = Number(dto.poolBalance ?? 0);

  const econ = (cfg.prizeEconomy ?? {}) as Record<string, any>;
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
    volatility: Number(dto.volatility ?? cfg.volatility ?? 5),
    playerContribution: Number(pool.playerContribution ?? 0),
    operatorContribution: Number(pool.operatorContribution ?? 100),
    seedPlayerContribution: Number(seed.seedPlayerContribution ?? 100),
    seedOperatorContribution: Number(seed.seedOperatorContribution ?? 0),
    poolPercentageValue: Number(pool.poolPercentageValue ?? (Number(dto.contributionRate ?? 0) * 100)),
    seedPercentageValue: Number(seed.seedPercentageValue ?? 0),
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
    isCommunity: Boolean(widget.isCommunity ?? false),
    communitySplit: Number(widget.communitySplit ?? 50),
    isTemplate: Boolean(widget.isTemplate ?? false),
    selectedWidget: widget.selectedWidget ?? "jewels",
    fixedWinAmount: 0,
    averageWinAmount: 0,
    minWinAmount: 0,
    maxWinAmount: 0,
    minWagerAmount: 0,
    maxWagerAmount: 0,
    reseedingAmount: seedAmount,
    maximumSeedAmount: 0,
    initialPoolAmount: poolBalance || seedAmount,
    contributionMode: (engineV2.contributionMode ?? "split") as JackpotSavePayload["contributionMode"],
    totalContributionAmount: Number(engineV2.totalContributionAmount ?? 0.1),
    totalContributionType: (engineV2.totalContributionType ?? "fixed") as JackpotSavePayload["totalContributionType"],
    poolWeight: Number(engineV2.poolWeight ?? 60),
    seedWeight: Number(engineV2.seedWeight ?? 30),
    houseWeight: Number(engineV2.houseWeight ?? 10),
    triggerOdds: Number(engineV2.triggerOdds ?? 0),
    previewWager: 1.0,
    eligibility,
    community: cfg.community ?? undefined,
  };
}
