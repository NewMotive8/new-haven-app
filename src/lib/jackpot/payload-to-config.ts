import type { JackpotConfigDTO, JackpotWinType } from "./types";
import type { JackpotSavePayload } from "@/components/jackpot/JackpotCreationForm";

/**
 * Coerce anything coming out of slider/input state into a finite number.
 * Sliders return arrays / strings / undefined depending on the field; the
 * engine math silently treats NaN/undefined as 0 which previously made every
 * spin hit the static safety payout.
 */
function num(value: unknown, fallback = 0): number {
  if (value == null) return fallback;
  if (Array.isArray(value)) return num(value[0], fallback);
  const n = typeof value === "number" ? value : parseFloat(String(value));
  return Number.isFinite(n) ? n : fallback;
}

/** Treat 0 / NaN / undefined as "user didn't pick a value" and fall back. */
function numOr(value: unknown, fallback: number): number {
  const n = num(value, fallback);
  return n > 0 ? n : fallback;
}

/**
 * Map the rich form payload coming out of the creation flow into the lean
 * JackpotConfigDTO shape the simulator engine expects.
 */
export function mapPayloadToConfig(payload: JackpotSavePayload): JackpotConfigDTO {
  // --- Win type: form payoutModel ('fixed' | 'average' | 'maximum')
  //               → engine type    ('AVERAGE' | 'MAXIMUM')
  // 'fixed' rides on AVERAGE with a fixedWinAmount override so the engine
  // pays out a flat number every trigger.
  const winType: JackpotWinType =
    payload.payoutModel === "maximum" ? "MAXIMUM" : "AVERAGE";

  // --- Pool contribution: type + size
  const poolContributionType =
    payload.contributionType === "fixed" ? "FIXED" : "PERCENTAGE";
  const poolPct = num(payload.poolPercentageValue, 0);
  const playerPct = num(payload.playerContribution, 0);
  const operatorPct = num(payload.operatorContribution, 0);
  // For fixed: poolPercentageValue is the flat per-spin amount.
  // For percentage: sum of player + operator splits.
  const poolContributionAmount =
    poolContributionType === "FIXED"
      ? numOr(poolPct, 3)
      : numOr(playerPct + operatorPct, 3);

  // --- Seed contribution
  const seedContributionType =
    payload.seedContributionType === "fixed" ? "FIXED" : "PERCENTAGE";
  const seedPct = num(payload.seedPercentageValue, 0);
  const seedContributionAmount =
    seedContributionType === "FIXED" ? numOr(seedPct, 1) : numOr(seedPct, 1);

  // --- Healthy baseline pool & seed so the math runs even when the user
  //     hasn't typed values yet. The form doesn't yet expose dedicated
  //     base-amount inputs, so we treat `seedPercentageValue` as the proxy
  //     "base seed" per the latest spec.
  const baseSeed = numOr(seedPct, 500);
  const poolCurrent = numOr(seedPct * 2, 1000);

  const volatilityRaw = num(payload.volatility, 5);
  // UI exposes volatility on a 1-10 scale; engine treats it as a multiplier
  // on payout dispersion. Clamp to a safe range.
  const volatility = Math.min(10, Math.max(0, volatilityRaw));

  return {
    id: 0,
    name: payload.name?.trim() || "Untitled Jackpot",
    type: winType,
    contributionAmount: poolContributionAmount,
    contributionType: poolContributionType,
    volatility,
    pool: {
      currentAmount: poolCurrent,
      minimumAmount: 500,
      maximumAmount: 10000,
    },
    seed: {
      currentAmount: baseSeed,
      targetAmount: 1000,
      contributionAmount: seedContributionAmount,
      contributionType: seedContributionType,
    },
    // Engine-level overrides per win model
    ...(payload.payoutModel === "fixed" ? { fixedWinAmount: 100 } : {}),
    ...(payload.payoutModel === "maximum" ? { maximumWinAmount: 10000 } : {}),
  };
}
