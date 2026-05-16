import { calculateAverageWin, calculateMaximumWin } from "./math";
import type {
  JackpotConfigDTO,
  SimulatorResponseDTO,
  WinEventDTO,
} from "./types";

const MAX_ITERATIONS = 10_000_000;
const MAX_WIN_EVENTS_RETAINED = 500;

export function simulateEngine(
  jackpot: JackpotConfigDTO,
  wager: number,
  iterations: number,
): SimulatorResponseDTO {
  const safeIterations = Math.max(0, Math.min(Number(iterations) || 0, MAX_ITERATIONS));
  const safeWager = Number(wager) || 0;

  // Local copies — don't mutate caller's object.
  let poolCurrent = Number(jackpot.pool.currentAmount) || 0;
  const poolMin = Number(jackpot.pool.minimumAmount) || 0;
  const poolMaxRaw = Number(jackpot.pool.maximumAmount) || 0;
  const poolCap = poolMaxRaw > 0 ? poolMaxRaw : Number.POSITIVE_INFINITY;

  let seedCurrent = Number(jackpot.seed.currentAmount) || 0;
  const seedTargetRaw = Number(jackpot.seed.targetAmount) || 0;
  const seedCap = seedTargetRaw > 0 ? seedTargetRaw : Number.POSITIVE_INFINITY;

  // Hoist hot-loop config
  const volatility = Number(jackpot.volatility) || 0;
  const winType = jackpot.type ?? "AVERAGE";
  const poolContribType = jackpot.contributionType;
  const poolContribAmt = Number(jackpot.contributionAmount) || 0;
  const seedContribType = jackpot.seed.contributionType;
  const seedContribAmt = Number(jackpot.seed.contributionAmount) || 0;

  // Precompute contributions (constant per spin given fixed wager)
  const poolContribution =
    poolContribType === "FIXED" ? poolContribAmt : safeWager * (poolContribAmt / 100);
  const seedContribution =
    seedContribType === "FIXED" ? seedContribAmt : safeWager * (seedContribAmt / 100);

  const targetForWin = poolMaxRaw > 0 ? poolMaxRaw : 0; // 0 -> falls back per-iteration below
  const useFixedTarget = targetForWin > 0;

  const fixedWinOverride =
    winType === "MAXIMUM" && typeof jackpot.maximumWinAmount === "number"
      ? jackpot.maximumWinAmount
      : typeof jackpot.fixedWinAmount === "number"
      ? jackpot.fixedWinAmount
      : null;

  const reseedAmount = Math.max(0, poolMin);

  let totalContributions = 0;
  let winCounter = 0;
  let winAmountCounter = 0;
  let maxWinAmount = 0;
  const tierCounts: Record<string, number> = {};
  const winEvents: WinEventDTO[] = [];

  const isAverage = winType !== "MAXIMUM";
  const nowIso = new Date().toISOString();

  for (let i = 0; i < safeIterations; i++) {
    // Apply contributions
    if (poolCurrent + poolContribution > poolCap) {
      poolCurrent = poolCap;
    } else {
      poolCurrent += poolContribution;
    }
    if (seedCurrent + seedContribution > seedCap) {
      seedCurrent = seedCap;
    } else {
      seedCurrent += seedContribution;
    }

    totalContributions += poolContribution;

    const target = useFixedTarget ? targetForWin : poolCurrent;
    const won = isAverage
      ? calculateAverageWin(poolCurrent, target, poolContribution, volatility)
      : calculateMaximumWin(poolCurrent, target, poolContribution, volatility);

    if (won) {
      const winAmount = fixedWinOverride !== null ? fixedWinOverride : poolCurrent;
      const poolBeforeWin = poolCurrent;

      winCounter++;
      winAmountCounter += winAmount;
      if (winAmount > maxWinAmount) maxWinAmount = winAmount;

      // Tier bucket by order of magnitude
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

      const fromSeed = seedCurrent < reseedAmount ? seedCurrent : reseedAmount;
      poolCurrent = reseedAmount;
      seedCurrent -= fromSeed;
    }
  }

  const totalWagered = safeWager * safeIterations;
  const rtp = totalContributions > 0 ? (winAmountCounter / totalContributions) * 100 : 0;

  return {
    iterations: safeIterations,
    wager: safeWager,
    totalWagered,
    totalContributions,
    winCounter,
    winAmountCounter,
    rtp,
    finalPool: poolCurrent,
    finalSeed: seedCurrent,
    winEvents,
    maxWinAmount,
    tierCounts,
  };
}
