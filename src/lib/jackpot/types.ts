// Java BigDecimal / Long -> number, Instant / ZonedDateTime -> ISO-8601 string
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
export type JackpotWinType = "AVERAGE" | "MAXIMUM";

export interface PoolDTO {
  currentAmount: number;
  minimumAmount: number;
  maximumAmount: number;
}

export interface SeedDTO {
  currentAmount: number;
  targetAmount: number;
  contributionAmount: number;
  contributionType: ContributionType;
}

export interface JackpotConfigDTO {
  id: number;
  name: string;
  enabled?: boolean;
  brandId?: string;
  type: JackpotWinType;
  contributionAmount: number;
  contributionType: ContributionType;
  volatility: number;
  pool: PoolDTO;
  seed: SeedDTO;
  fixedWinAmount?: number;
  maximumWinAmount?: number;
}

export interface WinEventDTO {
  iteration: number;
  amount: number;
  poolBeforeWin: number;
  timestamp: string;
}

export interface SimulatorResponseDTO {
  iterations: number;
  wager: number;
  totalWagered: number;
  totalContributions: number;
  winCounter: number;
  winAmountCounter: number;
  rtp: number;
  finalPool: number;
  finalSeed: number;
  winEvents: WinEventDTO[];
}
