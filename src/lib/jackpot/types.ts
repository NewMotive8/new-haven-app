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
