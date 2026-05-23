/**
 * Phase 2 financial helpers — direct DB inspection via psql.
 *
 * Tests run under Node (vitest), so we can shell out to psql using the
 * managed PG* env vars provided by the dev sandbox. This is intentionally
 * read-mostly; only fixture-scoped helpers (e.g. RPC calls into the
 * brand 999999 namespace) are allowed to write.
 */
import { execFileSync } from "node:child_process";

export function psql(sql: string): string {
  return execFileSync("psql", ["-At", "-c", sql], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

export function psqlOne(sql: string): string {
  const out = psql(sql);
  // -At returns one cell per line; we expect a single cell.
  return out.split("\n")[0] ?? "";
}

/** Look up the audit fixture ids fresh (no caching — the migration is idempotent). */
export function auditFixtureIds(): {
  gameId: number;
  groupId: number;
  jackpotId: number;
} {
  const row = psqlOne(`
    SELECT g.id || '|' || jg.id || '|' || jp.id
      FROM public.games g
      JOIN public.jackpot_groups jg
        ON jg.brand_id = 999999 AND jg.name = 'Audit Group 999999'
      JOIN public.jackpots jp
        ON jp.group_id = jg.id AND jp.name = 'Audit Jackpot 999999'
     WHERE g.operator_game_id = 'audit-game-999999'
  `);
  if (!row) throw new Error("Audit fixture missing — run the seed migration");
  const [gameId, groupId, jackpotId] = row.split("|").map((n) => Number(n));
  return { gameId, groupId, jackpotId };
}

export function poolBalance(jackpotId: number): number {
  const v = psqlOne(
    `SELECT current_balance::text FROM public.jackpot_pools WHERE jackpot_id = ${jackpotId}`,
  );
  return Number(v);
}

export function countTx(brandId: number, group: number): number {
  return Number(
    psqlOne(
      `SELECT count(*) FROM public.jackpot_transactions WHERE brand_id = ${brandId} AND group_id = ${group}`,
    ),
  );
}

export function countWins(jackpotId: number): number {
  return Number(
    psqlOne(
      `SELECT count(*) FROM public.jackpot_wins WHERE jackpot_id = ${jackpotId}`,
    ),
  );
}

export function countAuditLog(action: string, targetId: string): number {
  return Number(
    psqlOne(
      `SELECT count(*) FROM public.admin_audit_log
        WHERE action = '${action}' AND target_id = '${targetId}'`,
    ),
  );
}

/** Convert a fractional-currency amount to integer micro-cents (10^-6).
 *  Eliminates IEEE-754 drift when summing many small wagers. */
export function micro(n: number): bigint {
  // Use string-based rounding to avoid Math.round float surprises at the 7th decimal.
  const fixed = n.toFixed(6);
  const [intPart, fracPart = ""] = fixed.split(".");
  const padded = (fracPart + "000000").slice(0, 6);
  const sign = intPart.startsWith("-") ? -1n : 1n;
  const absInt = intPart.replace(/^-/, "");
  return sign * (BigInt(absInt) * 1_000_000n + BigInt(padded));
}
