import type { JackpotSavePayload } from "@/components/jackpot/JackpotCreationForm";

export type TrafficTier = "high" | "medium" | "small";

export type Vibe =
  | "Rapid-Fire"
  | "Action-Packed"
  | "Daily Driver"
  | "Marathon"
  | "Cap Hunter"
  | "Time-Boxed"
  | "Network Mega"
  | "Community Spark"
  | "Loyalty Booster"
  | "Power Hour"
  | "Weekend Rush"
  | "Coin Escape";

export interface BlueprintMeta {
  id: string;
  name: string;
  tier: TrafficTier;
  vibe: Vibe;
  objective: string;
  targetGameTypes: string[];
}

export interface SingleBlueprint extends BlueprintMeta {
  kind: "single";
  payload: JackpotSavePayload;
}

export interface MultiTierSpec {
  tierName: string;
  tierRank: number;
  tierType: "classic" | "must_drop";
  splitSharePct: number;
  seedAmount: number;
  reseedingAmount: number;
  /** 0 disables fixed odds (e.g. must_drop tiers). */
  triggerOdds: number;
  maxWinAmount?: number;
  /** 4-9, mapped to fast/balanced/slow for the wizard runtime. */
  dropPacing?: number;
  minBoundary?: number;
}

export interface MultiBlueprint extends BlueprintMeta {
  kind: "multi";
  group: {
    contributionType: "percentage";
    masterPlayerPercent: number;
    walletType: "internal" | "external";
  };
  tiers: MultiTierSpec[];
}

export type Blueprint = SingleBlueprint | MultiBlueprint;
