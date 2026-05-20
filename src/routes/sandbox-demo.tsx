import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { applyCommunityPayout, type CommunityPayoutBreakdown } from "@/lib/jackpot/ledger";

export const Route = createFileRoute("/sandbox-demo")({
  component: SandboxDemoPage,
});

// ── Native widget text dictionary ───────────────────────────────────────────
const texts = {
  optInButton: "Opt in Jackpot",
  optOutButton: "Opt Out Jackpot",
  loading: "Loading...",
  userInLabel: "You are in, good luck!",
  userOutLabel: "You have opted out for this jackpot.",
  winMessage: "CONGRATS!<br/> YOU WON THE JACKPOT!",
};

type Jackpot = {
  id: number;
  name: string;
  enabled: boolean;
  poolBalance: number;
  seedAmount: number;
  triggerThreshold: number;
  contributionRate: number;
  volatility?: number;
  brandId: string;
  config?: Record<string, unknown>;
};

type OverlappingRule = "split" | "additive";

type LedgerSplit = {
  pool: number;
  seed: number;
  house: number;
  totalContribution: number;
  processedAt: string;
};

type PerJackpotEntry = {
  jackpotId: number;
  jackpotName: string;
  routing: OverlappingRule;
  splitDenominator: number;
  contribution: { pool: number; seed: number; house: number };
  house: number;
  totalContribution: number;
};

const BRAND_KEY = "jackpot-brand-id";

function fmt(n: number, currency = "EUR") {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n);
  } catch {
    return `€${n.toFixed(2)}`;
  }
}

function readOverlappingRule(jp: Jackpot): OverlappingRule {
  const cfg = (jp.config ?? {}) as Record<string, unknown>;
  const v2 = (cfg.engineV2 ?? {}) as Record<string, unknown>;
  const rule = v2.overlappingRule;
  return rule === "additive" ? "additive" : "split";
}

function SandboxDemoPage() {
  const [brandId, setBrandId] = useState<string>("1");
  const [pools, setPools] = useState<Jackpot[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [poolDisplays, setPoolDisplays] = useState<Record<number, number>>({});
  const [optIns, setOptIns] = useState<Record<number, boolean>>({});
  const [pendingOptIn, setPendingOptIn] = useState<Jackpot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [forceWin, setForceWin] = useState(false);
  const [wager, setWager] = useState<number>(1);
  const [lastSplit, setLastSplit] = useState<LedgerSplit | null>(null);
  const [tracker, setTracker] = useState<{
    spins: number;
    totalWager: number;
    cumPool: number;
    cumSeed: number;
    cumHouse: number;
  }>({ spins: 0, totalWager: 0, cumPool: 0, cumSeed: 0, cumHouse: 0 });
  const [celebrating, setCelebrating] = useState(false);
  const [lastCommunity, setLastCommunity] = useState<CommunityPayoutBreakdown | null>(null);
  const [spinning, setSpinning] = useState(false);
  const widgetHostRef = useRef<HTMLDivElement | null>(null);

  // ── Brand id bootstrap ───────────────────────────────────────────────────
  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(BRAND_KEY) : null;
    if (stored) setBrandId(stored);
  }, []);

  const saveBrand = (v: string) => {
    setBrandId(v);
    if (typeof window !== "undefined") localStorage.setItem(BRAND_KEY, v);
  };

  const headers = useCallback(
    (): HeadersInit => ({
      "Content-Type": "application/json",
      ...(brandId ? { "x-brand-id": brandId } : {}),
    }),
    [brandId],
  );

  // ── Poll /api/v1/jackpots every 2s — load ALL enabled pools ──────────────
  useEffect(() => {
    if (!brandId) return;
    let cancelled = false;

    const tick = async () => {
      try {
        const res = await fetch("/api/v1/jackpots", { headers: headers() });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as Jackpot[];
        if (cancelled) return;
        const enabled = data.filter((j) => j.enabled);
        setPools(enabled);
        setPoolDisplays((prev) => {
          const next: Record<number, number> = { ...prev };
          for (const jp of enabled) {
            // Only seed from server when we have no local running value yet.
            if (next[jp.id] == null) next[jp.id] = jp.poolBalance;
          }
          return next;
        });
        setOptIns((prev) => {
          const next: Record<number, boolean> = { ...prev };
          for (const jp of enabled) {
            if (next[jp.id] == null) {
              // Default: split pools auto opted-in, additive requires consent.
              next[jp.id] = readOverlappingRule(jp) !== "additive";
            }
          }
          return next;
        });
        setActiveIndex((i) => (enabled.length === 0 ? 0 : Math.min(i, enabled.length - 1)));
        setError(null);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    };

    tick();
    const id = setInterval(tick, 2000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [brandId, headers]);

  const activePool: Jackpot | null = pools[activeIndex] ?? null;
  const activeRule: OverlappingRule | null = activePool ? readOverlappingRule(activePool) : null;
  const activeOptedIn = activePool ? !!optIns[activePool.id] : false;

  // ── Cumulative fee label ─────────────────────────────────────────────────
  const optedInPools = useMemo(
    () => pools.filter((p) => optIns[p.id]),
    [pools, optIns],
  );
  const feePerSpin = useMemo(
    () => optedInPools.reduce((s, p) => s + (Number(p.contributionRate) || 0) * (Number(wager) || 0), 0),
    [optedInPools, wager],
  );

  // ── Persist pool growth so polling reflects each spin ─────────────────────
  const persistPoolGrowth = async (jackpotId: number, amount: number) => {
    if (amount <= 0) return;
    try {
      await fetch("/api/v1/jackpots/topup", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          jackpotId,
          amount,
          backofficeUser: "sandbox-demo",
          isSeed: false,
        }),
      });
    } catch {
      /* non-fatal — poll will resync */
    }
  };

  const bumpTracker = (wagerAmt: number, pool: number, seed: number, house: number) => {
    setTracker((t) => ({
      spins: t.spins + 1,
      totalWager: t.totalWager + wagerAmt,
      cumPool: t.cumPool + pool,
      cumSeed: t.cumSeed + seed,
      cumHouse: t.cumHouse + house,
    }));
  };

  const resetTracker = () => {
    setTracker({ spins: 0, totalWager: 0, cumPool: 0, cumSeed: 0, cumHouse: 0 });
  };

  // ── Trigger spin ──────────────────────────────────────────────────────────
  const handleSpin = async () => {
    if (pools.length === 0 || spinning) return;
    const w = Number(wager);
    if (!Number.isFinite(w) || w <= 0) {
      setError("Wager must be a positive number");
      return;
    }
    setSpinning(true);
    setError(null);

    try {
      if (forceWin && activePool) {
        // Force-win flow remains single-pool against the currently visible pool.
        const body = buildConfigBody(activePool);
        const res = await fetch(
          `/api/v1/event/simulate-bet?externalRoll=1&wager=${w}&iterations=1`,
          { method: "POST", headers: headers(), body: JSON.stringify(body) },
        );
        if (!res.ok) throw new Error(`Simulate HTTP ${res.status}`);
        const json = (await res.json()) as {
          contribution?: { pool?: number; seed?: number; house?: number };
          totalContribution?: number;
        };
        const poolAdd = json.contribution?.pool ?? 0;
        const seedAdd = json.contribution?.seed ?? 0;
        const houseAdd = json.contribution?.house ?? 0;
        setLastSplit({
          pool: poolAdd,
          seed: seedAdd,
          house: houseAdd,
          totalContribution: json.totalContribution ?? 0,
          processedAt: new Date().toISOString(),
        });
        setPoolDisplays((d) => ({ ...d, [activePool.id]: (d[activePool.id] ?? 0) + poolAdd }));
        bumpTracker(w, poolAdd, seedAdd, houseAdd);
        await persistPoolGrowth(activePool.id, poolAdd);
        triggerCelebration();
      } else {
        // Multi-pool router: POST { wager } only, no jackpotId.
        const res = await fetch("/api/v1/event/bet", {
          method: "POST",
          headers: headers(),
          body: JSON.stringify({ wager: w }),
        });
        if (!res.ok) throw new Error(`Bet HTTP ${res.status}`);
        const json = (await res.json()) as {
          contribution?: { pool: number; seed: number; house: number };
          totalContribution?: number;
          perJackpot?: PerJackpotEntry[];
        };
        const per = json.perJackpot ?? [];

        // Aggregate only the slices for pools the user is currently opted into.
        let aggPool = 0;
        let aggSeed = 0;
        let aggHouse = 0;
        const poolDeltas: Record<number, number> = {};
        for (const e of per) {
          if (!optIns[e.jackpotId]) continue;
          aggPool += e.contribution.pool;
          aggSeed += e.contribution.seed;
          aggHouse += e.contribution.house;
          poolDeltas[e.jackpotId] = (poolDeltas[e.jackpotId] ?? 0) + e.contribution.pool;
        }

        setLastSplit({
          pool: aggPool,
          seed: aggSeed,
          house: aggHouse,
          totalContribution: aggPool + aggSeed + aggHouse,
          processedAt: new Date().toISOString(),
        });
        setPoolDisplays((d) => {
          const next = { ...d };
          for (const [id, add] of Object.entries(poolDeltas)) {
            next[Number(id)] = (next[Number(id)] ?? 0) + add;
          }
          return next;
        });
        bumpTracker(w, aggPool, aggSeed, aggHouse);
        await Promise.all(
          Object.entries(poolDeltas).map(([id, add]) =>
            persistPoolGrowth(Number(id), add),
          ),
        );
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSpinning(false);
    }
  };

  const triggerCelebration = () => {
    setCelebrating(true);
    setTimeout(() => setCelebrating(false), 4500);
  };

  // ── Opt-in/out handler with additive compliance interceptor ──────────────
  const handleOptToggle = () => {
    if (!activePool) return;
    const id = activePool.id;
    const currentlyIn = !!optIns[id];
    if (currentlyIn) {
      setOptIns((m) => ({ ...m, [id]: false }));
      return;
    }
    const rule = readOverlappingRule(activePool);
    const othersIn = pools.some((p) => p.id !== id && optIns[p.id]);
    if (rule === "additive" && othersIn) {
      setPendingOptIn(activePool);
      return;
    }
    setOptIns((m) => ({ ...m, [id]: true }));
  };

  const confirmPendingOptIn = () => {
    if (!pendingOptIn) return;
    setOptIns((m) => ({ ...m, [pendingOptIn.id]: true }));
    setPendingOptIn(null);
  };

  // ── ESC closes the compliance modal ──────────────────────────────────────
  useEffect(() => {
    if (!pendingOptIn) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPendingOptIn(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pendingOptIn]);

  const projectedFee = useMemo(() => {
    if (!pendingOptIn) return feePerSpin;
    return feePerSpin + (Number(pendingOptIn.contributionRate) || 0) * (Number(wager) || 0);
  }, [pendingOptIn, feePerSpin, wager]);

  // ── /simulate-bet body builder (force-win path) ──────────────────────────
  const buildConfigBody = (jp: Jackpot) => {
    const cfg = (jp.config ?? {}) as Record<string, unknown>;
    const v2 = (cfg.engineV2 ?? {}) as Record<string, unknown>;
    const tiers = (cfg.tiers as unknown[]) ?? undefined;
    return {
      id: jp.id,
      name: jp.name,
      enabled: jp.enabled,
      brandId: jp.brandId,
      type: "AVERAGE",
      structuralType: tiers && tiers.length > 0 ? "MULTI_LEVEL" : "CLASSIC",
      volatility: jp.volatility ?? 1,
      pool: {
        currentAmount: jp.poolBalance,
        minimumAmount: jp.seedAmount,
        maximumAmount: jp.triggerThreshold,
        contributionAmount: jp.contributionRate * 100,
        contributionType: "PERCENTAGE",
      },
      seed: {
        currentAmount: jp.seedAmount,
        targetAmount: jp.seedAmount,
        contributionAmount: 0,
        contributionType: "FIXED",
      },
      tiers,
      contribution:
        v2.contributionMode === "split"
          ? {
              mode: "split",
              totalContributionAmount: Number(v2.totalContributionAmount) || 0,
              totalContributionType: v2.totalContributionType ?? "FIXED",
              poolWeight: Number(v2.poolWeight) || 0,
              seedWeight: Number(v2.seedWeight) || 0,
              houseWeight: Number(v2.houseWeight) || 0,
              overlappingRule: v2.overlappingRule ?? "split",
            }
          : undefined,
    };
  };

  const multi = pools.length > 1;
  const optedInCount = optedInPools.length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <style>{confettiCss + widgetCss}</style>

      <header className="max-w-6xl mx-auto mb-6">
        <div className="text-xs uppercase tracking-widest text-emerald-400 mb-1">
          Hidden · Phase C
        </div>
        <h1 className="text-3xl font-bold">Sandbox Demo — Live Widget Proof</h1>
        <p className="text-slate-400 text-sm mt-1">
          Native player widget driven by real <code>/api/v1/jackpots</code> polling and the new
          multi-campaign <code>/api/v1/event/bet</code> router.
        </p>
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Player widget host ───────────────────────────────── */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 relative overflow-hidden min-h-[420px]">
          <div className="text-xs uppercase tracking-wider text-slate-400 mb-3">
            #jooba-container-root · {pools.length} pool{pools.length === 1 ? "" : "s"}
          </div>

          <div id="jooba-container-root" ref={widgetHostRef} className="flex justify-center">
            <div id="jooba-widget-wrapper" className="jooba-widget-wrapper">
              <div id="jooba-widget" className="jooba-widget">
                {/* Header with carousel chevrons */}
                <div id="jooba-widget-header" className="jooba-widget-header">
                  {multi && (
                    <button
                      className="jooba-icon-btn jooba-nav-btn"
                      onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
                      disabled={activeIndex === 0}
                      aria-label="Previous pool"
                    >
                      ‹
                    </button>
                  )}
                  <div id="jooba-widget-current-amount" className="jooba-widget-current-amount">
                    {activePool ? fmt(poolDisplays[activePool.id] ?? activePool.poolBalance) : texts.loading}
                  </div>
                  {multi ? (
                    <button
                      className="jooba-icon-btn jooba-nav-btn"
                      onClick={() => setActiveIndex((i) => Math.min(pools.length - 1, i + 1))}
                      disabled={activeIndex >= pools.length - 1}
                      aria-label="Next pool"
                    >
                      ›
                    </button>
                  ) : (
                    <div className="jooba-widget-actions-bar">
                      <button className="jooba-icon-btn" title="Info">?</button>
                    </div>
                  )}
                </div>

                {/* Body: carousel track */}
                <div id="jooba-widget-body" className="jooba-widget-body">
                  {celebrating ? (
                    <div className="jooba-celebration">
                      <div
                        className="jooba-win-message"
                        dangerouslySetInnerHTML={{ __html: texts.winMessage }}
                      />
                      <div className="jooba-confetti">
                        {Array.from({ length: 60 }).map((_, i) => (
                          <span key={i} style={{ ["--i" as never]: i }} />
                        ))}
                      </div>
                    </div>
                  ) : pools.length === 0 ? (
                    <div className="jooba-info-label">Awaiting jackpot…</div>
                  ) : (
                    <>
                      <div className="jooba-carousel">
                        <div
                          className="jooba-carousel-track"
                          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
                        >
                          {pools.map((p) => {
                            const rule = readOverlappingRule(p);
                            const inIt = !!optIns[p.id];
                            return (
                              <div className="jooba-slide" key={p.id}>
                                <div className="jooba-coin" aria-hidden>
                                  <span>€</span>
                                </div>
                                <div className="jooba-jackpot-name">{p.name}</div>
                                <div
                                  className={`jooba-badge ${rule === "additive" ? "jooba-badge-additive" : "jooba-badge-split"}`}
                                >
                                  {rule === "additive" ? "ADDITIVE" : "SPLIT"}
                                </div>
                                <div className="jooba-info-label">
                                  {inIt ? texts.userInLabel : texts.userOutLabel}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      {multi && (
                        <div className="jooba-dots">
                          {pools.map((p, i) => (
                            <button
                              key={p.id}
                              className={`jooba-dot ${i === activeIndex ? "jooba-dot-active" : ""}`}
                              onClick={() => setActiveIndex(i)}
                              aria-label={`Show pool ${p.name}`}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Footer: opt button + cumulative fee */}
                <div id="jooba-widget-footer" className="jooba-widget-footer">
                  <div id="jooba-widget-buttons-opt-wrapper" className="jooba-widget-buttons-opt-wrapper">
                    {activePool && (
                      activeOptedIn ? (
                        <button
                          id="jooba-widget-opt-out-button"
                          className="jooba-btn jooba-btn-secondary"
                          onClick={handleOptToggle}
                        >
                          {texts.optOutButton}
                        </button>
                      ) : (
                        <button
                          id="jooba-widget-opt-in-button"
                          className="jooba-btn jooba-btn-primary"
                          onClick={handleOptToggle}
                        >
                          {texts.optInButton}
                          {activeRule === "additive" ? " (Additive)" : ""}
                        </button>
                      )
                    )}
                  </div>
                  <div className="jooba-fee-row">
                    <span className="jooba-fee-label-prefix">Jackpot Fee:</span>
                    <span key={feePerSpin.toFixed(4)} className="jooba-fee-value">
                      {fmt(feePerSpin)} / spin
                    </span>
                    {optedInCount > 1 && (
                      <span className="jooba-fee-multi">(Multi-Pool active)</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Casino Simulator Panel ───────────────────────────── */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Casino Simulator Panel</h2>

          <div className="flex flex-col gap-1">
            <label className="text-xs uppercase tracking-wider text-slate-400">
              Brand ID (x-brand-id header)
            </label>
            <input
              type="text"
              value={brandId}
              onChange={(e) => saveBrand(e.target.value)}
              placeholder="paste brand id…"
              className="bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm font-mono"
            />
            <span className="text-[11px] text-slate-500 mt-1">
              Defaults to the admin mock brand (1).
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-slate-950/60 border border-slate-800 rounded p-3">
              <div className="text-xs uppercase text-slate-500">Enabled Pools</div>
              <div className="font-semibold">{pools.length}</div>
              <div className="text-xs text-slate-500">opted in: {optedInCount}</div>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 rounded p-3">
              <div className="text-xs uppercase text-slate-500">Visible Pool</div>
              <div className="font-semibold truncate">{activePool?.name ?? "—"}</div>
              <div className="text-xs text-slate-500 tabular-nums">
                {activePool ? fmt(poolDisplays[activePool.id] ?? activePool.poolBalance) : "—"}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs uppercase tracking-wider text-slate-400">
              Wager Amount (EUR)
            </label>
            <input
              type="number"
              min={0.01}
              step={0.5}
              value={wager}
              onChange={(e) => setWager(parseFloat(e.target.value) || 0)}
              className="bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm font-mono"
            />
          </div>

          <button
            onClick={handleSpin}
            disabled={pools.length === 0 || spinning}
            className="w-full py-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:cursor-not-allowed text-slate-950 font-bold text-lg transition"
          >
            {spinning ? "Spinning…" : `Trigger Game Spin (${fmt(wager)})`}
          </button>

          <label className="flex items-center justify-between bg-slate-950/40 border border-slate-800 rounded px-3 py-2 cursor-pointer">
            <span className="text-sm">
              <span className="text-slate-400">⚙ </span>
              Force Jackpot Win (visible pool)
              <span className="text-xs text-slate-500 block">
                Routes spin through <code>/simulate-bet?externalRoll=1</code>
              </span>
            </span>
            <input
              type="checkbox"
              checked={forceWin}
              onChange={(e) => setForceWin(e.target.checked)}
              className="h-5 w-5 accent-emerald-500"
            />
          </label>

          <div className="border-t border-slate-800 pt-4">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="text-xs uppercase tracking-wider text-slate-400">
                Last Aggregated Split (Multi-Campaign)
              </div>
              {lastSplit ? (
                <div className="text-[11px] tabular-nums text-slate-500">
                  {new Date(lastSplit.processedAt).toLocaleTimeString()}
                </div>
              ) : null}
            </div>
            {lastSplit ? (
              <div key={lastSplit.processedAt} className="grid grid-cols-3 gap-2 text-sm">
                <Split label="Pool" value={lastSplit.pool} color="text-emerald-400" />
                <Split label="Seed" value={lastSplit.seed} color="text-sky-400" />
                <Split label="House" value={lastSplit.house} color="text-amber-400" />
              </div>
            ) : (
              <div className="text-sm text-slate-500">No spins yet.</div>
            )}
          </div>

          <div className="border-t border-slate-800 pt-4 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs uppercase tracking-wider text-slate-400">
                Allocation Tracker (Σ opted-in pools)
              </div>
              <button
                onClick={resetTracker}
                className="text-[11px] text-slate-400 hover:text-slate-200 underline underline-offset-2"
              >
                Reset
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Stat label="Spins" value={String(tracker.spins)} />
              <Stat label="Total wagered" value={fmt(tracker.totalWager)} />
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <Split label="Σ Pool" value={tracker.cumPool} color="text-emerald-400" />
              <Split label="Σ Seed" value={tracker.cumSeed} color="text-sky-400" />
              <Split label="Σ House" value={tracker.cumHouse} color="text-amber-400" />
            </div>
          </div>

          {error && (
            <div className="bg-rose-950/60 border border-rose-800 text-rose-200 text-sm rounded p-3">
              {error}
            </div>
          )}
        </section>
      </div>

      {/* ── Double-contribution compliance modal ──────────────── */}
      {pendingOptIn && (
        <div
          className="jooba-modal-backdrop"
          onClick={() => setPendingOptIn(null)}
        >
          <div
            className="jooba-modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="jooba-modal-title">Double-Contribution Notice</div>
            <p className="jooba-modal-body">
              Enrolling in <strong>{pendingOptIn.name}</strong> will add an
              independent contribution fee per bet to fund this secondary prize pool.
              Your new total jackpot cost will be updated to{" "}
              <strong>{fmt(projectedFee)} per spin</strong>.
            </p>
            <div className="jooba-modal-actions">
              <button
                className="jooba-btn jooba-btn-secondary"
                onClick={() => setPendingOptIn(null)}
              >
                Cancel
              </button>
              <button
                className="jooba-btn jooba-btn-primary"
                onClick={confirmPendingOptIn}
              >
                Agree &amp; Join Both
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-950/60 border border-slate-800 rounded p-2 flex items-center justify-between">
      <span className="text-slate-500 uppercase text-[10px]">{label}</span>
      <span className="font-semibold tabular-nums text-slate-200">{value}</span>
    </div>
  );
}

function Split({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-slate-950/60 border border-slate-800 rounded p-2 text-center">
      <div className="text-[10px] uppercase text-slate-500">{label}</div>
      <div className={`font-semibold tabular-nums ${color}`}>{fmt(value)}</div>
    </div>
  );
}

// ── Inline CSS for the widget shell + confetti burst ────────────────────────
const widgetCss = `
.jooba-widget-wrapper { width: 320px; }
.jooba-widget {
  background: linear-gradient(160deg, #0f172a 0%, #1e293b 100%);
  border: 1px solid #334155;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,.4);
}
.jooba-widget-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px; background: rgba(0,0,0,.25);
  border-bottom: 1px solid #1e293b; gap: 8px;
}
.jooba-widget-current-amount {
  flex: 1; text-align: center;
  font-size: 22px; font-weight: 800; color: #facc15;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 0 12px rgba(250,204,21,.35);
}
.jooba-widget-actions-bar { display: flex; gap: 6px; }
.jooba-icon-btn {
  width: 26px; height: 26px; border-radius: 6px; border: 1px solid #334155;
  background: #0f172a; color: #94a3b8; font-size: 12px; cursor: pointer;
}
.jooba-nav-btn {
  width: 30px; height: 30px; font-size: 18px; line-height: 1;
  color: #e2e8f0;
}
.jooba-nav-btn:disabled { opacity: .35; cursor: not-allowed; }
.jooba-widget-body {
  padding: 18px 0 12px; display: flex; flex-direction: column;
  align-items: center; gap: 10px; min-height: 200px; position: relative;
  overflow: hidden;
}
.jooba-carousel { width: 100%; overflow: hidden; }
.jooba-carousel-track {
  display: flex; transition: transform 280ms ease;
}
.jooba-slide {
  flex: 0 0 100%; padding: 0 14px;
  display: flex; flex-direction: column; align-items: center; gap: 8px;
}
.jooba-coin {
  width: 88px; height: 88px; border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #fde047, #b45309);
  display: flex; align-items: center; justify-content: center;
  font-size: 44px; font-weight: 900; color: #422006;
  box-shadow: 0 0 30px rgba(250,204,21,.4), inset 0 -6px 0 rgba(0,0,0,.2);
  animation: jooba-spin 6s linear infinite;
}
@keyframes jooba-spin { to { transform: rotateY(360deg); } }
.jooba-jackpot-name { font-weight: 600; color: #e2e8f0; }
.jooba-badge {
  font-size: 10px; font-weight: 800; letter-spacing: .08em;
  padding: 2px 8px; border-radius: 999px; text-transform: uppercase;
}
.jooba-badge-split { background: rgba(16,185,129,.15); color: #6ee7b7; border: 1px solid rgba(16,185,129,.35); }
.jooba-badge-additive { background: rgba(244,114,182,.15); color: #f9a8d4; border: 1px solid rgba(244,114,182,.4); }
.jooba-info-label { font-size: 12px; color: #94a3b8; text-align: center; }
.jooba-dots { display: flex; gap: 6px; padding: 4px 0 0; }
.jooba-dot {
  width: 8px; height: 8px; border-radius: 50%; border: none;
  background: #334155; cursor: pointer; padding: 0;
}
.jooba-dot-active { background: #facc15; box-shadow: 0 0 8px rgba(250,204,21,.6); }

.jooba-widget-footer {
  padding: 12px 14px; border-top: 1px solid #1e293b; background: rgba(0,0,0,.15);
  display: flex; flex-direction: column; gap: 10px;
}
.jooba-widget-buttons-opt-wrapper { display: flex; gap: 8px; }
.jooba-btn {
  flex: 1; padding: 10px 14px; border-radius: 8px; border: none;
  font-weight: 700; cursor: pointer; font-size: 14px;
}
.jooba-btn-primary { background: #10b981; color: #022c22; }
.jooba-btn-secondary { background: #334155; color: #e2e8f0; }

.jooba-fee-row {
  display: flex; align-items: baseline; gap: 6px;
  font-size: 12px; color: #cbd5e1;
}
.jooba-fee-label-prefix { color: #94a3b8; }
.jooba-fee-value {
  font-weight: 800; color: #facc15; font-variant-numeric: tabular-nums;
  animation: jooba-fee-pulse 380ms ease;
}
.jooba-fee-multi {
  font-size: 10px; font-weight: 700; letter-spacing: .06em;
  color: #f9a8d4; text-transform: uppercase;
}
@keyframes jooba-fee-pulse {
  0% { transform: scale(.85); color: #fff; }
  60% { transform: scale(1.12); color: #fde047; }
  100% { transform: scale(1); color: #facc15; }
}

.jooba-celebration {
  position: relative; width: 100%; min-height: 180px;
  display: flex; align-items: center; justify-content: center;
}
.jooba-win-message {
  position: relative; z-index: 2; text-align: center;
  font-size: 22px; font-weight: 900; line-height: 1.2;
  color: #fde047; text-shadow: 0 0 20px rgba(250,204,21,.6);
  animation: jooba-pop 0.5s ease-out;
}
@keyframes jooba-pop {
  0% { transform: scale(0.4); opacity: 0; }
  60% { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(1); }
}

.jooba-modal-backdrop {
  position: fixed; inset: 0; background: rgba(2,6,23,.75);
  display: flex; align-items: center; justify-content: center;
  z-index: 100; padding: 20px;
  animation: jooba-fade-in 180ms ease;
}
.jooba-modal {
  background: linear-gradient(160deg, #1e293b 0%, #0f172a 100%);
  border: 1px solid #f472b6; border-radius: 14px;
  padding: 24px; max-width: 440px; width: 100%;
  box-shadow: 0 30px 80px rgba(0,0,0,.6), 0 0 40px rgba(244,114,182,.2);
  animation: jooba-modal-in 220ms cubic-bezier(.2,.9,.3,1.2);
}
.jooba-modal-title {
  font-size: 18px; font-weight: 800; color: #f9a8d4;
  margin-bottom: 10px;
}
.jooba-modal-body {
  font-size: 14px; line-height: 1.5; color: #cbd5e1; margin: 0 0 18px;
}
.jooba-modal-body strong { color: #facc15; }
.jooba-modal-actions { display: flex; gap: 10px; }
@keyframes jooba-fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes jooba-modal-in {
  from { transform: translateY(20px) scale(.95); opacity: 0; }
  to { transform: translateY(0) scale(1); opacity: 1; }
}
`;

const confettiCss = `
.jooba-confetti {
  position: absolute; inset: 0; overflow: hidden; pointer-events: none; z-index: 1;
}
.jooba-confetti span {
  position: absolute; top: 50%; left: 50%;
  width: 8px; height: 14px; border-radius: 2px;
  background: hsl(calc(var(--i) * 60deg), 90%, 60%);
  transform-origin: center;
  animation: jooba-burst 1.6s ease-out forwards;
  animation-delay: calc(var(--i) * 8ms);
}
@keyframes jooba-burst {
  0% { transform: translate(-50%, -50%) rotate(0deg) translateY(0) scale(1); opacity: 1; }
  100% {
    transform:
      translate(-50%, -50%)
      rotate(calc(var(--i) * 23deg))
      translateY(calc(-80px - (var(--i) * 2px)))
      rotate(720deg)
      scale(0.6);
    opacity: 0;
  }
}
`;
