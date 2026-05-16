import type { JackpotConfigDTO } from "./types";
import type { JackpotSavePayload } from "@/components/jackpot/JackpotCreationForm";

/**
 * Map the rich form payload coming out of the creation flow into the lean
 * JackpotConfigDTO shape the simulator engine expects.
 *
 * The form captures far more variables than the engine currently consumes
 * (recurrence, widget, segments…). Those are dropped here; the simulator only
 * needs win-model, contribution, volatility, and pool/seed numbers.
 */
export function mapPayloadToConfig(payload: JackpotSavePayload): JackpotConfigDTO {
  const contributionType = payload.contributionType === "fixed" ? "FIXED" : "PERCENTAGE";
  const contributionAmount =
    payload.contributionType === "fixed"
      ? payload.poolPercentageValue
      : payload.playerContribution + payload.operatorContribution;

  return {
    id: 0,
    name: payload.name || "Untitled Jackpot",
    type: payload.payoutModel === "maximum" ? "MAXIMUM" : "AVERAGE",
    contributionAmount,
    contributionType,
    volatility: payload.volatility,
    pool: {
      currentAmount: 0,
      minimumAmount: 0,
      maximumAmount: 0,
    },
    seed: {
      currentAmount: 0,
      targetAmount: 0,
      contributionAmount: payload.seedPercentageValue,
      contributionType: payload.seedContributionType === "fixed" ? "FIXED" : "PERCENTAGE",
    },
  };
}
