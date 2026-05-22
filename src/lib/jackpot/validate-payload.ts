import type { JackpotSavePayload } from "@/components/jackpot/JackpotCreationForm";

/** Certified RNG denominator ceiling (10M). Mirrors the upstream RNG keyspace. */
export const TRIGGER_ODDS_MAX = 10_000_000;

/** Validate split-mode weights — throws if Pool + Seed + House != EXACTLY 100.00%. */
export function validateSplitWeights(p: JackpotSavePayload): void {
  const q = (n: number) => Math.round((Number(n) || 0) * 100);
  if (p.contributionMode === "split") {
    const sumUnits = q(p.poolWeight ?? 0) + q(p.seedWeight ?? 0) + q(p.houseWeight ?? 0);
    if (sumUnits !== 10_000) {
      const sum =
        (Number(p.poolWeight) || 0) + (Number(p.seedWeight) || 0) + (Number(p.houseWeight) || 0);
      throw new Error(
        `Split-mode contribution weights must sum to EXACTLY 100.00% (got ${sum.toFixed(4)}%). ` +
          `Adjust Pool / Seed / House before saving — zero-tolerance compliance gate.`,
      );
    }
  }
  if (p.triggerOdds != null && p.triggerOdds < 0) {
    throw new Error("triggerOdds must be a positive integer (or 0/empty to disable).");
  }
  if (p.triggerOdds != null && p.triggerOdds > TRIGGER_ODDS_MAX) {
    throw new Error(
      `triggerOdds (${p.triggerOdds.toLocaleString()}) exceeds the certified RNG ceiling of ` +
        `${TRIGGER_ODDS_MAX.toLocaleString()}.`,
    );
  }
}

/** Option A — strict mutual exclusivity between jackpot mode + caps + wager limits. */
export function validateModeExclusivity(p: JackpotSavePayload): void {
  const t = p.type;
  const odds = Number(p.triggerOdds) || 0;
  const minWin = Number(p.minWinAmount) || 0;
  const maxWin = Number(p.maxWinAmount) || 0;
  const minWager = Number(p.minWagerAmount) || 0;
  const maxWager = Number(p.maxWagerAmount) || 0;

  if (t === "classic") {
    if (odds <= 0) {
      throw new Error("Classic Progressive requires a Trigger Probability denominator (N > 0).");
    }
    if (minWin > 0 || maxWin > 0) {
      throw new Error(
        "Classic Progressive cannot define Min/Max Win — fixed-odds mode pays the full pool balance.",
      );
    }
  }
  if (t === "must_drop" && odds > 0) {
    throw new Error("Must-Drop jackpots cannot define a Trigger Probability — value-driven mode only.");
  }
  if (t === "frequency") {
    if (odds > 0) {
      throw new Error("Frequency jackpots cannot define a Trigger Probability — time-driven mode only.");
    }
    if (minWin > 0 || maxWin > 0) {
      throw new Error("Frequency jackpots cannot define Min/Max Win caps — time-driven mode only.");
    }
  }
  if (p.contributionType === "fixed" && (minWager > 0 || maxWager > 0)) {
    throw new Error(
      "Min/Max Wager limits only apply to Percentage contributions; Fixed contributions are flat-fee side bets.",
    );
  }
}

/** Run every Option A gate. Throws on the first failure. */
export function validateJackpotPayload(p: JackpotSavePayload): void {
  validateSplitWeights(p);
  validateModeExclusivity(p);
}
