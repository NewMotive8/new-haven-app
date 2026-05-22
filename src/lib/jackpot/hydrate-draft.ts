/**
 * Shared draft-hydration helpers for the single-jackpot form and the
 * MultiJackpot wizard. Centralizes the Option A sanitization, Must-Drop
 * lock-down, and Frequency Happy-Hour JSON reverse-parsing so both forms
 * enforce identical draft initialization, data extraction, and editing rules.
 */
import type { JackpotSavePayload } from "@/components/jackpot/JackpotCreationForm";

/** Safe JSON.parse → object | null. */
export function parseFrequencyJSON(
  s: unknown,
): Record<string, unknown> | null {
  if (typeof s !== "string" || s.length === 0) return null;
  try {
    const v = JSON.parse(s);
    return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** "DAILY" | "WEEKLY" | "MONTHLY" picker. */
export function pickFrequencyInterval(
  v: unknown,
): "DAILY" | "WEEKLY" | "MONTHLY" | undefined {
  if (v === "DAILY" || v === "WEEKLY" || v === "MONTHLY") return v;
  return undefined;
}

/** First non-empty string value. */
export function pickTime(...vals: unknown[]): string | undefined {
  for (const v of vals) if (typeof v === "string" && v.length > 0) return v;
  return undefined;
}

/**
 * Sanitize an incoming saved jackpot draft so legacy/forward-incompatible
 * records hydrate cleanly into the current form.
 *
 *  1. Frequency  — reverse-parse contributionFrequency / winFrequency JSON
 *     strings into the discrete Happy Hour state (freqInterval, freqDay,
 *     contrib/win window times, cloneContribToWin) when discrete fields
 *     aren't present.
 *  2. Must-Drop  — strip legacy `payoutModel` and lock to 'maximum'.
 *  3. Fixed contribution — strip wager-eligibility limits (Option A).
 *  4. Classic Progressive — strip win-amount caps (Option A).
 */
export function sanitizeIncomingDraft(
  raw: JackpotSavePayload | undefined,
): JackpotSavePayload | undefined {
  if (!raw) return raw;
  const draft: JackpotSavePayload = { ...raw };

  // --- 1. Frequency: decode serialized Happy Hour JSON if present.
  if (draft.type === "frequency") {
    const cf = parseFrequencyJSON(draft.contributionFrequency);
    const wf = parseFrequencyJSON(draft.winFrequency);

    if (draft.freqInterval == null) {
      draft.freqInterval =
        pickFrequencyInterval(cf?.frequency) ??
        pickFrequencyInterval(wf?.frequency) ??
        "DAILY";
    }
    if (draft.freqDay == null) {
      const d = cf?.day ?? wf?.day;
      draft.freqDay = typeof d === "string" ? d : "";
    }
    const cStart = pickTime(draft.contribStartTime, cf?.startTime, cf?.startTimeOfDay);
    const cEnd = pickTime(draft.contribEndTime, cf?.endTime, cf?.endTimeOfDay);
    const wStart = pickTime(draft.winStartTime, wf?.startTime, wf?.startTimeOfDay);
    const wEnd = pickTime(draft.winEndTime, wf?.endTime, wf?.endTimeOfDay);
    if (cStart) draft.contribStartTime = cStart;
    if (cEnd) draft.contribEndTime = cEnd;
    if (wStart) draft.winStartTime = wStart;
    if (wEnd) draft.winEndTime = wEnd;

    if (draft.cloneContribToWin == null) {
      const cs = draft.contribStartTime;
      const ce = draft.contribEndTime;
      const ws = draft.winStartTime ?? cs;
      const we = draft.winEndTime ?? ce;
      draft.cloneContribToWin = cs === ws && ce === we;
    }
  }

  // --- 2. Must-Drop: drop legacy payoutModel, lock to Maximum Win layout.
  if (draft.type === "must_drop") {
    draft.payoutModel = "maximum";
    draft.fixedWinAmount = 0;
    draft.averageWinAmount = 0;
  }

  // --- 3. Fixed contribution: wager-eligibility limits are illegal.
  const effContribType =
    draft.contributionMode === "split"
      ? draft.totalContributionType
      : draft.contributionType;
  if (effContribType === "fixed") {
    draft.minWagerAmount = 0;
    draft.maxWagerAmount = 0;
  }

  // --- 4. Classic Progressive cannot carry win-amount caps; trigger odds
  //        are Classic-only.
  if (draft.type === "classic") {
    draft.fixedWinAmount = 0;
    draft.averageWinAmount = 0;
    draft.minWinAmount = 0;
    draft.maxWinAmount = 0;
  } else {
    draft.triggerOdds = 0;
  }

  return draft;
}
