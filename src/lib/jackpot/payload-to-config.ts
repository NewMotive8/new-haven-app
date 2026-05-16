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

  // --- Real, user-driven amounts. We deliberately avoid silent fallbacks
  //     to fixed numbers like 1000/10000 (they skew the Java-ported
  //     Normal CDF + log curves). Only fall back when EVERY relevant input
  //     is blank, and only to a floor that keeps the math defined.
  const reseed = num(payload.reseedingAmount, 0);
  const minWin = num(payload.minWinAmount, 0);
  const maxWin = num(payload.maxWinAmount, 0);
  const maxSeed = num(payload.maximumSeedAmount, 0);
  const baseSeedProxy = num(payload.seedPercentageValue, 0);

  // Pool starts at the user's re-seed amount (where the engine resets after a win).
  const poolCurrent =
    reseed > 0 ? reseed : baseSeedProxy > 0 ? baseSeedProxy * 2 : 1000;

  // Seed accumulates toward an operational target. Priority: explicit
  // Maximum Seed Amount → 5× re-seed → 2× base seed proxy → last-resort floor.
  const seedCurrent =
    baseSeedProxy > 0 ? baseSeedProxy : reseed > 0 ? reseed : 500;
  const seedTarget =
    maxSeed > 0
      ? maxSeed
      : reseed > 0
      ? reseed * 5
      : baseSeedProxy > 0
      ? baseSeedProxy * 2
      : 1000;

  const volatilityRaw = num(payload.volatility, 5);
  const volatility = Math.min(10, Math.max(0, volatilityRaw));

  return {
    id: 0,
    name: payload.name?.trim() || "Untitled Jackpot",
    type: winType,
    volatility,
    pool: {
      currentAmount: poolCurrent,
      minimumAmount: minWin, // 0 is a valid user input
      maximumAmount: maxWin, // 0 = uncapped; engine treats <=0 as Infinity
      contributionAmount: poolContributionAmount,
      contributionType: poolContributionType,
    },
    seed: {
      currentAmount: seedCurrent,
      targetAmount: seedTarget,
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
