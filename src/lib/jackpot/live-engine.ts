/**
 * Live single-spin evaluator. Mirrors the per-iteration decision block from
 * `simulator.ts` (CLASSIC / MUST_DROP / FREQUENCY) and adds the forced-hit
 * gate the real-money path requires:
 *
 *   If `pool.currentAmount >= pool.maximumAmount` (operator-configured cap),
 *   the spin MUST trigger a deterministic win — independent of RNG.
 *
 * Used by `/api/v1/event/bet` so live bets share the same rule surface as
 * the admin simulator. The function is pure (no IO, no DB) and stateless;
 * callers handle balance/ledger persistence.
 */
import {
  calculateAverageHitChance,
  calculateMaximumHitChance,
  fixedOddsHitChance,
  type RngSource,
} from "./math";
import type { JackpotConfigDTO } from "./types";

/**
 * Reason a spin was suppressed after the RNG roll.
 *
 * Compliance (GLI-11 §2.3 / GLI-19): every wager MUST consult the RNG, and
 * any post-RNG suppression MUST carry a machine-readable reason so the
 * regulator's audit trail can reconstruct why a rolled win was not paid.
 */
export type SuppressionReason =
  | "pool_below_min_win_floor"
  | "forced_hit_below_min_win_floor";

export interface LiveSpinResult {
  /** True when the spin wins (either RNG-triggered or forced by pool cap). */
  won: boolean;
  /** True when the win was forced by the pool ceiling, not RNG. */
  forcedHit: boolean;
  /** Resolved payout amount after fixed/maximum overrides. */
  winAmount: number;
  /** Effective per-spin hit probability (1.0 when forcedHit). */
  hitChance: number;
  /** True when the RNG was consulted for this spin (always true except on forced hits). */
  rngConsulted: boolean;
  /** Present only when a rolled/forced win was suppressed by a liquidity gate. */
  suppressionReason?: SuppressionReason;
}

function applyPayoutOverrides(rawWin: number, fixed: number, max: number): number {
  if (fixed > 0) return fixed;
  if (max > 0 && rawWin > max) return max;
  return rawWin;
}

function resolvePoolContribution(
  cfg: JackpotConfigDTO,
  wager: number,
): number {
  const c = cfg.contribution;
  if (c && c.mode === "split") {
    const type = c.totalContributionType ?? "FIXED";
    const total = Number(c.totalContributionAmount) || 0;
    const totalForCalc = type === "FIXED" ? total : wager * (total / 100);
    const pw = Math.max(0, Number(c.poolWeight) || 0) / 100;
    return totalForCalc * pw;
  }
  const pool = cfg.pool;
  const type = pool?.contributionType;
  const amt = Number(pool?.contributionAmount) || 0;
  return type === "FIXED" ? amt : wager * (amt / 100);
}

/**
 * Evaluate one live spin against the configured engine rules.
 *
 * Decision order:
 *   1. Forced hit  — pool >= configured cap → deterministic win.
 *   2. Fixed odds  — `triggerOdds` set → pure 1/N Bernoulli.
 *   3. Curve       — AVERAGE/MAXIMUM hit-chance against pool target.
 *   4. Fallback    — micro-decimal so timed/no-config jackpots are reachable.
 *
 * CLASSIC jackpots scale by wager (compliance: $10 bet ≈ 10× $1 chance).
 * Must-Drop / Frequency rely on the forced-hit gate plus optional curve.
 */
export function evaluateLiveSpin(
  cfg: JackpotConfigDTO,
  wager: number,
  rng: RngSource,
): LiveSpinResult {
  const pool = cfg.pool ?? ({} as JackpotConfigDTO["pool"]);
  const poolCurrent = Number(pool.currentAmount) || 0;
  const poolMaxRaw = Number(pool.maximumAmount) || 0;
  const fixedWin = Number(cfg.fixedWinAmount) || 0;
  const maxWin = Number(cfg.maximumWinAmount ?? pool.maximumWinAmount) || 0;
  const minWin = Number(pool.minimumWinAmount) || 0;

  const winAmount = applyPayoutOverrides(poolCurrent, fixedWin, maxWin);

  // Compliance invariant (GLI-11 §2.3 / GLI-19): every wager consults the RNG
  // exactly once. We consume the sample up-front so the audit trail records an
  // RNG call for this bet even if downstream logic later suppresses the win.
  const rngSample = rng();

  // ── 1. Forced-hit gate (operator pool cap reached). ─────────────────────
  if (poolMaxRaw > 0 && poolCurrent >= poolMaxRaw) {
    // Respect the minimum-win gate even on a forced hit — never settle below
    // the floor; suppress the win but log the reason for the audit trail.
    if (minWin > 0 && poolCurrent < minWin) {
      return {
        won: false,
        forcedHit: false,
        winAmount,
        hitChance: 0,
        rngConsulted: true,
        suppressionReason: "forced_hit_below_min_win_floor",
      };
    }
    return {
      won: true,
      forcedHit: true,
      winAmount,
      hitChance: 1,
      rngConsulted: true,
    };
  }

  // ── 2/3. Compute per-spin hit probability. ──────────────────────────────
  const structural = cfg.structuralType ?? "CLASSIC";
  const volatility = Number(cfg.volatility) || 0;
  const triggerOdds = Number(cfg.triggerOdds) || 0;
  const contrib = resolvePoolContribution(cfg, wager);

  let hitChance: number;
  if (triggerOdds > 0) {
    hitChance = fixedOddsHitChance(triggerOdds);
  } else if (structural === "CLASSIC") {
    const target =
      Number(pool.targetAmount) > 0
        ? Number(pool.targetAmount)
        : poolMaxRaw > 0
          ? poolMaxRaw
          : maxWin > 0
            ? maxWin
            : Math.max(2, poolCurrent);
    const winType = cfg.type ?? "AVERAGE";
    hitChance =
      winType === "MAXIMUM"
        ? calculateMaximumHitChance(poolCurrent, target, contrib, volatility)
        : calculateAverageHitChance(poolCurrent, target, contrib, volatility);
  } else {
    // MUST_DROP / FREQUENCY without an explicit cap-hit and no trigger odds:
    // safe micro-decimal so the live route is exercisable in the sandbox.
    hitChance = 0.0001;
  }

  // CLASSIC: scale by wager for GLI-12 compliance ($10 = 10× $1 chance).
  if (structural === "CLASSIC" && Number(wager) > 0) {
    hitChance = hitChance * Number(wager);
  }

  hitChance = Math.max(0, Math.min(1, Number.isFinite(hitChance) ? hitChance : 0));
  const won = rngSample < hitChance;

  // Min-win safety gate on RNG wins — record the suppression reason so the
  // ledger can distinguish "player did not win" from "player won but the pool
  // was under the disclosed minimum-win floor".
  if (won && minWin > 0 && poolCurrent < minWin) {
    return {
      won: false,
      forcedHit: false,
      winAmount,
      hitChance,
      rngConsulted: true,
      suppressionReason: "pool_below_min_win_floor",
    };
  }

  return { won, forcedHit: false, winAmount, hitChance, rngConsulted: true };
}
