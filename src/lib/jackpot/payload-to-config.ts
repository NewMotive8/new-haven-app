import type {
  JackpotConfigDTO,
  JackpotStructuralType,
  JackpotWinType,
} from "./types";
import type { JackpotSavePayload } from "@/components/jackpot/JackpotCreationForm";

function num(value: unknown, fallback = 0): number {
  if (value == null) return fallback;
  if (Array.isArray(value)) return num(value[0], fallback);
  const n = typeof value === "number" ? value : parseFloat(String(value));
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Largest-remainder split: distribute `total` across `weights` (percentages
 * 0..100) at `decimals` precision so the returned parts sum *exactly* to
 * `total` at that precision — no 0.251-style rounding drift.
 */
function splitAllocation(total: number, weights: number[], decimals = 4): number[] {
  const scale = Math.pow(10, decimals);
  const totalUnits = Math.round(total * scale);
  const exact = weights.map((w) => (total * (Number(w) || 0)) / 100 * scale);
  const floors = exact.map((x) => Math.floor(x));
  let gap = totalUnits - floors.reduce((s, v) => s + v, 0);
  const remainders = exact
    .map((x, i) => ({ i, r: x - Math.floor(x) }))
    .sort((a, b) => b.r - a.r);
  const out = floors.slice();
  for (let k = 0; gap > 0 && k < remainders.length; k++, gap--) out[remainders[k].i] += 1;
  return out.map((u) => u / scale);
}



function mapStructural(formType: unknown): JackpotStructuralType {
  const t = String(formType ?? "").toLowerCase();
  if (t === "must_drop" || t === "mustdrop" || t === "must-drop") return "MUST_DROP";
  if (t === "must_drop" || t === "mustdrop" || t === "must-drop") return "MUST_DROP";
  if (t === "frequency") return "FREQUENCY";
  return "CLASSIC";
}

/**
 * Map the rich form payload coming out of the creation flow into the lean
 * JackpotConfigDTO shape the simulator engine expects.
 */
export function mapPayloadToConfig(payload: JackpotSavePayload): JackpotConfigDTO {
  const winType: JackpotWinType =
    payload.payoutModel === "maximum" ? "MAXIMUM" : "AVERAGE";
  const structuralType = mapStructural(payload.type);

  // ── v2 jackpot-level split overrides legacy per-bucket amounts/types ──
  const jSplit = payload.contributionMode === "split";
  const jTotalType =
    (payload.totalContributionType ?? "fixed") === "fixed" ? "FIXED" : "PERCENTAGE";
  const [jPoolAmt, jSeedAmt] = jSplit
    ? splitAllocation(num(payload.totalContributionAmount, 0), [
        num(payload.poolWeight, 60),
        num(payload.seedWeight, 30),
        num(payload.houseWeight, 10),
      ])
    : [NaN, NaN];

  const poolContributionType = jSplit
    ? jTotalType
    : payload.contributionType === "fixed"
      ? "FIXED"
      : "PERCENTAGE";
  const poolContributionAmount = jSplit ? jPoolAmt : num(payload.poolPercentageValue, 0);
  const seedContributionType = jSplit
    ? jTotalType
    : payload.seedContributionType === "fixed"
      ? "FIXED"
      : "PERCENTAGE";
  const seedContributionAmount = jSplit ? jSeedAmt : num(payload.seedPercentageValue, 0);

  const reseed = num(payload.reseedingAmount, 0);
  const initialPool = num(payload.initialPoolAmount, 0);
  const minWin = num(payload.minWinAmount, 0);
  const maxWin = num(payload.maxWinAmount, 0);
  const avgWin = num(payload.averageWinAmount, 0);

  const volatilityRaw = num(payload.volatility, 5);
  const volatility = Math.min(10, Math.max(0, volatilityRaw));

  const poolOperatorShare = Math.min(100, Math.max(0, num(payload.operatorContribution, 0)));
  const seedOperatorShare = Math.min(100, Math.max(0, num(payload.seedOperatorContribution, 0)));

  const basePool = {
    currentAmount: initialPool,
    minimumAmount: reseed,
    maximumAmount: 0,
    minimumWinAmount: minWin,
    maximumWinAmount: maxWin,
    contributionAmount: poolContributionAmount,
    contributionType: poolContributionType,
    operatorShare: poolOperatorShare,
  } as const;

  const baseSeed = {
    currentAmount: seedContributionAmount,
    targetAmount: avgWin,
    contributionAmount: seedContributionAmount,
    contributionType: seedContributionType,
    operatorShare: seedOperatorShare,
  } as const;




  // ── Timed lifespan for MUST_DROP / FREQUENCY.
  let timed: JackpotConfigDTO["timed"];
  if (structuralType === "MUST_DROP" || structuralType === "FREQUENCY") {
    timed = {
      lifespanMinutes: num(payload.lifespanMinutes, 1440), // default Daily
      mustDropPeriod: payload.mustDropPeriod,
    };
  }

  // ── v2: jackpot-level contribution split + trigger odds.
  const contributionMode = payload.contributionMode === "split" ? "split" : "legacy";
  const contribution =
    contributionMode === "split"
      ? {
          mode: "split" as const,
          totalContributionAmount: num(payload.totalContributionAmount, 0),
          totalContributionType:
            (payload.totalContributionType ?? "fixed") === "fixed"
              ? ("FIXED" as const)
              : ("PERCENTAGE" as const),
          poolWeight: num(payload.poolWeight, 60),
          seedWeight: num(payload.seedWeight, 30),
          houseWeight: num(payload.houseWeight, 10),
          overlappingRule: payload.overlappingRule ?? "split",
        }
      : undefined;
  const triggerOdds = num(payload.triggerOdds, 0);


  return {
    id: 0,
    name: payload.name?.trim() || "Untitled Jackpot",
    type: winType,
    structuralType,
    volatility,
    pool: basePool,
    seed: baseSeed,
    ...(tiers ? { tiers } : {}),
    ...(timed ? { timed } : {}),
    ...(payload.payoutModel === "fixed" ? { fixedWinAmount: num(payload.fixedWinAmount, 0) } : {}),
    ...(payload.payoutModel === "maximum" ? { maximumWinAmount: maxWin } : {}),
    ...(contribution ? { contribution } : {}),
    ...(triggerOdds > 0 ? { triggerOdds } : {}),
  };
}
