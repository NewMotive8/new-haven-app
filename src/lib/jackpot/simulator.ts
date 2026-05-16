import {
  AVERAGE_VOLATILITY_MULTIPLIER,
  DEFAULT_AVERAGE_VOLATILITY_EXPONENT,
  calculateAverageWin,
  calculateMaximumHitChance,
  calculateMaximumWin,
} from "./math";
import type {
  EngineScopeAuditDTO,
  JackpotConfigDTO,
  PoolDTO,
  SeedDTO,
  SimulatorResponseDTO,
  TierDTO,
  TierResultDTO,
  WinEventDTO,
} from "./types";

const MAX_ITERATIONS = 10_000_000;
const MAX_WIN_EVENTS_RETAINED = 500;

/**
 * Java parity notes (see JackpotEngineSimulator.java + JackpotEngineMaths.java).
 *
 * Dispatches on structuralType:
 *   CLASSIC     → single pool/seed, AVERAGE or MAXIMUM math (unchanged).
 *   MULTI_LEVEL → tiered pools, contribution split by weight, reverse-rank RNG cascade.
 *   MUST_DROP / FREQUENCY → virtual clock; hitChance = maximumHitChance + timedChance.
 *
 * Across ALL branches we keep:
 *   - performSafetyChecks rejection (minimumWinAmount + seed < poolMin).
 *   - Isolated seed payouts (seed never added to win amount).
 *   - Wallet vs operator telemetry per contribution.
 *   - AVERAGE reset-to-min reseed vs MAXIMUM subtract-then-top-up.
 */
export function simulateEngine(
  jackpot: JackpotConfigDTO,
  wager: number,
  iterations: number,
): SimulatorResponseDTO {
  const safeIterations = Math.max(0, Math.min(Number(iterations) || 0, MAX_ITERATIONS));
  const safeWager = Number(wager) || 0;
  const structuralType = jackpot.structuralType ?? "CLASSIC";

  if (structuralType === "MULTI_LEVEL" && jackpot.tiers && jackpot.tiers.length > 0) {
    return simulateMultiLevel(jackpot, safeWager, safeIterations);
  }
  if (structuralType === "MUST_DROP" || structuralType === "FREQUENCY") {
    return simulateTimed(jackpot, safeWager, safeIterations, structuralType);
  }
  return simulateClassic(jackpot, safeWager, safeIterations);
}

// ──────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ──────────────────────────────────────────────────────────────────────────────

interface PoolRuntime {
  pool: PoolDTO;
  seed: SeedDTO;
  // mutable
  poolCurrent: number;
  seedCurrent: number;
  // derived
  poolCap: number;
  seedCap: number;
  poolMin: number;
  hasSeedConfig: boolean;
  minimumWinAmount: number;
  poolContribForCalc: number;
  seedContribForCalc: number;
  poolFromWallet: number;
  poolNotFromWallet: number;
  seedFromWallet: number;
  seedNotFromWallet: number;
  reseedAmount: number;
}

function buildRuntime(pool: PoolDTO, seed: SeedDTO, wager: number): PoolRuntime {
  const poolCurrent = Number(pool.currentAmount) || 0;
  const poolMin = Number(pool.minimumAmount) || 0;
  const poolMaxRaw = Number(pool.maximumAmount) || 0;
  const poolCap = poolMaxRaw > 0 ? poolMaxRaw : Number.POSITIVE_INFINITY;

  const minimumWinAmount = Number(pool.minimumWinAmount) || 0;

  const seedCurrent = Number(seed.currentAmount) || 0;
  const seedTargetRaw = Number(seed.targetAmount) || 0;
  const seedCap = seedTargetRaw > 0 ? seedTargetRaw : Number.POSITIVE_INFINITY;
  const hasSeedConfig = poolMin > 0;

  const poolContribAmt = Number(pool.contributionAmount) || 0;
  const seedContribAmt = Number(seed.contributionAmount) || 0;
  const poolContribForCalc =
    pool.contributionType === "FIXED" ? poolContribAmt : wager * (poolContribAmt / 100);
  const seedContribForCalc =
    seed.contributionType === "FIXED" ? seedContribAmt : wager * (seedContribAmt / 100);

  const poolOperatorShare = Math.min(100, Math.max(0, Number(pool.operatorShare) || 0)) / 100;
  const seedOperatorShare = Math.min(100, Math.max(0, Number(seed.operatorShare) || 0)) / 100;

  return {
    pool,
    seed,
    poolCurrent,
    seedCurrent,
    poolCap,
    seedCap,
    poolMin,
    hasSeedConfig,
    minimumWinAmount,
    poolContribForCalc,
    seedContribForCalc,
    poolFromWallet: poolContribForCalc * (1 - poolOperatorShare),
    poolNotFromWallet: poolContribForCalc * poolOperatorShare,
    seedFromWallet: seedContribForCalc * (1 - seedOperatorShare),
    seedNotFromWallet: seedContribForCalc * seedOperatorShare,
    reseedAmount: Math.max(0, poolMin),
  };
}

/** Reseed a runtime after a win (mirrors Java adjustPoolsLocally). */
function reseedAfterWin(
  rt: PoolRuntime,
  winAmount: number,
  hasFixedOrMaxOverride: boolean,
) {
  if (hasFixedOrMaxOverride) {
    rt.poolCurrent = rt.poolCurrent - winAmount;
    if (rt.poolCurrent < rt.poolMin) {
      const diff = rt.poolMin - rt.poolCurrent;
      if (rt.hasSeedConfig) rt.seedCurrent = Math.max(0, rt.seedCurrent - diff);
      rt.poolCurrent = rt.poolCurrent + diff;
    }
  } else {
    rt.poolCurrent = rt.reseedAmount;
    if (rt.hasSeedConfig) {
      rt.seedCurrent = Math.max(0, rt.seedCurrent - rt.reseedAmount);
    }
  }
}

function applyPayoutOverrides(rawWin: number, fixed: number, max: number): number {
  if (fixed > 0) return fixed;
  if (max > 0 && rawWin > max) return max;
  return rawWin;
}

// ──────────────────────────────────────────────────────────────────────────────
// CLASSIC (single pool/seed) — original behaviour, preserved.
// ──────────────────────────────────────────────────────────────────────────────

function simulateClassic(
  jackpot: JackpotConfigDTO,
  wager: number,
  iterations: number,
): SimulatorResponseDTO {
  const rt = buildRuntime(jackpot.pool, jackpot.seed, wager);
  const volatility = Number(jackpot.volatility) || 0;
  const winType = jackpot.type ?? "AVERAGE";
  const isAverage = winType !== "MAXIMUM";

  const fixedWinAmount = Number(jackpot.fixedWinAmount) || 0;
  const maximumWinAmountRaw =
    Number(jackpot.maximumWinAmount ?? jackpot.pool.maximumWinAmount) || 0;
  const maximumWinAmount = maximumWinAmountRaw > 0 ? maximumWinAmountRaw : 0;
  const hasFixedOrMaxOverride = fixedWinAmount > 0 || maximumWinAmount > 0;

  const cdfTarget = Number(jackpot.seed.targetAmount) || 0;
  const useFixedTarget = cdfTarget > 0;

  let walletContributions = 0;
  let operatorContributions = 0;
  let winCounter = 0;
  let winAmountCounter = 0;
  let maxWinAmount = 0;
  let rejectedByGate = 0;
  const tierCounts: Record<string, number> = {};
  const winEvents: WinEventDTO[] = [];
  const nowIso = new Date().toISOString();

  for (let i = 0; i < iterations; i++) {
    rt.poolCurrent = Math.min(rt.poolCap, rt.poolCurrent + rt.poolContribForCalc);
    walletContributions += rt.poolFromWallet;
    operatorContributions += rt.poolNotFromWallet;

    let mathContribution = rt.poolContribForCalc;
    if (rt.hasSeedConfig) {
      rt.seedCurrent = Math.min(rt.seedCap, rt.seedCurrent + rt.seedContribForCalc);
      walletContributions += rt.seedFromWallet;
      operatorContributions += rt.seedNotFromWallet;
      mathContribution += rt.seedContribForCalc;
    }

    const target = useFixedTarget ? cdfTarget : rt.poolCurrent;
    const won = isAverage
      ? calculateAverageWin(rt.poolCurrent, target, mathContribution, volatility)
      : calculateMaximumWin(rt.poolCurrent, target, mathContribution, volatility);
    if (!won) continue;

    if (rt.minimumWinAmount > 0 && rt.poolCurrent < rt.minimumWinAmount) {
      rejectedByGate++;
      continue;
    }
    if (rt.hasSeedConfig && rt.seedCurrent < rt.poolMin) {
      rejectedByGate++;
      continue;
    }

    const winAmount = applyPayoutOverrides(rt.poolCurrent, fixedWinAmount, maximumWinAmount);
    const poolBeforeWin = rt.poolCurrent;
    winCounter++;
    winAmountCounter += winAmount;
    if (winAmount > maxWinAmount) maxWinAmount = winAmount;

    const mag = Math.floor(Math.log10(Math.max(1, winAmount)));
    const tier = `1e${mag}-1e${mag + 1}`;
    tierCounts[tier] = (tierCounts[tier] ?? 0) + 1;

    if (winEvents.length < MAX_WIN_EVENTS_RETAINED) {
      winEvents.push({ iteration: i + 1, amount: winAmount, poolBeforeWin, timestamp: nowIso });
    }
    reseedAfterWin(rt, winAmount, hasFixedOrMaxOverride);
  }

  const totalWagered = wager * iterations;
  const denom = walletContributions + operatorContributions;
  const rtp = denom > 0 ? (winAmountCounter / denom) * 100 : 0;

  return {
    iterations,
    wager,
    totalWagered,
    totalContributions: walletContributions,
    walletContributions,
    operatorContributions,
    winCounter,
    rejectedByGate,
    winAmountCounter,
    rtp,
    finalPool: rt.poolCurrent,
    finalSeed: rt.seedCurrent,
    winEvents,
    maxWinAmount,
    tierCounts,
    structuralType: "CLASSIC",
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// MULTI_LEVEL — mirrors JackpotEngineMaths.calculateWin MULTI_LEVEL branch +
// JackpotEngineSimulator loop with per-tier weight distribution.
// ──────────────────────────────────────────────────────────────────────────────

function simulateMultiLevel(
  jackpot: JackpotConfigDTO,
  wager: number,
  iterations: number,
): SimulatorResponseDTO {
  const liveTiers: TierDTO[] = [...(jackpot.tiers ?? [])]
    .map((tier) => ({
      ...tier,
      pool: { ...tier.pool },
      seed: { ...tier.seed },
    }))
    .sort((a, b) => b.multiLevelTier - a.multiLevelTier);
  if (liveTiers.length === 0) return simulateClassic(jackpot, wager, iterations);

  const globalVolatility = Number(jackpot.volatility) || 0;
  const winType = jackpot.type ?? "AVERAGE";
  const isAverage = winType !== "MAXIMUM";
  const fixedWinAmount = Number(jackpot.fixedWinAmount) || 0;
  const globalMaximumWinAmount = Number(jackpot.maximumWinAmount) || 0;
  const hasFixedOrMaxOverride = fixedWinAmount > 0 || globalMaximumWinAmount > 0;

  const tierStates = liveTiers.map((tier) => {
    const tierRuntime = buildRuntime(tier.pool, tier.seed, wager);
    return {
      tier,
      label: tier.label ?? defaultTierLabel(tier.multiLevelTier),
      weight: Math.max(0, Math.min(1, Number(tier.multiLevelWeight) || 0)),
      runtime: tierRuntime,
      winCounter: 0,
      winAmountCounter: 0,
      maxWinAmount: 0,
      rejectedByGate: 0,
      totalContribution: 0,
    };
  });

  let walletContributions = 0;
  let operatorContributions = 0;
  let winCounter = 0;
  let winAmountCounter = 0;
  let maxWinAmount = 0;
  let rejectedByGate = 0;
  const tierCounts: Record<string, number> = {};
  const winEvents: WinEventDTO[] = [];
  const nowIso = new Date().toISOString();
  let engineScopeAudit: EngineScopeAuditDTO | undefined;

  for (let i = 0; i < iterations; i++) {
    for (const tierState of tierStates) {
      const tierRuntime = tierState.runtime;
      const tierPool = tierState.tier.pool;
      const tierSeed = tierState.tier.seed;
      const tierWeight = tierState.weight;

      const poolContributionBase =
        tierPool.contributionType === "FIXED"
          ? Number(tierPool.contributionAmount) || 0
          : wager * ((Number(tierPool.contributionAmount) || 0) / 100);
      const seedContributionBase =
        tierSeed.contributionType === "FIXED"
          ? Number(tierSeed.contributionAmount) || 0
          : wager * ((Number(tierSeed.contributionAmount) || 0) / 100);

      const localPoolContribution = poolContributionBase * tierWeight;
      const localSeedContribution = seedContributionBase * tierWeight;

      tierRuntime.poolCurrent = Math.min(tierRuntime.poolCap, tierRuntime.poolCurrent + localPoolContribution);
      tierState.totalContribution += localPoolContribution;

      const poolOperatorShare = Math.min(100, Math.max(0, Number(tierPool.operatorShare) || 0)) / 100;
      walletContributions += localPoolContribution * (1 - poolOperatorShare);
      operatorContributions += localPoolContribution * poolOperatorShare;

      if (tierRuntime.hasSeedConfig && localSeedContribution > 0) {
        tierRuntime.seedCurrent = Math.min(tierRuntime.seedCap, tierRuntime.seedCurrent + localSeedContribution);
        tierState.totalContribution += localSeedContribution;

        const seedOperatorShare = Math.min(100, Math.max(0, Number(tierSeed.operatorShare) || 0)) / 100;
        walletContributions += localSeedContribution * (1 - seedOperatorShare);
        operatorContributions += localSeedContribution * seedOperatorShare;
      }
    }

    for (const tierState of tierStates) {
      const tierInstance = tierState.tier;
      const tierRuntime = tierState.runtime;
      const tierPool = tierInstance.pool;
      const tierWeight = tierState.weight;

      const tierContributionBase =
        tierPool.contributionType === "FIXED"
          ? Number(tierPool.contributionAmount) || 0
          : wager * ((Number(tierPool.contributionAmount) || 0) / 100);
      const localMathContribution = tierContributionBase * tierWeight;
      if (localMathContribution <= 0) continue;

      const tierTargetAmount = Number(tierPool.targetAmount) || 0;
      const tierMinimumWinAmount = Number(tierPool.minimumWinAmount) || 0;
      const tierVolatility = globalVolatility;
      const cdfTarget =
        tierTargetAmount > 0
          ? tierTargetAmount
          : globalMaximumWinAmount > 0
            ? globalMaximumWinAmount
            : tierRuntime.poolCurrent;

      if (!engineScopeAudit && i === 0 && tierInstance.multiLevelTier === 1) {
        engineScopeAudit = {
          spinIndex: 0,
          tier: tierInstance.multiLevelTier,
          label: tierState.label,
          runtimeTargetAmount: cdfTarget,
          runtimeMinimumWinAmount: tierMinimumWinAmount,
        };
      }

      const didHit = isAverage
        ? calculateAverageWin(tierRuntime.poolCurrent, cdfTarget, localMathContribution, tierVolatility)
        : calculateMaximumWin(tierRuntime.poolCurrent, cdfTarget, localMathContribution, tierVolatility);
      if (!didHit) continue;

      if (tierMinimumWinAmount > 0 && tierRuntime.poolCurrent < tierMinimumWinAmount) {
        tierState.rejectedByGate++;
        rejectedByGate++;
        continue;
      }
      if (tierRuntime.hasSeedConfig && tierRuntime.seedCurrent < tierRuntime.poolMin) {
        tierState.rejectedByGate++;
        rejectedByGate++;
        continue;
      }

      const tierMaximumWinAmount = Number(tierPool.maximumWinAmount) || 0;
      const payoutCap = tierMaximumWinAmount > 0 ? tierMaximumWinAmount : globalMaximumWinAmount;
      const winAmount = applyPayoutOverrides(tierRuntime.poolCurrent, fixedWinAmount, payoutCap);
      const poolBeforeWin = tierRuntime.poolCurrent;

      tierState.winCounter++;
      tierState.winAmountCounter += winAmount;
      if (winAmount > tierState.maxWinAmount) tierState.maxWinAmount = winAmount;

      winCounter++;
      winAmountCounter += winAmount;
      if (winAmount > maxWinAmount) maxWinAmount = winAmount;

      const tierKey = `T${tierInstance.multiLevelTier}-${tierState.label}`;
      tierCounts[tierKey] = (tierCounts[tierKey] ?? 0) + 1;

      if (winEvents.length < MAX_WIN_EVENTS_RETAINED) {
        winEvents.push({
          iteration: i + 1,
          amount: winAmount,
          poolBeforeWin,
          timestamp: nowIso,
          winningTier: tierInstance.multiLevelTier,
        });
      }

      reseedAfterWin(tierRuntime, winAmount, hasFixedOrMaxOverride || payoutCap > 0);
      break;
    }
  }

  const totalWagered = wager * iterations;
  const totalContributions = walletContributions;
  const denominator = walletContributions + operatorContributions;
  const rtp = denominator > 0 ? (winAmountCounter / denominator) * 100 : 0;

  const tierResults: TierResultDTO[] = tierStates
    .slice()
    .sort((a, b) => a.tier.multiLevelTier - b.tier.multiLevelTier)
    .map((tierState) => ({
      tier: tierState.tier.multiLevelTier,
      label: tierState.label,
      winCounter: tierState.winCounter,
      winAmountCounter: tierState.winAmountCounter,
      maxWinAmount: tierState.maxWinAmount,
      finalPool: tierState.runtime.poolCurrent,
      finalSeed: tierState.runtime.seedCurrent,
      rejectedByGate: tierState.rejectedByGate,
      totalContribution: tierState.totalContribution,
    }));

  const finalPool = tierResults.reduce((sum, tierResult) => sum + tierResult.finalPool, 0);
  const finalSeed = tierResults.reduce((sum, tierResult) => sum + tierResult.finalSeed, 0);

  return {
    iterations,
    wager,
    totalWagered,
    totalContributions,
    walletContributions,
    operatorContributions,
    winCounter,
    rejectedByGate,
    winAmountCounter,
    rtp,
    finalPool,
    finalSeed,
    winEvents,
    maxWinAmount,
    tierCounts,
    tierResults,
    engineScopeAudit,
    structuralType: "MULTI_LEVEL",
  };
}

function defaultTierLabel(tier: number): string {
  return ["Mini", "Minor", "Major", "Mega"][Math.max(0, Math.min(3, tier - 1))] ?? `Tier ${tier}`;
}

// ──────────────────────────────────────────────────────────────────────────────
// MUST_DROP / FREQUENCY — virtual-clock timed maximum win.
// Mirrors JackpotEngineMaths.calculateTimedMaximumWin, with the wall clock
// replaced by iteration-index → minute mapping per the spec.
// ──────────────────────────────────────────────────────────────────────────────

function simulateTimed(
  jackpot: JackpotConfigDTO,
  wager: number,
  iterations: number,
  structuralType: "MUST_DROP" | "FREQUENCY",
): SimulatorResponseDTO {
  const rt = buildRuntime(jackpot.pool, jackpot.seed, wager);
  const volatility = Number(jackpot.volatility) || 0;

  const fixedWinAmount = Number(jackpot.fixedWinAmount) || 0;
  const maximumWinAmountRaw =
    Number(jackpot.maximumWinAmount ?? jackpot.pool.maximumWinAmount) || 0;
  const maximumWinAmount = maximumWinAmountRaw > 0 ? maximumWinAmountRaw : 0;
  const hasFixedOrMaxOverride = fixedWinAmount > 0 || maximumWinAmount > 0;

  const lifespanMinutes = Math.max(1, Number(jackpot.timed?.lifespanMinutes) || 1440);
  // Java line 357-358: volatility multiplier for timed term.
  const timedVolatility = volatility ? volatility * AVERAGE_VOLATILITY_MULTIPLIER : DEFAULT_AVERAGE_VOLATILITY_EXPONENT;
  // Java line 365: random / maximumWinAmount; fall back to pool current if unset.
  const denomTarget = maximumWinAmount > 0 ? maximumWinAmount : Math.max(2, rt.poolCurrent);

  let walletContributions = 0;
  let operatorContributions = 0;
  let winCounter = 0;
  let winAmountCounter = 0;
  let maxWinAmount = 0;
  let rejectedByGate = 0;
  const tierCounts: Record<string, number> = {};
  const winEvents: WinEventDTO[] = [];
  const nowIso = new Date().toISOString();

  for (let i = 0; i < iterations; i++) {
    rt.poolCurrent = Math.min(rt.poolCap, rt.poolCurrent + rt.poolContribForCalc);
    walletContributions += rt.poolFromWallet;
    operatorContributions += rt.poolNotFromWallet;

    let mathContribution = rt.poolContribForCalc;
    if (rt.hasSeedConfig) {
      rt.seedCurrent = Math.min(rt.seedCap, rt.seedCurrent + rt.seedContribForCalc);
      walletContributions += rt.seedFromWallet;
      operatorContributions += rt.seedNotFromWallet;
      mathContribution += rt.seedContribForCalc;
    }

    // Virtual clock — iteration index → minute index, linearly across lifespan.
    const currentMinute = iterations > 1 ? Math.floor((i / (iterations - 1)) * lifespanMinutes) : lifespanMinutes;
    const percentageIntoGame = Math.max(0, Math.min(1, currentMinute / lifespanMinutes));

    // Maximum-style hit chance against the live pool, max target = denomTarget.
    const maximumHitChance = calculateMaximumHitChance(
      rt.poolCurrent,
      denomTarget,
      mathContribution,
      volatility,
    );
    // Timed term per Java line 359.
    const totalTimedChance = Math.pow(percentageIntoGame, timedVolatility) * mathContribution;
    const hitChance = totalTimedChance + maximumHitChance;

    const random = Math.random() * denomTarget;
    const result = random / denomTarget;
    if (result >= hitChance) continue;

    if (rt.minimumWinAmount > 0 && rt.poolCurrent < rt.minimumWinAmount) {
      rejectedByGate++;
      continue;
    }
    if (rt.hasSeedConfig && rt.seedCurrent < rt.poolMin) {
      rejectedByGate++;
      continue;
    }

    const winAmount = applyPayoutOverrides(rt.poolCurrent, fixedWinAmount, maximumWinAmount);
    const poolBeforeWin = rt.poolCurrent;
    winCounter++;
    winAmountCounter += winAmount;
    if (winAmount > maxWinAmount) maxWinAmount = winAmount;

    const mag = Math.floor(Math.log10(Math.max(1, winAmount)));
    const tier = `1e${mag}-1e${mag + 1}`;
    tierCounts[tier] = (tierCounts[tier] ?? 0) + 1;

    if (winEvents.length < MAX_WIN_EVENTS_RETAINED) {
      winEvents.push({ iteration: i + 1, amount: winAmount, poolBeforeWin, timestamp: nowIso });
    }
    reseedAfterWin(rt, winAmount, hasFixedOrMaxOverride);
  }

  const totalWagered = wager * iterations;
  const denom = walletContributions + operatorContributions;
  const rtp = denom > 0 ? (winAmountCounter / denom) * 100 : 0;

  return {
    iterations,
    wager,
    totalWagered,
    totalContributions: walletContributions,
    walletContributions,
    operatorContributions,
    winCounter,
    rejectedByGate,
    winAmountCounter,
    rtp,
    finalPool: rt.poolCurrent,
    finalSeed: rt.seedCurrent,
    winEvents,
    maxWinAmount,
    tierCounts,
    structuralType,
  };
}
