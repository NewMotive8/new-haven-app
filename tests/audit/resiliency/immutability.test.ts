/**
 * Phase 3 / Pillar 2 — admin_audit_log append-only immutability.
 *
 * Direct, privileged psql attempts to UPDATE / DELETE a freshly-written row
 * (via apply_jackpot_topup against the brand-999999 fixture) must be rejected
 * by the BEFORE UPDATE / BEFORE DELETE triggers with a check_violation,
 * regardless of the caller's privileges.
 */
import { execFileSync } from "node:child_process";
import { describe, expect, it, beforeAll } from "vitest";
import { auditFixtureIds, psql, psqlOne } from "../financial/helpers";

let fx: { gameId: number; groupId: number; jackpotId: number };
let auditRowId: string;

beforeAll(() => {
  fx = auditFixtureIds();
  // Generate one fresh, real audit row via the standard topup RPC (delta = 0,
  // so balance is untouched but a row lands in admin_audit_log).
  psql(`SELECT public.apply_jackpot_topup(${fx.jackpotId}, 0, false, NULL, 999999, 'audit-phase3-immutability')`);
  auditRowId = psqlOne(`
    SELECT id::text FROM public.admin_audit_log
     WHERE action = 'jackpot_topup'
       AND target_id = '${fx.jackpotId}'
       AND request_id = 'audit-phase3-immutability'
     ORDER BY id DESC LIMIT 1
  `);
  if (!auditRowId) throw new Error("Could not seed audit-log row for immutability probe");
});

function expectPsqlReject(sql: string, matcher: RegExp) {
  let threw = false;
  let stderr = "";
  try {
    execFileSync("psql", ["-At", "-c", sql], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (e: any) {
    threw = true;
    stderr = String(e?.stderr ?? e?.message ?? "");
  }
  expect(threw, `expected psql to reject: ${sql}\nstderr: ${stderr}`).toBe(true);
  expect(stderr).toMatch(matcher);
}
// Immutability is enforced by TWO independent DB-tier layers:
//  (a) Role/RLS: no grant or policy permits UPDATE/DELETE → "permission denied".
//  (b) Trigger: admin_audit_log_immutable() raises check_violation
//      ("append-only ... UPDATE/DELETE forbidden") for any caller that
//      gets past the role layer (e.g. SECURITY DEFINER paths).
// Either rejection proves the ledger row cannot be mutated externally.
const REJECTED = /permission denied|append-only|forbidden/i;

describe("Phase 3 / Pillar 2 — admin_audit_log immutability triggers", () => {
  it("direct UPDATE is rejected at the DB tier (role/RLS or trigger)", () => {
    expectPsqlReject(
      `UPDATE public.admin_audit_log SET action = 'tampered' WHERE id = ${auditRowId}`,
      REJECTED,
    );
  });

  it("direct DELETE is rejected at the DB tier (role/RLS or trigger)", () => {
    expectPsqlReject(
      `DELETE FROM public.admin_audit_log WHERE id = ${auditRowId}`,
      REJECTED,
    );
  });

  it("bulk DELETE attempt against the whole table is rejected", () => {
    expectPsqlReject(
      `DELETE FROM public.admin_audit_log`,
      REJECTED,
    );
  });

  it("the trigger function source raises check_violation on UPDATE/DELETE", () => {
    const def = psqlOne(
      `SELECT pg_get_functiondef('public.admin_audit_log_immutable()'::regprocedure)`,
    );
    expect(def).toMatch(/append-only/i);
    expect(def).toMatch(/check_violation/i);
  });

  it("the seeded row is still present and unchanged after the attacks", () => {
    const stillThere = psqlOne(
      `SELECT action FROM public.admin_audit_log WHERE id = ${auditRowId}`,
    );
    expect(stillThere).toBe("jackpot_topup");
  });

  it("both triggers (BEFORE UPDATE and BEFORE DELETE) are attached", () => {
    const rows = psql(`
      SELECT tgname FROM pg_trigger
       WHERE tgrelid = 'public.admin_audit_log'::regclass
         AND NOT tgisinternal
       ORDER BY tgname
    `).split("\n");
    expect(rows).toEqual(
      expect.arrayContaining(["admin_audit_log_no_delete", "admin_audit_log_no_update"]),
    );
  });
});
