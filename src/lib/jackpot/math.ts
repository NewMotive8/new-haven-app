// Math engine for jackpot win evaluation.
// Ported natively to TypeScript from the Spring Boot service.

export const FAIRNESS_MULTIPLIER = 100;
export const DEFAULT_MAXIMUM_VOLATILITY_EXPONENT = 75;
export const MAXIMUM_VOLATILITY_MULTIPLIER = 15;
export const DEFAULT_AVERAGE_VOLATILITY_EXPONENT = 50;
export const AVERAGE_VOLATILITY_MULTIPLIER = 5;

/**
 * Uniform pseudo-random source returning a value in [0, 1).
 * The simulator and math engine accept this so callers can inject an
 * external RNG (deterministic seed, pre-rolled value from a third-party
 * platform, etc.) instead of relying on Math.random().
 */
export type RngSource = () => number;

/**
 * Pure threshold for AVERAGE math model.
 * Returns the hit chance — caller compares against a uniform [0, 1) roll.
 */
export function calculateAverageHitChance(
  currentAmount: number,
  targetAmount: number,
  contributionAmount: number,
  rawVolatility: number,
): number {
  const safeTarget = Math.max(targetAmount, 2.0);
  const volatility = rawVolatility
    ? rawVolatility * AVERAGE_VOLATILITY_MULTIPLIER
    : DEFAULT_AVERAGE_VOLATILITY_EXPONENT;
  const stdDev = Math.max(1, Math.round(safeTarget / volatility));
  const probability = normalCdf(safeTarget, stdDev, currentAmount);
  return (probability * FAIRNESS_MULTIPLIER * (contributionAmount * FAIRNESS_MULTIPLIER)) / FAIRNESS_MULTIPLIER;
}

/**
 * Fixed-odds trigger probability helper.
 * Uses the same FAIRNESS_MULTIPLIER shape as calculateMaximumHitChance so
 * contribution scaling stays consistent with the rest of the pipeline.
 *
 *   p_per_spin (baseline) = 1 / triggerOdds
 *   hitChance = p_per_spin * contributionAmount * FAIRNESS_MULTIPLIER
 *
 * Compared against a uniform [0, 1) RNG roll, exactly like the curve helpers.
 */
export function fixedOddsHitChance(
  triggerOdds: number,
  contributionAmount: number,
): number {
  if (!Number.isFinite(triggerOdds) || triggerOdds <= 0) return 0;
  return (1 / triggerOdds) * contributionAmount * FAIRNESS_MULTIPLIER;
}

/**
 * Java parity: JackpotEngineMaths.calculateMaximumHitChance.
 * Returns the deterministic threshold (NOT a boolean) so callers like the
 * timed branch can add it to other chance terms before the RNG compare.
 */
export function calculateMaximumHitChance(
  currentAmount: number,
  targetAmount: number,
  contributionAmount: number,
  rawVolatility: number,
): number {
  const safeTarget = Math.max(targetAmount, 2.0);
  const volatility = rawVolatility
    ? rawVolatility * MAXIMUM_VOLATILITY_MULTIPLIER
    : DEFAULT_MAXIMUM_VOLATILITY_EXPONENT;
  const logValue = customLogPublic(currentAmount, safeTarget);
  const exponent = Math.pow(logValue, volatility);
  // JMS-244 Fairness Logic
  return (exponent * FAIRNESS_MULTIPLIER * (contributionAmount * FAIRNESS_MULTIPLIER)) / FAIRNESS_MULTIPLIER;
}

function customLogPublic(value: number, base: number): number {
  return Math.log(value) / Math.log(base);
}

// Standard Normal Distribution CDF using an Abramowitz & Stegun erf approximation.
export function normalCdf(mean: number, stdDev: number, value: number): number {
  const erf = (x: number): number => {
    const sign = x >= 0 ? 1 : -1;
    const ax = Math.abs(x);
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    const t = 1.0 / (1.0 + p * ax);
    const y =
      1.0 -
      ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax);
    return sign * y;
  };
  return 0.5 * (1 + erf((value - mean) / (stdDev * Math.sqrt(2))));
}

function customLog(value: number, base: number): number {
  return Math.log(value) / Math.log(base);
}

export function calculateMaximumWin(
  currentAmount: number,
  targetAmount: number,
  contributionAmount: number,
  rawVolatility: number,
): boolean {
  const safeTarget = Math.max(targetAmount, 2.0);
  const volatility = rawVolatility
    ? rawVolatility * MAXIMUM_VOLATILITY_MULTIPLIER
    : DEFAULT_MAXIMUM_VOLATILITY_EXPONENT;

  const logValue = customLog(currentAmount, safeTarget);
  const exponent = Math.pow(logValue, volatility);

  // JMS-244 Fairness Logic
  const hitChance =
    (exponent * FAIRNESS_MULTIPLIER * (contributionAmount * FAIRNESS_MULTIPLIER)) /
    FAIRNESS_MULTIPLIER;

  const random = Math.random() * safeTarget;
  const result = random / safeTarget;

  return result < hitChance;
}

export function calculateAverageWin(
  currentAmount: number,
  targetAmount: number,
  contributionAmount: number,
  rawVolatility: number,
): boolean {
  const safeTarget = Math.max(targetAmount, 2.0);
  const volatility = rawVolatility
    ? rawVolatility * AVERAGE_VOLATILITY_MULTIPLIER
    : DEFAULT_AVERAGE_VOLATILITY_EXPONENT;

  const stdDev = Math.max(1, Math.round(safeTarget / volatility));
  const probability = normalCdf(safeTarget, stdDev, currentAmount);

  // JMS-244 Fairness Logic
  const hitChance =
    (probability * FAIRNESS_MULTIPLIER * (contributionAmount * FAIRNESS_MULTIPLIER)) /
    FAIRNESS_MULTIPLIER;

  const random = Math.random() * safeTarget;
  const result = random / safeTarget;

  return result < hitChance;
}
