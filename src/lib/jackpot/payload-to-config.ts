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
  const winType: JackpotWinType =
    payload.payoutModel === "maximum" ? "MAXIMUM" : "AVERAGE";

  // --- Pool contribution: independent type + amount from the form.
  //     Use values as-is (0 and 0.5 are valid user inputs); only fall back
  //     when the field is missing/NaN.
  const poolContributionType =
    payload.contributionType === "fixed" ? "FIXED" : "PERCENTAGE";
  const poolContributionAmount = num(payload.poolPercentageValue, 0);

  // --- Seed contribution: same treatment, independent of the pool.
  const seedContributionType =
    payload.seedContributionType === "fixed" ? "FIXED" : "PERCENTAGE";
  const seedContributionAmount = num(payload.seedPercentageValue, 0);

  // --- Healthy baseline pool & seed so the math runs even when the user
  //     hasn't typed values yet. The form doesn't yet expose dedicated
  //     base-amount inputs, so we treat `seedPercentageValue` as the proxy
  //     "base seed" per the latest spec.
  const seedPct = num(payload.seedPercentageValue, 0);
  const baseSeed = numOr(seedPct, 500);
  const poolCurrent = numOr(seedPct * 2, 1000);

  const volatilityRaw = num(payload.volatility, 5);
  const volatility = Math.min(10, Math.max(0, volatilityRaw));

  return {
    id: 0,
    name: payload.name?.trim() || "Untitled Jackpot",
    type: winType,
    volatility,
    pool: {
      currentAmount: poolCurrent,
      minimumAmount: num(payload.minWinAmount, 500),
      maximumAmount: num(payload.maxWinAmount, 10000),
      contributionAmount: poolContributionAmount,
      contributionType: poolContributionType,
    },
    seed: {
      currentAmount: baseSeed,
      targetAmount: 1000,
      contributionAmount: seedContributionAmount,
      contributionType: seedContributionType,
    },
    // Engine-level overrides per win model
    ...(payload.payoutModel === "fixed"
      ? { fixedWinAmount: num(payload.fixedWinAmount, 100) }
      : {}),
    ...(payload.payoutModel === "maximum"
      ? { maximumWinAmount: num(payload.maxWinAmount, 10000) }
      : {}),
  };
}
