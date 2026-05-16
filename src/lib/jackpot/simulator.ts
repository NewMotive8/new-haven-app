import { calculateAverageWin, calculateMaximumWin } from "./math";
import type {
  JackpotConfigDTO,
  SimulatorResponseDTO,
  WinEventDTO,
} from "./types";

const MAX_ITERATIONS = 10_000_000;
const MAX_WIN_EVENTS_RETAINED = 500;

/**
 * Java parity notes (see JackpotEngineSimulator.java + JackpotEngineMaths.java):
 *
 *  - Pool contribution and seed contribution are INDEPENDENT inputs to the
 *    math (line 169: `contributionAmount = forCalc(pool) + forCalc(seed)`).
 *  - `forCalculation` feeds the RNG; `fromWallet` / `notFromWallet` are
 *    operator-share splits used only for telemetry & RTP denominator.
 *  - `performSafetyChecks` REJECTS a CDF-hit win (does not count, no payout,
 *    no reseed) when:
 *       * pool.currentAmount < jackpot.minimumWinAmount, OR
 *       * seed.currentAmount  < pool.minimumAmount (when seed configured).
 *  - Win amount is `pool.currentAmount` (capped by jackpot.maximumWinAmount,
 *    or replaced by jackpot.fixedWinAmount). Seed is NEVER added to payout.
 *  - Reseed branches:
 *       AVERAGE  → pool.resetPool() to minimumAmount, seed -= minimumAmount.
 *       MAX/FIXED → pool -= win; if pool < min, top up diff from seed.
 */
export function simulateEngine(
  jackpot: JackpotConfigDTO,
  wager: number,
  iterations: number,
): SimulatorResponseDTO {
  const safeIterations = Math.max(0, Math.min(Number(iterations) || 0, MAX_ITERATIONS));
  const safeWager = Number(wager) || 0;

  // --- Pool state ---
  let poolCurrent = Number(jackpot.pool.currentAmount) || 0;
  const poolMin = Number(jackpot.pool.minimumAmount) || 0;
  const poolMaxRaw = Number(jackpot.pool.maximumAmount) || 0;
  const poolCap = poolMaxRaw > 0 ? poolMaxRaw : Number.POSITIVE_INFINITY;

  // Jackpot-level rejection / clamp values (Java: jackpot.minimumWinAmount,
  // jackpot.maximumWinAmount). We carry them on pool DTO for transport.
  const minimumWinAmount = Number(jackpot.pool.minimumWinAmount) || 0;
  const maximumWinAmountRaw =
    Number(jackpot.maximumWinAmount ?? jackpot.pool.maximumWinAmount) || 0;
  const maximumWinAmount = maximumWinAmountRaw > 0 ? maximumWinAmountRaw : 0;
  const fixedWinAmount = Number(jackpot.fixedWinAmount) || 0;

  // --- Seed state ---
  let seedCurrent = Number(jackpot.seed.currentAmount) || 0;
  const seedTargetRaw = Number(jackpot.seed.targetAmount) || 0;
  const seedCap = seedTargetRaw > 0 ? seedTargetRaw : Number.POSITIVE_INFINITY;

  // Java: `hasSeedConfig = pools.anyMatch(pool.minimumAmount > 0)`
  const hasSeedConfig = poolMin > 0;

  // --- Hoist hot-loop config ---
  const volatility = Number(jackpot.volatility) || 0;
  const winType = jackpot.type ?? "AVERAGE";

  const poolContribAmt = Number(jackpot.pool.contributionAmount) || 0;
  const seedContribAmt = Number(jackpot.seed.contributionAmount) || 0;
  const poolContribForCalc =
    jackpot.pool.contributionType === "FIXED"
      ? poolContribAmt
      : safeWager * (poolContribAmt / 100);
  const seedContribForCalc =
    jackpot.seed.contributionType === "FIXED"
      ? seedContribAmt
      : safeWager * (seedContribAmt / 100);

  // --- Operator share (BrandDTO mirror, per-bucket). 0–100. ---
  const poolOperatorShare = Math.min(100, Math.max(0, Number(jackpot.pool.operatorShare) || 0)) / 100;
  const seedOperatorShare = Math.min(100, Math.max(0, Number(jackpot.seed.operatorShare) || 0)) / 100;

  // Java ContributionDTO: fromWallet vs notFromWallet split.
  const poolFromWallet = poolContribForCalc * (1 - poolOperatorShare);
  const poolNotFromWallet = poolContribForCalc * poolOperatorShare;
  const seedFromWallet = seedContribForCalc * (1 - seedOperatorShare);
  const seedNotFromWallet = seedContribForCalc * seedOperatorShare;

  // CDF mean / target: seed.targetAmount (Average Win Amount from the form).
  const cdfTarget = seedTargetRaw > 0 ? seedTargetRaw : 0;
  const useFixedTarget = cdfTarget > 0;

  const reseedAmount = Math.max(0, poolMin);

  // --- Counters (Java line 116-123) ---
  let walletContributions = 0;     // poolContributionCounter + seedContributionCounter (fromWallet)
  let operatorContributions = 0;   // operatorContributionCounter (notFromWallet)
  let winCounter = 0;
  let winAmountCounter = 0;
  let maxWinAmount = 0;
  let rejectedByGate = 0;
  const tierCounts: Record<string, number> = {};
  const winEvents: WinEventDTO[] = [];

  const isAverage = winType !== "MAXIMUM";
  const hasFixedOrMaxOverride = fixedWinAmount > 0 || maximumWinAmount > 0;
  const nowIso = new Date().toISOString();

  for (let i = 0; i < safeIterations; i++) {
    // 1. Apply pool contribution
    if (poolCurrent + poolContribForCalc > poolCap) {
      poolCurrent = poolCap;
    } else {
      poolCurrent += poolContribForCalc;
    }
    walletContributions += poolFromWallet;
    operatorContributions += poolNotFromWallet;

    // 2. Apply seed contribution (only when seed configured)
    let mathContribution = poolContribForCalc;
    if (hasSeedConfig) {
      if (seedCurrent + seedContribForCalc > seedCap) {
        seedCurrent = seedCap;
      } else {
        seedCurrent += seedContribForCalc;
      }
      walletContributions += seedFromWallet;
      operatorContributions += seedNotFromWallet;
      mathContribution += seedContribForCalc; // Java line 169
    }

    // 3. RNG: did this bet trigger?
    const target = useFixedTarget ? cdfTarget : poolCurrent;
    const won = isAverage
      ? calculateAverageWin(poolCurrent, target, mathContribution, volatility)
      : calculateMaximumWin(poolCurrent, target, mathContribution, volatility);

    if (!won) continue;

    // 4. performSafetyChecks — REJECT (do not count, do not pay, do not reseed)
    if (minimumWinAmount > 0 && poolCurrent < minimumWinAmount) {
      rejectedByGate++;
      continue;
    }
    if (hasSeedConfig && seedCurrent < poolMin) {
      rejectedByGate++;
      continue;
    }

    // 5. Compute payout. Seed is NEVER added.
    let winAmount = poolCurrent;
    if (fixedWinAmount > 0) {
      winAmount = fixedWinAmount;
    } else if (maximumWinAmount > 0 && winAmount > maximumWinAmount) {
      winAmount = maximumWinAmount;
    }
    const poolBeforeWin = poolCurrent;

    // 6. Record the win
    winCounter++;
    winAmountCounter += winAmount;
    if (winAmount > maxWinAmount) maxWinAmount = winAmount;

    const mag = Math.floor(Math.log10(Math.max(1, winAmount)));
    const tier = `1e${mag}-1e${mag + 1}`;
    tierCounts[tier] = (tierCounts[tier] ?? 0) + 1;

    if (winEvents.length < MAX_WIN_EVENTS_RETAINED) {
      winEvents.push({
        iteration: i + 1,
        amount: winAmount,
        poolBeforeWin,
        timestamp: nowIso,
      });
    }

    // 7. Reseed — Java adjustPoolsLocally
    if (hasFixedOrMaxOverride) {
      // MAX/FIXED: subtract win from pool; top up diff from seed if needed.
      poolCurrent = poolCurrent - winAmount;
      if (poolCurrent < poolMin) {
        const diff = poolMin - poolCurrent;
        if (hasSeedConfig) {
          seedCurrent = Math.max(0, seedCurrent - diff);
        }
        poolCurrent = poolCurrent + diff;
      }
    } else {
      // AVERAGE: pool.resetPool() to minimum, drain minimum from seed.
      poolCurrent = reseedAmount;
      if (hasSeedConfig) {
        seedCurrent = Math.max(0, seedCurrent - reseedAmount);
      }
    }
  }

  const totalWagered = safeWager * safeIterations;
  const denom = walletContributions + operatorContributions;
  const rtp = denom > 0 ? (winAmountCounter / denom) * 100 : 0;

  return {
    iterations: safeIterations,
    wager: safeWager,
    totalWagered,
    totalContributions: walletContributions, // Java telemetry = fromWallet
    walletContributions,
    operatorContributions,
    winCounter,
    rejectedByGate,
    winAmountCounter,
    rtp,
    finalPool: poolCurrent,
    finalSeed: seedCurrent,
    winEvents,
    maxWinAmount,
    tierCounts,
  };
}
