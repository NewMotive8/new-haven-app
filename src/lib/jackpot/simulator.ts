import { calculateAverageWin, calculateMaximumWin } from "./math";
import type {
  JackpotConfigDTO,
  SimulatorResponseDTO,
  WinEventDTO,
} from "./types";

function resolveContribution(
  type: "PERCENTAGE" | "FIXED" | undefined,
  amount: number,
  wager: number,
): number {
  if (type === "FIXED") return amount;
  // default: PERCENTAGE — amount is expressed as a percent (e.g. 2 = 2%).
  return wager * (amount / 100);
}

export function simulateEngine(
  jackpot: JackpotConfigDTO,
  wager: number,
  iterations: number,
): SimulatorResponseDTO {
  const safeIterations = Math.max(0, Math.min(Number(iterations) || 0, 1_000_000));
  const safeWager = Number(wager) || 0;

  // Work on local copies — don't mutate caller's object.
  const pool = { ...jackpot.pool };
  const seed = { ...jackpot.seed };

  const volatility = Number(jackpot.volatility) || 0;
  const winType = jackpot.type ?? "AVERAGE";

  let totalContributions = 0;
  let winCounter = 0;
  let winAmountCounter = 0;
  const winEvents: WinEventDTO[] = [];

  for (let i = 0; i < safeIterations; i++) {
    // Pool contribution
    const poolContribution = resolveContribution(
      jackpot.contributionType,
      Number(jackpot.contributionAmount) || 0,
      safeWager,
    );

    // Seed contribution (separate stream that refills the seed reserve)
    const seedContribution = resolveContribution(
      seed.contributionType,
      Number(seed.contributionAmount) || 0,
      safeWager,
    );

    // Apply pool contribution, respecting maximumAmount cap.
    const poolCap =
      typeof pool.maximumAmount === "number" && pool.maximumAmount > 0
        ? pool.maximumAmount
        : Number.POSITIVE_INFINITY;
    pool.currentAmount = Math.min(pool.currentAmount + poolContribution, poolCap);

    // Apply seed contribution, respecting targetAmount cap.
    const seedCap =
      typeof seed.targetAmount === "number" && seed.targetAmount > 0
        ? seed.targetAmount
        : Number.POSITIVE_INFINITY;
    seed.currentAmount = Math.min(seed.currentAmount + seedContribution, seedCap);

    totalContributions += poolContribution;

    // Evaluate win
    const target =
      typeof pool.maximumAmount === "number" && pool.maximumAmount > 0
        ? pool.maximumAmount
        : pool.currentAmount;

    const won =
      winType === "MAXIMUM"
        ? calculateMaximumWin(pool.currentAmount, target, poolContribution, volatility)
        : calculateAverageWin(pool.currentAmount, target, poolContribution, volatility);

    if (won) {
      // Determine win amount — apply overrides if set.
      let winAmount = pool.currentAmount;
      if (winType === "MAXIMUM" && typeof jackpot.maximumWinAmount === "number") {
        winAmount = jackpot.maximumWinAmount;
      } else if (typeof jackpot.fixedWinAmount === "number") {
        winAmount = jackpot.fixedWinAmount;
      }

      const poolBeforeWin = pool.currentAmount;
      winCounter++;
      winAmountCounter += winAmount;

      winEvents.push({
        iteration: i + 1,
        amount: winAmount,
        poolBeforeWin,
        timestamp: new Date().toISOString(),
      });

      // Reset pool to its minimum and drain that amount from the seed reserve.
      const reseedAmount = Math.max(0, Number(pool.minimumAmount) || 0);
      const fromSeed = Math.min(seed.currentAmount, reseedAmount);
      pool.currentAmount = reseedAmount;
      seed.currentAmount -= fromSeed;
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
    finalPool: pool.currentAmount,
    finalSeed: seed.currentAmount,
    winEvents,
  };
}
