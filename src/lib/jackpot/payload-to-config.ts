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

  // --- Real, user-driven amounts. No blind fallbacks — every value passes
  //     through unaltered so the simulator evaluates the exact UI parameters.
  const reseed = num(payload.reseedingAmount, 0);
  const minWin = num(payload.minWinAmount, 0);
  const maxWin = num(payload.maxWinAmount, 0);
  const avgWin = num(payload.averageWinAmount, 0);

  const volatilityRaw = num(payload.volatility, 5);
  const volatility = Math.min(10, Math.max(0, volatilityRaw));

  return {
    id: 0,
    name: payload.name?.trim() || "Untitled Jackpot",
    type: winType,
    volatility,
    pool: {
      currentAmount: reseed,                  // start at reseed floor
      minimumAmount: reseed,                  // reseed floor
      maximumAmount: 0,                       // legacy; engine ignores when 0
      minimumWinAmount: minWin,               // payout floor (clamp)
      maximumWinAmount: maxWin,               // payout ceiling (clamp; 0 = uncapped)
      contributionAmount: poolContributionAmount,
      contributionType: poolContributionType,
    },
    seed: {
      currentAmount: seedContributionAmount,  // start at one contribution tick
      targetAmount: avgWin,                   // CDF mean = Average Win Amount (exact)
      contributionAmount: seedContributionAmount,
      contributionType: seedContributionType,
    },
    // Engine-level overrides per win model
    ...(payload.payoutModel === "fixed"
      ? { fixedWinAmount: num(payload.fixedWinAmount, 0) }
      : {}),
    ...(payload.payoutModel === "maximum"
      ? { maximumWinAmount: maxWin }
      : {}),
  };
}
