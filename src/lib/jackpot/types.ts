// Java BigDecimal / Long -> number, Instant / ZonedDateTime -> ISO-8601 string
export type JackpotKind = "classic" | "frequency" | "must_drop" | "multi_level";

export interface JackpotDTO {
  id: number;
  name: string;
  enabled: boolean;
  poolBalance: number;
  seedAmount: number;
  contributionRate: number;
  triggerThreshold: number;
  brandId: string;
  createdAt: string;
  updatedAt: string;
  // Optional, persisted into jackpots.volatility / jackpots.trigger_condition
  volatility?: number;
  jackpotType?: JackpotKind;
  config?: Record<string, any>;
}

export interface TopupDTO {
  jackpotId: number;
  amount: number;
  backofficeUser: string;
  isSeed: boolean;
}

export interface SimulatorDTO {
  jackpotId: number;
  iterations: number;
  wager: number;
  rngSeed?: number;
}

// --- Rich engine config used by the math/simulation engine ---

export type ContributionType = "PERCENTAGE" | "FIXED";
/** Win math model — orthogonal to structural type. */
export type JackpotWinType = "AVERAGE" | "MAXIMUM";
/** Structural pipeline — selects engine branch (mirror of Java JackpotType). */
export type JackpotStructuralType = "CLASSIC" | "MULTI_LEVEL" | "MUST_DROP" | "FREQUENCY";

export interface PoolDTO {
  currentAmount: number;
  minimumAmount: number;          // reseed floor / Java pool.minimumAmount
  maximumAmount: number;          // legacy slot — no longer the CDF trigger
  minimumWinAmount?: number;      // Java jackpot.minimumWinAmount (rejection gate)
  maximumWinAmount?: number;      // Java jackpot.maximumWinAmount (payout cap)
  /** Per-tier CDF distribution center (Java pool.targetAmount). When set, the
   *  math strategy uses this instead of the global maximumWinAmount/poolCurrent. */
  targetAmount?: number;
  contributionAmount: number;
  contributionType: ContributionType;
  /** 0–100. Operator-funded share of each pool contribution (BrandDTO mirror). */
  operatorShare?: number;
}

export interface SeedDTO {
  currentAmount: number;
  targetAmount: number;
  contributionAmount: number;
  contributionType: ContributionType;
  /** 0–100. Operator-funded share of each seed contribution. */
  operatorShare?: number;
}

/** One tier in a MULTI_LEVEL jackpot (mirrors Java Pool+Seed with multiLevelTier/Weight). */
export interface TierDTO {
  /** Tier rank — 1 (Mini) … 4 (Mega). Higher rank evaluated FIRST per Java sort. */
  multiLevelTier: number;
  /** 0–1. Fraction of the global per-bet contribution routed to this tier. */
  multiLevelWeight: number;
  /** Human-readable label (Mini / Minor / Major / Mega). */
  label?: string;
  pool: PoolDTO;
  seed: SeedDTO;
}

/** MUST_DROP / FREQUENCY timed config (virtual-clock mapping). */
export interface TimedConfigDTO {
  /** Total minutes of simulated life. Hourly=60, Daily=1440, Weekly=10080, Monthly=43200. */
  lifespanMinutes: number;
  /** Mirror Java MustDropFrequencyType: 1=SINGLE 2=DAILY 3=WEEKLY 4=MONTHLY. */
  mustDropPeriod?: 1 | 2 | 3 | 4;
}

export interface JackpotConfigDTO {
  id: number;
  name: string;
  enabled?: boolean;
  brandId?: string;
  /** Win math model. */
  type: JackpotWinType;
  /** Structural pipeline. Defaults to "CLASSIC" when omitted (back-compat). */
  structuralType?: JackpotStructuralType;
  volatility: number;
  pool: PoolDTO;
  seed: SeedDTO;
  /** Present when structuralType === "MULTI_LEVEL". 2–4 entries. */
  tiers?: TierDTO[];
  /** Present when structuralType === "MUST_DROP" | "FREQUENCY". */
  timed?: TimedConfigDTO;
  fixedWinAmount?: number;
  maximumWinAmount?: number;
}

export interface WinEventDTO {
  iteration: number;
  amount: number;
  poolBeforeWin: number;
  timestamp: string;
  /** Multi-level only — tier rank that produced the win. */
  winningTier?: number;
}

/** Per-tier roll-up for MULTI_LEVEL simulations. */
export interface TierResultDTO {
  tier: number;
  label: string;
  winCounter: number;
  winAmountCounter: number;
  maxWinAmount: number;
  finalPool: number;
  finalSeed: number;
  rejectedByGate: number;
  totalContribution: number;
}

export interface EngineScopeAuditDTO {
  spinIndex: number;
  tier: number;
  label: string;
  runtimeTargetAmount: number;
  runtimeMinimumWinAmount: number;
}

export interface SimulatorResponseDTO {
  iterations: number;
  wager: number;
  totalWagered: number;
  /** Java: poolContributionCounter + seedContributionCounter (fromWallet only). */
  totalContributions: number;
  /** Java: poolContributionCounter + seedContributionCounter (fromWallet only). */
  walletContributions: number;
  /** Java: operatorContributionCounter (notFromWallet). */
  operatorContributions: number;
  winCounter: number;
  /** Wins that triggered the RNG but were rejected by performSafetyChecks. */
  rejectedByGate: number;
  winAmountCounter: number;
  rtp: number;
  finalPool: number;
  finalSeed: number;
  winEvents: WinEventDTO[];
  maxWinAmount?: number;
  tierCounts?: Record<string, number>;
  /** Present for MULTI_LEVEL — one entry per tier. */
  tierResults?: TierResultDTO[];
  /** Present when the engine exposes captured runtime scope for debugging. */
  engineScopeAudit?: EngineScopeAuditDTO;
  /** Echo of the engine branch that ran (for dashboard labelling). */
  structuralType?: JackpotStructuralType;
}
