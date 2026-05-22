// Internal Incentiv8 master category buckets. Hardcoded by design: these are
// our standard, operator-independent taxonomy. UI and backend validators
// MUST import from this single source of truth.
export const MASTER_CATEGORIES = [
  "Slots",
  "Table Games",
  "Live Casino",
  "Crash Games",
  "Sports",
] as const;

export type MasterCategory = (typeof MASTER_CATEGORIES)[number];

export function isMasterCategory(v: unknown): v is MasterCategory {
  return typeof v === "string" && (MASTER_CATEGORIES as readonly string[]).includes(v);
}
