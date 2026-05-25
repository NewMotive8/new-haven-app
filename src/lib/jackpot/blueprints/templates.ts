import type { JackpotSavePayload } from "@/components/jackpot/JackpotCreationForm";
import type { Blueprint, SingleBlueprint, MultiBlueprint } from "./types";

/**
 * Canonical single-jackpot payload defaults — strict, 100% player-funded,
 * house-profitable. Overrides on top tune type / pacing / wallet metadata.
 */
function baseSingle(
  walletType: "internal" | "external",
  name: string,
  description: string,
): JackpotSavePayload {
  return {
    name,
    description,
    walletType,
    currencyId: null,
    amountScale: walletType === "internal" ? 1 : 100,
    type: "classic",
    payoutModel: "maximum",
    contributionType: "percentage",
    seedContributionType: "percentage",
    volatility: 5,
    // 100% player-funded streams (pool + reseed both).
    playerContribution: 100,
    operatorContribution: 0,
    seedPlayerContribution: 100,
    seedOperatorContribution: 0,
    recurrenceType: "single",
    weeklyDay: "",
    monthlyDay: "",
    displayFrequency: "daily",
    weeklyFrequencyDay: "",
    monthlyFrequencyDay: "",
    separateContributionFrequency: false,
    payoutInterval: "logged_in",
    isSegmented: false,
    segments: [],
    isCommunity: false,
    communitySplit: 0,
    isTemplate: false,
    selectedWidget: "jewels",
    fixedWinAmount: 0,
    averageWinAmount: 0,
    minWinAmount: 0,
    maxWinAmount: 0,
    minWagerAmount: 0,
    maxWagerAmount: 0,
    reseedingAmount: 0,
    maximumSeedAmount: 0,
  };
}

// ───────── CLASSIC (Drop Pace Model) ─────────
const classicHigh: SingleBlueprint = {
  id: "classic-high-premium",
  fundingType: "PLAYER_CONTRIBUTION",
  name: "High-Traffic Premium Classic",
  tier: "high",
  vibe: "Marathon",
  objective:
    "Long-tail progressive for premium operators — large pool, rare hits, sticky retention.",
  targetGameTypes: ["Slots", "Live Casino"],
  kind: "single",
  payload: {
    ...baseSingle("external", "High-Traffic Premium Classic", "Premium classic progressive"),
    type: "classic",
    reseedingAmount: 1000,
    maximumSeedAmount: 1000,
    initialPoolAmount: 1000,
    triggerOdds: 250000,
    operatorShare: 0,
    contributionMode: "split",
    totalContributionType: "fixed",
    totalContributionAmount: 0.15,
    poolWeight: 60,
    seedWeight: 20,
    houseWeight: 20,
  },
};

const classicMid: SingleBlueprint = {
  id: "classic-mid-engagement",
  fundingType: "PLAYER_CONTRIBUTION",
  name: "Mid-Traffic Engagement Classic",
  tier: "medium",
  vibe: "Daily Driver",
  objective:
    "Balanced progressive that hits often enough to feel live without bleeding the house.",
  targetGameTypes: ["Slots", "Crash Games"],
  kind: "single",
  payload: {
    ...baseSingle("external", "Mid-Traffic Engagement Classic", "Mid-traffic classic progressive"),
    type: "classic",
    reseedingAmount: 250,
    maximumSeedAmount: 250,
    initialPoolAmount: 250,
    triggerOdds: 50000,
    operatorShare: 15,
    houseFixedPerSpin: 0.15,
  },
};

const classicSmall: SingleBlueprint = {
  id: "classic-small-loyalty",
  fundingType: "MARKETING_FUNDED",
  name: "Small-Traffic Loyalty Booster",
  tier: "small",
  vibe: "Loyalty Booster",
  objective:
    "Internal-token classic that rewards loyal regulars without operator cash exposure.",
  targetGameTypes: ["Slots"],
  kind: "single",
  payload: {
    ...baseSingle("internal", "Small-Traffic Loyalty Booster", "Internal-token loyalty classic"),
    type: "classic",
    reseedingAmount: 50,
    maximumSeedAmount: 50,
    initialPoolAmount: 50,
    triggerOdds: 10000,
    operatorShare: 15,
  },
};

// ───────── MUST-DROP (Hype Curve Model) ─────────
const mustDropHigh: SingleBlueprint = {
  id: "mustdrop-high-grand",
  fundingType: "PLAYER_CONTRIBUTION",
  name: "High-Traffic Grand Must-Drop",
  tier: "high",
  vibe: "Cap Hunter",
  objective: "Grand must-drop with a hard 10k ceiling and slow pacing for prime-time hype.",
  targetGameTypes: ["Slots", "Live Casino"],
  kind: "single",
  payload: {
    ...baseSingle("external", "High-Traffic Grand Must-Drop", "Grand must-drop, hype-curved"),
    type: "must_drop",
    reseedingAmount: 2500,
    maximumSeedAmount: 2500,
    initialPoolAmount: 2500,
    maxWinAmount: 10000,
    mustDropPeriod: 1,
    triggerOdds: 0,
    operatorShare: 15,
    houseFixedPerSpin: 0.15,
  },
};

const mustDropMid: SingleBlueprint = {
  id: "mustdrop-mid-daily",
  fundingType: "PLAYER_CONTRIBUTION",
  name: "Mid-Traffic Daily Cap Hunter",
  tier: "medium",
  vibe: "Cap Hunter",
  objective: "Daily must-drop tuned for steady mid-cycle hits and predictable burn rate.",
  targetGameTypes: ["Slots"],
  kind: "single",
  payload: {
    ...baseSingle("external", "Mid-Traffic Daily Cap Hunter", "Daily-cap must-drop"),
    type: "must_drop",
    reseedingAmount: 500,
    maximumSeedAmount: 500,
    initialPoolAmount: 500,
    maxWinAmount: 2500,
    mustDropPeriod: 1,
    triggerOdds: 0,
    operatorShare: 15,
    houseFixedPerSpin: 0.15,
  },
};

const mustDropSmall: SingleBlueprint = {
  id: "mustdrop-small-mini",
  fundingType: "MARKETING_FUNDED",
  name: "Small-Traffic Mini Coin Escape",
  tier: "small",
  vibe: "Coin Escape",
  objective: "Low-stakes internal must-drop — short cycles keep small audiences buzzing.",
  targetGameTypes: ["Slots"],
  kind: "single",
  payload: {
    ...baseSingle("internal", "Small-Traffic Mini Coin Escape", "Internal-token mini must-drop"),
    type: "must_drop",
    reseedingAmount: 100,
    maximumSeedAmount: 100,
    initialPoolAmount: 100,
    maxWinAmount: 500,
    mustDropPeriod: 1,
    triggerOdds: 0,
    operatorShare: 0,
  },
};

// ───────── HAPPY HOUR (Frequency Model) ─────────
function happyHour(
  win: SingleBlueprint["payload"],
  freqInterval: "DAILY" | "WEEKLY",
  freqDay: string,
  start: string,
  end: string,
): JackpotSavePayload {
  return {
    ...win,
    type: "frequency",
    freqInterval,
    freqDay,
    contribStartTime: start,
    contribEndTime: end,
    winStartTime: start,
    winEndTime: end,
    cloneContribToWin: true,
    contributionFrequency: JSON.stringify({
      frequency: freqInterval,
      day: freqDay || undefined,
      startTime: start,
      endTime: end,
    }),
    winFrequency: JSON.stringify({
      frequency: freqInterval,
      day: freqDay || undefined,
      startTime: start,
      endTime: end,
    }),
  };
}

const happyHigh: SingleBlueprint = {
  id: "happy-high-friday",
  fundingType: "PLAYER_CONTRIBUTION",
  name: "High-Traffic Friday Rush Hour",
  tier: "high",
  vibe: "Weekend Rush",
  objective: "Friday night burst — caps payouts at 10k, lives only inside the rush window.",
  targetGameTypes: ["Slots", "Live Casino"],
  kind: "single",
  payload: {
    ...happyHour(
      {
        ...baseSingle("external", "High-Traffic Friday Rush Hour", "Friday-night happy hour"),
        type: "frequency",
        reseedingAmount: 2000,
        maximumSeedAmount: 2000,
        initialPoolAmount: 2000,
        maxTotalPayout: 10000,
        averageWinAmount: 2000,
        operatorShare: 15,
        // Drive non-zero pool/seed contributionAmount when this blueprint is
        // hydrated into the simulator. Without a split definition the
        // payload→config mapping zeroes both contribution streams and the
        // FREQUENCY engine sees no inflow, which used to surface as the
        // dreaded "all-zeroes" Friday-Rush preset.
        contributionMode: "split",
        totalContributionAmount: 5,
        totalContributionType: "percentage",
        poolWeight: 70,   // 3.5% of wager
        seedWeight: 30,   // 1.5% of wager
        houseWeight: 0,   // House cut handled via operatorShare top-skim
        houseFixedPerSpin: 0.15,
      },
      "WEEKLY",
      "FRIDAY",
      "20:00",
      "23:00",
    ),
  },
};

const happyMid: SingleBlueprint = {
  id: "happy-mid-power-hour",
  fundingType: "PLAYER_CONTRIBUTION",
  name: "Mid-Traffic Afternoon Power Hour",
  tier: "medium",
  vibe: "Power Hour",
  objective: "Daily afternoon window to lift mid-day traffic without all-day operator exposure.",
  targetGameTypes: ["Slots", "Crash Games"],
  kind: "single",
  payload: {
    ...happyHour(
      {
        ...baseSingle(
          "external",
          "Mid-Traffic Afternoon Power Hour",
          "Daily afternoon power hour",
        ),
        type: "frequency",
        reseedingAmount: 300,
        maximumSeedAmount: 300,
        initialPoolAmount: 300,
        maxTotalPayout: 1500,
        averageWinAmount: 800,
        operatorShare: 15,
        // Active enterprise split — keeps pool & seed contributions non-zero
        // when the blueprint is hydrated into the simulator.
        contributionMode: "split",
        totalContributionAmount: 4,
        totalContributionType: "percentage",
        poolWeight: 70,   // 2.8% of wager
        seedWeight: 30,   // 1.2% of wager
        houseWeight: 0,
        houseFixedPerSpin: 0.15,
      },
      "DAILY",
      "",
      "14:00",
      "16:00",
    ),
  },
};

const happySmall: SingleBlueprint = {
  id: "happy-small-token-saturday",
  fundingType: "MARKETING_FUNDED",
  name: "Small-Traffic Token Saturday",
  tier: "small",
  vibe: "Time-Boxed",
  objective: "Weekly internal-token window — long enough to feel like an event, capped at 300.",
  targetGameTypes: ["Slots"],
  kind: "single",
  payload: {
    ...happyHour(
      {
        ...baseSingle("internal", "Small-Traffic Token Saturday", "Weekly token happy hour"),
        type: "frequency",
        reseedingAmount: 50,
        maximumSeedAmount: 50,
        initialPoolAmount: 50,
        maxTotalPayout: 300,
        averageWinAmount: 150,
        operatorShare: 15,
        // Active enterprise split for the token happy-hour window.
        contributionMode: "split",
        totalContributionAmount: 3.5,
        totalContributionType: "percentage",
        poolWeight: 70,   // 2.45% of wager
        seedWeight: 30,   // 1.05% of wager
        houseWeight: 0,
      },
      "WEEKLY",
      "SATURDAY",
      "12:00",
      "18:00",
    ),
  },
};

// ───────── MULTI-LEVEL (Group Model) ─────────
const multiHigh: MultiBlueprint = {
  id: "multi-high-mega-network",
  fundingType: "PLAYER_CONTRIBUTION",
  name: "High-Traffic Mega Network Progressive",
  tier: "high",
  vibe: "Network Mega",
  objective:
    "Four-tier network progressive — Mini → Mega — with a 100k Mega cap and slow pacing.",
  targetGameTypes: ["Slots", "Live Casino"],
  kind: "multi",
  group: { contributionType: "percentage", masterPlayerPercent: 2.0, walletType: "external", operatorShare: 15 },
  tiers: [
    { tierName: "Mini", tierRank: 1, tierType: "classic", splitSharePct: 10, seedAmount: 50, reseedingAmount: 50, triggerOdds: 5000 },
    { tierName: "Minor", tierRank: 2, tierType: "classic", splitSharePct: 20, seedAmount: 250, reseedingAmount: 250, triggerOdds: 35000 },
    { tierName: "Major", tierRank: 3, tierType: "classic", splitSharePct: 30, seedAmount: 1500, reseedingAmount: 1500, triggerOdds: 150000 },
    { tierName: "Mega", tierRank: 4, tierType: "must_drop", splitSharePct: 40, seedAmount: 20000, reseedingAmount: 20000, triggerOdds: 0, maxWinAmount: 100000, dropPacing: 9, minBoundary: 50000 },
  ],
};

const multiMid: MultiBlueprint = {
  id: "multi-mid-action-grid",
  fundingType: "PLAYER_CONTRIBUTION",
  name: "Mid-Traffic Action Core Grid",
  tier: "medium",
  vibe: "Action-Packed",
  objective: "Tight three-tier ladder — Bronze, Silver, Gold — with a capped Gold Elite drop.",
  targetGameTypes: ["Slots"],
  kind: "multi",
  group: { contributionType: "percentage", masterPlayerPercent: 1.5, walletType: "external", operatorShare: 15 },
  tiers: [
    { tierName: "Bronze Mini", tierRank: 1, tierType: "classic", splitSharePct: 20, seedAmount: 25, reseedingAmount: 25, triggerOdds: 8000 },
    { tierName: "Silver Mid", tierRank: 2, tierType: "classic", splitSharePct: 30, seedAmount: 200, reseedingAmount: 200, triggerOdds: 45000 },
    { tierName: "Gold Elite", tierRank: 3, tierType: "must_drop", splitSharePct: 50, seedAmount: 2500, reseedingAmount: 2500, triggerOdds: 0, maxWinAmount: 7500, dropPacing: 6, minBoundary: 3000 },
  ],
};

const multiSmall: MultiBlueprint = {
  id: "multi-small-community-split",
  fundingType: "MARKETING_FUNDED",
  name: "Small-Traffic Community Token Split",
  tier: "small",
  vibe: "Community Spark",
  objective:
    "Two-tier internal token split — hourly Spark then capped Daily Climax. House-protected.",
  targetGameTypes: ["Slots"],
  kind: "multi",
  group: { contributionType: "percentage", masterPlayerPercent: 5.0, walletType: "internal", operatorShare: 15 },
  tiers: [
    { tierName: "Hourly Spark", tierRank: 1, tierType: "classic", splitSharePct: 40, seedAmount: 10, reseedingAmount: 10, triggerOdds: 1500 },
    { tierName: "Daily Climax", tierRank: 2, tierType: "must_drop", splitSharePct: 60, seedAmount: 150, reseedingAmount: 150, triggerOdds: 0, maxWinAmount: 500, dropPacing: 5, minBoundary: 200 },
  ],
};

export const BLUEPRINTS: Blueprint[] = [
  classicHigh, classicMid, classicSmall,
  mustDropHigh, mustDropMid, mustDropSmall,
  happyHigh, happyMid, happySmall,
  multiHigh, multiMid, multiSmall,
];
