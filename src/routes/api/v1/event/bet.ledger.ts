/**
 * Phase 3 — Compliance audit ledger read endpoint.
 *
 * Returns the most recent successful bet transactions captured by the
 * append-only in-memory buffer in `bet.ts`. Brand-scoped, no internal-secret
 * gate (public read, like the widget tickers).
 */
import { createFileRoute } from "@tanstack/react-router";
import { json, preflight, requireBrandId } from "@/lib/jackpot/http";
import { AUDIT_MAX, jackpot_ledger_logs } from "./bet";

export const Route = createFileRoute("/api/v1/event/bet/ledger")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async ({ request }) => {
        const brand = requireBrandId(request);
        if (brand instanceof Response) return brand;

        const url = new URL(request.url);
        const limitRaw = parseInt(url.searchParams.get("limit") ?? "200", 10);
        const limit = Math.min(
          Math.max(Number.isFinite(limitRaw) ? limitRaw : 200, 1),
          AUDIT_MAX,
        );

        const scoped = jackpot_ledger_logs.filter((e) => e.brandId === brand);
        const entries = scoped.slice(-limit).reverse();

        return json({ entries, total: scoped.length, cap: AUDIT_MAX });
      },
    },
  },
});
