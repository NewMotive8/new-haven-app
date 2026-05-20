import type {
  JackpotConfigDTO,
  JackpotStructuralType,
  JackpotWinType,
  TierDTO,
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


  const n = typeof value === "number" ? value : parseFloat(String(value));
  return Number.isFinite(n) ? n : fallback;
}

function mapStructural(formType: unknown): JackpotStructuralType {
  const t = String(formType ?? "").toLowerCase();
  if (t === "multi_level" || t === "multilevel" || t === "multi-level") return "MULTI_LEVEL";
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

  const poolContributionType =
    payload.contributionType === "fixed" ? "FIXED" : "PERCENTAGE";
  const poolContributionAmount = num(payload.poolPercentageValue, 0);
  const seedContributionType =
    payload.seedContributionType === "fixed" ? "FIXED" : "PERCENTAGE";
  const seedContributionAmount = num(payload.seedPercentageValue, 0);

  const reseed = num(payload.reseedingAmount, 0);
  const minWin = num(payload.minWinAmount, 0);
  const maxWin = num(payload.maxWinAmount, 0);
  const avgWin = num(payload.averageWinAmount, 0);

  const volatilityRaw = num(payload.volatility, 5);
  const volatility = Math.min(10, Math.max(0, volatilityRaw));

  const poolOperatorShare = Math.min(100, Math.max(0, num(payload.operatorContribution, 0)));
  const seedOperatorShare = Math.min(100, Math.max(0, num(payload.seedOperatorContribution, 0)));

  const basePool = {
    currentAmount: reseed,
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

  // ── MULTI_LEVEL — build tier array (fall back to even-weighted single tier).
  let tiers: TierDTO[] | undefined;
  if (structuralType === "MULTI_LEVEL" && payload.tiers && payload.tiers.length > 0) {
    const raw = payload.tiers.slice(0, 4);
    const evenWeight = raw.length > 0 ? 1 / raw.length : 1;
    tiers = raw.map((t, idx) => {
      const rank = Number(t.multiLevelTier) || idx + 1;
      const weight = Number.isFinite(t.multiLevelWeight) && t.multiLevelWeight > 0
        ? Math.max(0, Math.min(1, t.multiLevelWeight))
        : evenWeight;
      const tierReseed = num(t.reseedingAmount, reseed);
      const tierAvgWin = num(t.averageWinAmount, avgWin);
      return {
        multiLevelTier: rank,
        multiLevelWeight: weight,
        label: t.label,
        pool: {
          currentAmount: tierReseed,
          minimumAmount: tierReseed,
          maximumAmount: num(t.maximumPoolAmount, 0),
          minimumWinAmount: num(t.minWinAmount, minWin),
          maximumWinAmount: num(t.maxWinAmount, maxWin),
          // Per-tier CDF center — Mini=400, Major=4000, Mega=40000 in the
          // default template. Falls back to global avgWin then maxWin.
          targetAmount: num(t.averageWinAmount, tierAvgWin),
          contributionAmount: num(t.poolContributionAmount, poolContributionAmount),
          contributionType:
            (t.poolContributionType ?? payload.contributionType) === "fixed"
              ? "FIXED"
              : "PERCENTAGE",
          operatorShare: num(t.operatorShare, poolOperatorShare),
        },
        seed: {
          currentAmount: num(t.seedInitialAmount, num(t.seedContributionAmount, seedContributionAmount)),
          targetAmount: num(t.seedTargetAmount, tierAvgWin),
          contributionAmount: num(t.seedContributionAmount, seedContributionAmount),
          contributionType:
            (t.seedContributionType ?? payload.seedContributionType) === "fixed"
              ? "FIXED"
              : "PERCENTAGE",
          operatorShare: num(t.seedOperatorShare, seedOperatorShare),
        },
      };
    });
  }

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
        }
      : undefined;
  const triggerOdds = num(payload.triggerOdds, 0);

  // Apply per-tier split / trigger odds onto the already-built tiers array.
  if (tiers && payload.tiers) {
    tiers = tiers.map((t, idx) => {
      const src = payload.tiers![idx];
      if (!src) return t;
      const tSplit =
        src.contributionMode === "split"
          ? {
              mode: "split" as const,
              totalContributionAmount: num(src.totalContributionAmount, 0),
              totalContributionType:
                (src.totalContributionType ?? "fixed") === "fixed"
                  ? ("FIXED" as const)
                  : ("PERCENTAGE" as const),
              poolWeight: num(src.poolWeight, 60),
              seedWeight: num(src.seedWeight, 30),
              houseWeight: num(src.houseWeight, 10),
            }
          : undefined;
      return {
        ...t,
        ...(tSplit ? { contribution: tSplit } : {}),
        ...(num(src.triggerOdds, 0) > 0 ? { triggerOdds: num(src.triggerOdds, 0) } : {}),
      };
    });
  }

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
