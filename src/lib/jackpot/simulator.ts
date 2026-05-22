import {
  calculateAverageHitChance,
  calculateAverageWin,
  calculateMaximumHitChance,
  calculateMaximumWin,
  fixedOddsHitChance,
  type RngSource,
} from "./math";
import type {
  ContributionSplitDTO,
  EngineScopeAuditDTO,
  JackpotConfigDTO,
  PoolDTO,
  SeedDTO,
  SimulatorResponseDTO,
  WinEventDTO,
} from "./types";

const MAX_ITERATIONS = 10_000_000;
const MAX_WIN_EVENTS_RETAINED = 500;

/**
 * Java parity notes (see JackpotEngineSimulator.java + JackpotEngineMaths.java).
 *
 * Dispatches on structuralType:
 *   CLASSIC     → single pool/seed, AVERAGE or MAXIMUM math (unchanged).
 *   MUST_DROP / FREQUENCY → virtual clock; hitChance = maximumHitChance + timedChance.
 *
 * Across ALL branches we keep:
 *   - performSafetyChecks rejection (minimumWinAmount + seed < poolMin).
 *   - Isolated seed payouts (seed never added to win amount).
 *   - Wallet vs operator telemetry per contribution.
 *   - AVERAGE reset-to-min reseed vs MAXIMUM subtract-then-top-up.
 *
 * Engine v2 additions (opt-in, back-compat):
 *   - 3-way contribution split (Pool / Seed / House) via jackpot.contribution.
 *     When absent, legacy pool.contributionAmount / seed.contributionAmount
 *     are used as before.
 *   - Fixed-odds trigger probability override (jackpot.triggerOdds). When > 0,
 *     replaces AVERAGE/MAXIMUM curve in CLASSIC, and replaces maximumHitChance
 *     baseline in the timed loop.
 *   - External RNG injection: top-level simulate functions accept an optional
 *     `rng: RngSource` that flows through every win-evaluation call.
 */
export function simulateEngine(
  jackpot: JackpotConfigDTO,
  wager: number,
  iterations: number,
  rng: RngSource = Math.random,
): SimulatorResponseDTO {
  const safeIterations = Math.max(0, Math.min(Number(iterations) || 0, MAX_ITERATIONS));
  const safeWager = Number(wager) || 0;
  const structuralType = jackpot.structuralType ?? "CLASSIC";

  if (structuralType === "MUST_DROP" || structuralType === "FREQUENCY") {
    return simulateTimed(jackpot, safeWager, safeIterations, structuralType, rng);
  }
  return simulateClassic(jackpot, safeWager, safeIterations, rng);
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
  /** Per-spin House cut (split mode). */
  houseContribForCalc: number;
}

/** Resolve per-spin contribution amounts given the optional 3-way split.
 *  Returns derived pool / seed / house amounts in currency units. */
function resolveContribution(
  contribution: ContributionSplitDTO | undefined,
  fallbackPool: { type: string | undefined; amount: number },
  fallbackSeed: { type: string | undefined; amount: number },
  wager: number,
): { pool: number; seed: number; house: number } {
  if (contribution && contribution.mode === "split") {
    const type = contribution.totalContributionType ?? "FIXED";
    const total = Number(contribution.totalContributionAmount) || 0;
    const totalForCalc = type === "FIXED" ? total : wager * (total / 100);
    const pw = Math.max(0, Number(contribution.poolWeight) || 0) / 100;
    const sw = Math.max(0, Number(contribution.seedWeight) || 0) / 100;
    const hw = Math.max(0, Number(contribution.houseWeight) || 0) / 100;
    return {
      pool: totalForCalc * pw,
      seed: totalForCalc * sw,
      house: totalForCalc * hw,
    };
  }
  const pool =
    fallbackPool.type === "FIXED" ? fallbackPool.amount : wager * (fallbackPool.amount / 100);
  const seed =
    fallbackSeed.type === "FIXED" ? fallbackSeed.amount : wager * (fallbackSeed.amount / 100);
  return { pool, seed, house: 0 };
}

function buildRuntime(
  pool: PoolDTO,
  seed: SeedDTO,
  wager: number,
  contribution?: ContributionSplitDTO,
): PoolRuntime {
  const poolCurrent = Number(pool.currentAmount) || 0;
  const poolMin = Number(pool.minimumAmount) || 0;
  const poolMaxRaw = Number(pool.maximumAmount) || 0;
  const poolCap = poolMaxRaw > 0 ? poolMaxRaw : Number.POSITIVE_INFINITY;

  const minimumWinAmount = Number(pool.minimumWinAmount) || 0;

  const seedCurrent = Number(seed.currentAmount) || 0;
  const seedTargetRaw = Number(seed.targetAmount) || 0;
  const seedCap = seedTargetRaw > 0 ? seedTargetRaw : Number.POSITIVE_INFINITY;
  const hasSeedConfig = poolMin > 0;

  const { pool: poolContribForCalc, seed: seedContribForCalc, house: houseContribForCalc } =
    resolveContribution(
      contribution,
      { type: pool.contributionType, amount: Number(pool.contributionAmount) || 0 },
      { type: seed.contributionType, amount: Number(seed.contributionAmount) || 0 },
      wager,
    );

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
    houseContribForCalc,
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

/** Single uniform compare for the curve helpers — mirrors the random-vs-target
 *  shape from the math module so the threshold can be inspected separately. */
function rollAgainstHitChance(rng: RngSource, hitChance: number, safeTarget: number): boolean {
  const random = rng() * safeTarget;
  const result = random / safeTarget;
  return result < hitChance;
}

// ──────────────────────────────────────────────────────────────────────────────
// CLASSIC (single pool/seed) — original behaviour, preserved.
// ──────────────────────────────────────────────────────────────────────────────

function simulateClassic(
  jackpot: JackpotConfigDTO,
  wager: number,
  iterations: number,
  rng: RngSource,
): SimulatorResponseDTO {
  const rt = buildRuntime(jackpot.pool, jackpot.seed, wager, jackpot.contribution);
  const volatility = Number(jackpot.volatility) || 0;
  const winType = jackpot.type ?? "AVERAGE";
  const isAverage = winType !== "MAXIMUM";
  const triggerOdds = Number(jackpot.triggerOdds) || 0;

  const fixedWinAmount = Number(jackpot.fixedWinAmount) || 0;
  const maximumWinAmountRaw =
    Number(jackpot.maximumWinAmount ?? jackpot.pool.maximumWinAmount) || 0;
  const maximumWinAmount = maximumWinAmountRaw > 0 ? maximumWinAmountRaw : 0;
  const hasFixedOrMaxOverride = fixedWinAmount > 0 || maximumWinAmount > 0;

  const cdfTarget = Number(jackpot.seed.targetAmount) || 0;
  const useFixedTarget = cdfTarget > 0;

  let walletContributions = 0;
  let operatorContributions = 0;
  let houseContributions = 0;
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
    houseContributions += rt.houseContribForCalc;

    let mathContribution = rt.poolContribForCalc;
    if (rt.hasSeedConfig) {
      rt.seedCurrent = Math.min(rt.seedCap, rt.seedCurrent + rt.seedContribForCalc);
      walletContributions += rt.seedFromWallet;
      operatorContributions += rt.seedNotFromWallet;
      mathContribution += rt.seedContribForCalc;
    }

    const target = useFixedTarget ? cdfTarget : rt.poolCurrent;
    let won: boolean;
    if (triggerOdds > 0) {
      const safeTarget = Math.max(target, 2.0);
      const hitChance = fixedOddsHitChance(triggerOdds, mathContribution);
      won = rollAgainstHitChance(rng, hitChance, safeTarget);
    } else if (isAverage) {
      won = calculateAverageWin(rt.poolCurrent, target, mathContribution, volatility, rng);
    } else {
      won = calculateMaximumWin(rt.poolCurrent, target, mathContribution, volatility, rng);
    }
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
  const houseRatio = totalWagered > 0 ? houseContributions / totalWagered : 0;

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
    houseContributions,
    houseRatio,
  };
}


// ──────────────────────────────────────────────────────────────────────────────
// MUST_DROP / FREQUENCY — real UTC-clock timed maximum win.
// Mirrors JackpotEngineMaths.calculateTimedMaximumWin verbatim.
// ──────────────────────────────────────────────────────────────────────────────

/** Banker's rounding (HALF_EVEN) to N decimal places — matches Java BigDecimal. */
function roundHalfEven(value: number, decimals: number): number {
  if (!Number.isFinite(value)) return value;
  const factor = Math.pow(10, decimals);
  const scaled = value * factor;
  const floor = Math.floor(scaled);
  const diff = scaled - floor;
  let rounded: number;
  if (diff > 0.5) rounded = floor + 1;
  else if (diff < 0.5) rounded = floor;
  else rounded = floor % 2 === 0 ? floor : floor + 1; // tie → even
  return rounded / factor;
}

/** Resolve [start, end] UTC window per MustDropFrequencyType. */
function resolveTimedWindow(
  timed: { mustDropPeriod?: 1 | 2 | 3 | 4; startDate?: string; endDate?: string } | undefined,
  now: Date,
): { start: number; end: number } {
  const period = timed?.mustDropPeriod ?? 2; // default DAILY
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();

  if (period === 1) {
    const start = timed?.startDate ? Date.parse(timed.startDate) : Date.UTC(y, m, d, 0, 0, 0, 0);
    const end = timed?.endDate ? Date.parse(timed.endDate) : Date.UTC(y, m, d, 23, 59, 59, 999);
    return { start, end };
  }
  if (period === 2) {
    return {
      start: Date.UTC(y, m, d, 0, 0, 0, 0),
      end: Date.UTC(y, m, d, 23, 59, 59, 999),
    };
  }
  if (period === 3) {
    const dow = now.getUTCDay();
    const sunday = Date.UTC(y, m, d - dow, 0, 0, 0, 0);
    const saturday = Date.UTC(y, m, d + (6 - dow), 23, 59, 59, 999);
    return { start: sunday, end: saturday };
  }
  const firstOfMonth = Date.UTC(y, m, 1, 0, 0, 0, 0);
  const lastOfMonth = Date.UTC(y, m + 1, 0, 23, 59, 59, 999);
  return { start: firstOfMonth, end: lastOfMonth };
}

function simulateTimed(
  jackpot: JackpotConfigDTO,
  wager: number,
  iterations: number,
  structuralType: "MUST_DROP" | "FREQUENCY",
  rng: RngSource,
): SimulatorResponseDTO {
  const rt = buildRuntime(jackpot.pool, jackpot.seed, wager, jackpot.contribution);
  const volatility = Number(jackpot.volatility) || 0;
  const triggerOdds = Number(jackpot.triggerOdds) || 0;

  const fixedWinAmount = Number(jackpot.fixedWinAmount) || 0;
  const maximumWinAmountRaw =
    Number(jackpot.maximumWinAmount ?? jackpot.pool.maximumWinAmount) || 0;
  const maximumWinAmount = maximumWinAmountRaw > 0 ? maximumWinAmountRaw : 0;
  const hasFixedOrMaxOverride = fixedWinAmount > 0 || maximumWinAmount > 0;

  const timedVolatility = volatility > 0 ? volatility * 5 : 50;
  const maxVolatility = volatility > 0 ? volatility * 15 : 75;

  const rngDenom = maximumWinAmount > 0 ? maximumWinAmount : Math.max(2, rt.poolCurrent);

  const rawTarget =
    Number(rt.pool.targetAmount) > 0
      ? Number(rt.pool.targetAmount)
      : maximumWinAmount > 0
        ? maximumWinAmount
        : 0;
  const logTarget = rawTarget < 2 ? 2 : rawTarget;

  let walletContributions = 0;
  let operatorContributions = 0;
  let houseContributions = 0;
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
    houseContributions += rt.houseContribForCalc;

    let mathContribution = rt.poolContribForCalc;
    if (rt.hasSeedConfig) {
      rt.seedCurrent = Math.min(rt.seedCap, rt.seedCurrent + rt.seedContribForCalc);
      walletContributions += rt.seedFromWallet;
      operatorContributions += rt.seedNotFromWallet;
      mathContribution += rt.seedContribForCalc;
    }

    const nowMs = Date.now();
    const { start, end } = resolveTimedWindow(jackpot.timed, new Date(nowMs));
    const totalMinutes = (end - start) / 1000 / 60;
    const currentMinute = (nowMs - start) / 1000 / 60;
    const rawPct = totalMinutes > 0 ? currentMinute / totalMinutes : 1;
    const percentageIntoGame = roundHalfEven(Math.min(Math.max(rawPct, 0), 1), 2);

    const totalTimedChance = Math.pow(percentageIntoGame, timedVolatility) * mathContribution;

    let maximumHitChance: number;
    if (triggerOdds > 0) {
      // Fixed-odds baseline; the time-decay still scales on top.
      maximumHitChance = fixedOddsHitChance(triggerOdds, mathContribution);
    } else {
      const currentAmount = Math.max(1, rt.poolCurrent);
      const logValue = Math.log(currentAmount) / Math.log(logTarget);
      const baseExponent = Math.pow(logValue, maxVolatility);
      maximumHitChance = baseExponent * mathContribution * 100;
    }

    const hitChance = totalTimedChance + maximumHitChance;

    const randomValue = Math.floor(rng() * rngDenom);
    const result = randomValue / rngDenom;
    if (!(result < hitChance)) continue;

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
  const houseRatio = totalWagered > 0 ? houseContributions / totalWagered : 0;

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
    houseContributions,
    houseRatio,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Phase 3 — relational group fan-out simulator.
// Posts batched concurrent spins to /api/v1/event/bet with `groupId` and
// aggregates the returned perJackpot[] slices into a GroupSimResult roll-up
// matching the legacy multi-level chart shape so existing UI keeps working.
// ──────────────────────────────────────────────────────────────────────────────

export interface GroupTierRollupDTO {
  tierRank: number;
  jackpotId: number;
  jackpotName: string;
  totalPool: number;
  totalSeed: number;
  totalHouse: number;
  totalContribution: number;
  wins: number;
  totalWinAmount: number;
  maxWinAmount: number;
}

export interface GroupSimResult {
  groupId: number;
  iterations: number;
  completed: number;
  failed: number;
  wagerPerSpin: number;
  totalWagered: number;
  totalContribution: number;
  totalHouse: number;
  winCounter: number;
  winAmountCounter: number;
  perTier: GroupTierRollupDTO[];
  winEvents: WinEventDTO[];
}

export interface SimulateGroupOpts {
  iterations: number;
  wagerPerSpin: number;
  /** Chunk size for concurrent POST batches. Default 25. */
  concurrency?: number;
  /** Base URL override (default: window.location.origin or ''). */
  baseUrl?: string;
  /** INTERNAL_SERVICE_SECRET for the internal handshake. */
  internalSecret?: string;
  gameId?: string;
  onProgress?: (done: number, total: number) => void;
  signal?: AbortSignal;
}

export async function simulateGroup(
  groupId: number,
  brandId: number,
  opts: SimulateGroupOpts,
): Promise<GroupSimResult> {
  const iterations = Math.max(0, Math.min(Number(opts.iterations) || 0, MAX_ITERATIONS));
  const wager = Number(opts.wagerPerSpin) || 0;
  const concurrency = Math.max(1, Math.min(Number(opts.concurrency) || 25, 100));
  const baseUrl = opts.baseUrl ?? (typeof window !== "undefined" ? window.location.origin : "");
  const gameId = opts.gameId ?? "sim";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-brand-id": String(brandId),
  };
  if (opts.internalSecret) {
    headers["X-Internal-Service-Secret"] = opts.internalSecret;
  }

  const perTier = new Map<number, GroupTierRollupDTO>();
  const winEvents: WinEventDTO[] = [];
  let completed = 0;
  let failed = 0;
  let totalContribution = 0;
  let totalHouse = 0;
  let winCounter = 0;
  let winAmountCounter = 0;

  async function postOne(i: number): Promise<void> {
    if (opts.signal?.aborted) return;
    const txId = `sim-${groupId}-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 10)}`;
    try {
      const res = await fetch(`${baseUrl}/api/v1/event/bet`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          transactionId: txId,
          wager,
          gameId,
          groupId,
        }),
        signal: opts.signal,
      });
      if (!res.ok) {
        failed++;
        return;
      }
      const data = (await res.json()) as {
        perJackpot?: Array<{
          jackpotId: number;
          jackpotName: string;
          contribution: { pool: number; seed: number; house: number };
          totalContribution: number;
        }>;
        totalContribution?: number;
        contribution?: { pool: number; seed: number; house: number };
        win?: {
          jackpotId?: number;
          tierRank?: number;
          amount?: number;
        } | null;
      };
      const list = Array.isArray(data.perJackpot) ? data.perJackpot : [];
      list.forEach((entry, idx) => {
        const tierRank = idx + 1;
        const prev = perTier.get(entry.jackpotId) ?? {
          tierRank,
          jackpotId: entry.jackpotId,
          jackpotName: entry.jackpotName,
          totalPool: 0,
          totalSeed: 0,
          totalHouse: 0,
          totalContribution: 0,
          wins: 0,
          totalWinAmount: 0,
          maxWinAmount: 0,
        };
        prev.totalPool += entry.contribution.pool || 0;
        prev.totalSeed += entry.contribution.seed || 0;
        prev.totalHouse += entry.contribution.house || 0;
        prev.totalContribution += entry.totalContribution || 0;
        perTier.set(entry.jackpotId, prev);
      });
      totalContribution += Number(data.totalContribution) || 0;
      totalHouse += Number(data.contribution?.house) || 0;
      if (data.win && typeof data.win.amount === "number") {
        winCounter++;
        winAmountCounter += data.win.amount;
        const target = data.win.jackpotId != null ? perTier.get(data.win.jackpotId) : undefined;
        if (target) {
          target.wins++;
          target.totalWinAmount += data.win.amount;
          if (data.win.amount > target.maxWinAmount) target.maxWinAmount = data.win.amount;
        }
        if (winEvents.length < MAX_WIN_EVENTS_RETAINED) {
          winEvents.push({
            iteration: i + 1,
            amount: data.win.amount,
            poolBeforeWin: 0,
            timestamp: new Date().toISOString(),
            winningTier: data.win.tierRank,
          });
        }
      }
      completed++;
    } catch {
      failed++;
    }
  }

  for (let start = 0; start < iterations; start += concurrency) {
    if (opts.signal?.aborted) break;
    const batch: Promise<void>[] = [];
    const end = Math.min(start + concurrency, iterations);
    for (let i = start; i < end; i++) batch.push(postOne(i));
    await Promise.all(batch);
    opts.onProgress?.(completed + failed, iterations);
  }

  return {
    groupId,
    iterations,
    completed,
    failed,
    wagerPerSpin: wager,
    totalWagered: wager * completed,
    totalContribution,
    totalHouse,
    winCounter,
    winAmountCounter,
    perTier: Array.from(perTier.values()).sort((a, b) => a.tierRank - b.tierRank),
    winEvents,
  };
}
