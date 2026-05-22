/**
 * Tier forecasting helpers shared by the MultiJackpot wizard and the
 * group detail page. These are pure functions — no UI state, no I/O.
 *
 * The "1 in X spins" UX writes a denominator string; we parse it into a
 * float probability (clamped 0..1) at 8-decimal precision and feed that
 * into the persisted payload. The simulated daily volume is local UI
 * state only and never persisted.
 */

/** Parse "1 in X" denominator string to a clamped probability (0..1). */
export function denominatorToProbability(raw: string): number {
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n) || n <= 0) return 0;
  const p = 1 / n;
  if (!Number.isFinite(p)) return 0;
  return Math.min(1, Math.max(0, p));
}

/** Inverse: float probability → human-readable denominator string. */
export function probabilityToDenominator(p: number): string {
  if (!Number.isFinite(p) || p <= 0) return "";
  return String(Math.round(1 / p));
}

/** Round-trip a probability through 8-decimal precision for display. */
export function probabilityFixed8(p: number): string {
  if (!Number.isFinite(p)) return "0.00000000";
  return p.toFixed(8);
}

/**
 * Build the human-readable "Estimated Drop Frequency" string for a given
 * probability and simulated daily spin volume.
 */
export function formatDropFrequency(
  probability: number,
  dailySpins: number,
): string {
  if (!Number.isFinite(probability) || probability <= 0 || dailySpins <= 0) {
    return "Configure a probability and traffic volume to see an estimate.";
  }
  const dropsPerDay = probability * dailySpins;
  if (dropsPerDay >= 1) {
    const rounded = dropsPerDay >= 10
      ? Math.round(dropsPerDay)
      : Math.round(dropsPerDay * 10) / 10;
    return `Expected to drop approx. ${rounded} times per day.`;
  }
  const daysBetween = 1 / dropsPerDay;
  if (daysBetween >= 1) {
    const days = daysBetween >= 10
      ? Math.round(daysBetween)
      : Math.round(daysBetween * 10) / 10;
    const hours = Math.round(daysBetween * 24);
    return `Expected to drop approx. once every ${days} days (or ${hours} hours).`;
  }
  const hours = Math.max(1, Math.round(daysBetween * 24));
  return `Expected to drop approx. once every ${hours} hours.`;
}
