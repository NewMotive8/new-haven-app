import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/sandbox-demo")({
  component: SandboxDemoPage,
});

// ── Native widget text dictionary (mirrored from src/Widget/.../texts.ts) ───────────────
const texts = {
  jackpotName: "",
  optInButton: "Opt in Jackpot",
  optOutButton: "Opt Out Jackpot",
  loading: "Loading...",
  errorDefaultMessage: "Sorry, Something went wrong, try again later.",
  userInLabel: "You are in, good luck!",
  userOutLabel: "You have opted out for this jackpot.",
  winMessage: "CONGRATS!<br/> YOU WON THE JACKPOT!",
  closeWidgetConfirmMessage: "have you sure?",
  communityJackpotWin: "This community jackpot had a won",
  jackpotWin: "This jackpot had a won",
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

type LedgerSplit = {
  pool: number;
  seed: number;
  house: number;
  totalContribution: number;
  processedAt: string;
};

const BRAND_KEY = "jackpot-brand-id";

function fmt(n: number, currency = "EUR") {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n);
  } catch {
    return `€${n.toFixed(2)}`;
  }
}

function SandboxDemoPage() {
  const [brandId, setBrandId] = useState<string>("1");
  const [active, setActive] = useState<Jackpot | null>(null);
  const [poolDisplay, setPoolDisplay] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [optedIn, setOptedIn] = useState(true);
  const [forceWin, setForceWin] = useState(false);
  const [wager, setWager] = useState<number>(1);
  const [lastSplit, setLastSplit] = useState<LedgerSplit | null>(null);
  const [tracker, setTracker] = useState<{
    startPool: number;
    spins: number;
    totalWager: number;
    cumPool: number;
    cumSeed: number;
    cumHouse: number;
  } | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const widgetHostRef = useRef<HTMLDivElement | null>(null);

  // ── Brand id bootstrap from localStorage ──────────────────────────────────
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

  // ── Poll /api/v1/jackpots every 2s and pick first enabled ────────────────
  useEffect(() => {
    if (!brandId) return;
    let cancelled = false;

    const tick = async () => {
      try {
        const res = await fetch("/api/v1/jackpots", { headers: headers() });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as Jackpot[];
        if (cancelled) return;
        const first = data.find((j) => j.enabled) ?? data[0] ?? null;
        if (first) {
          setActive(first);
          setPoolDisplay(first.poolBalance);
          setTracker((t) =>
            t ?? {
              startPool: first.poolBalance,
              spins: 0,
              totalWager: 0,
              cumPool: 0,
              cumSeed: 0,
              cumHouse: 0,
            },
          );
        }
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

  // ── Build the v2 JackpotConfigDTO body for /simulate-bet (mirrors bet.ts) ─
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
            }
          : undefined,
    };
  };

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
  // ── Allocation tracker helpers ────────────────────────────────────────────
  const bumpTracker = (wagerAmt: number, pool: number, seed: number, house: number) => {
    setTracker((t) =>
      t
        ? {
            ...t,
            spins: t.spins + 1,
            totalWager: t.totalWager + wagerAmt,
            cumPool: t.cumPool + pool,
            cumSeed: t.cumSeed + seed,
            cumHouse: t.cumHouse + house,
          }
        : t,
    );
  };

  const resetTracker = () => {
    setTracker({
      startPool: poolDisplay,
      spins: 0,
      totalWager: 0,
      cumPool: 0,
      cumSeed: 0,
      cumHouse: 0,
    });
  };


  // ── Trigger spin ──────────────────────────────────────────────────────────
  const handleSpin = async () => {
    if (!active || spinning) return;
    const w = Number(wager);
    if (!Number.isFinite(w) || w <= 0) {
      setError("Wager must be a positive number");
      return;
    }
    setSpinning(true);
    setError(null);
    try {
      if (forceWin) {
        const body = buildConfigBody(active);
        const res = await fetch(
          `/api/v1/event/simulate-bet?externalRoll=1&wager=${w}&iterations=1`,
          { method: "POST", headers: headers(), body: JSON.stringify(body) },
        );
        if (!res.ok) throw new Error(`Simulate HTTP ${res.status}`);
        const json = (await res.json()) as {
          contribution?: { pool?: number; seed?: number; house?: number };
          totalContribution?: number;
          drops?: unknown[];
          winners?: number;
        };
        const poolAdd = json.contribution?.pool ?? 0;
        setLastSplit({
          pool: poolAdd,
          seed: json.contribution?.seed ?? 0,
          house: json.contribution?.house ?? 0,
          totalContribution: json.totalContribution ?? 0,
          processedAt: new Date().toISOString(),
        });
        setPoolDisplay((p) => p + poolAdd);
        bumpTracker(w, poolAdd, json.contribution?.seed ?? 0, json.contribution?.house ?? 0);
        await persistPoolGrowth(active.id, poolAdd);
        // Forced roll = guaranteed hit
        triggerCelebration();
      } else {
        const res = await fetch("/api/v1/event/bet", {
          method: "POST",
          headers: headers(),
          body: JSON.stringify({ jackpotId: active.id, wager: w }),
        });
        if (!res.ok) throw new Error(`Bet HTTP ${res.status}`);
        const json = (await res.json()) as {
          contribution: { pool: number; seed: number; house: number };
          totalContribution: number;
          processedAt?: string;
          tierBreakdown?: Array<{ won?: boolean; amount?: number }>;
        };
        setLastSplit({
          pool: json.contribution.pool,
          seed: json.contribution.seed,
          house: json.contribution.house,
          totalContribution: json.totalContribution,
          processedAt: json.processedAt ?? new Date().toISOString(),
        });
        setPoolDisplay((p) => p + json.contribution.pool);
        bumpTracker(w, json.contribution.pool, json.contribution.seed, json.contribution.house);
        await persistPoolGrowth(active.id, json.contribution.pool);
        const won = json.tierBreakdown?.some((t) => t.won === true);
        if (won) triggerCelebration();
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <style>{confettiCss + widgetCss}</style>

      <header className="max-w-6xl mx-auto mb-6">
        <div className="text-xs uppercase tracking-widest text-emerald-400 mb-1">
          Hidden · Phase C
        </div>
        <h1 className="text-3xl font-bold">Sandbox Demo — Live Widget Proof</h1>
        <p className="text-slate-400 text-sm mt-1">
          Native player widget driven by real <code>/api/v1/jackpots</code> polling and{" "}
          <code>/api/v1/event/bet</code> transactions.
        </p>
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Player widget host ───────────────────────────────── */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 relative overflow-hidden min-h-[420px]">
          <div className="text-xs uppercase tracking-wider text-slate-400 mb-3">
            #jooba-container-root
          </div>

          <div id="jooba-container-root" ref={widgetHostRef} className="flex justify-center">
            <div id="jooba-widget-wrapper" className="jooba-widget-wrapper">
              <div id="jooba-widget" className="jooba-widget">
                <div id="jooba-widget-header" className="jooba-widget-header">
                  <div id="jooba-widget-current-amount" className="jooba-widget-current-amount">
                    {active ? fmt(poolDisplay) : texts.loading}
                  </div>
                  <div id="jooba-widget-actions-bar" className="jooba-widget-actions-bar">
                    <button className="jooba-icon-btn" title="Info">?</button>
                    <button className="jooba-icon-btn" title="Minimize">_</button>
                  </div>
                </div>

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
                  ) : (
                    <div id="jooba-widget-media-wrapper" className="jooba-widget-media-wrapper">
                      <div className="jooba-coin" aria-hidden>
                        <span>€</span>
                      </div>
                      <div className="jooba-jackpot-name">
                        {active?.name ?? "Awaiting jackpot…"}
                      </div>
                      <div className="jooba-info-label">
                        {optedIn ? texts.userInLabel : texts.userOutLabel}
                      </div>
                    </div>
                  )}
                </div>

                <div id="jooba-widget-footer" className="jooba-widget-footer">
                  <div id="jooba-widget-buttons-opt-wrapper" className="jooba-widget-buttons-opt-wrapper">
                    {optedIn ? (
                      <button
                        id="jooba-widget-opt-out-button"
                        className="jooba-btn jooba-btn-secondary"
                        onClick={() => setOptedIn(false)}
                      >
                        {texts.optOutButton}
                      </button>
                    ) : (
                      <button
                        id="jooba-widget-opt-in-button"
                        className="jooba-btn jooba-btn-primary"
                        onClick={() => setOptedIn(true)}
                      >
                        {texts.optInButton}
                      </button>
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
              <div className="text-xs uppercase text-slate-500">Active Jackpot</div>
              <div className="font-semibold truncate">{active?.name ?? "—"}</div>
              <div className="text-xs text-slate-500">id: {active?.id ?? "—"}</div>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 rounded p-3">
              <div className="text-xs uppercase text-slate-500">Pool Balance</div>
              <div className="font-semibold tabular-nums">
                {active ? fmt(poolDisplay) : "—"}
              </div>
              <div className="text-xs text-slate-500">polled every 2s</div>
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
            disabled={!active || spinning}
            className="w-full py-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:cursor-not-allowed text-slate-950 font-bold text-lg transition"
          >
            {spinning ? "Spinning…" : `Trigger Game Spin (${fmt(wager)})`}
          </button>

          <label className="flex items-center justify-between bg-slate-950/40 border border-slate-800 rounded px-3 py-2 cursor-pointer">
            <span className="text-sm">
              <span className="text-slate-400">⚙ </span>
              Force Jackpot Win
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
                Last Ledger Split (Engine v2)
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

          {error && (
            <div className="bg-rose-950/60 border border-rose-800 text-rose-200 text-sm rounded p-3">
              {error}
            </div>
          )}
        </section>
      </div>
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
  border-bottom: 1px solid #1e293b;
}
.jooba-widget-current-amount {
  font-size: 22px; font-weight: 800; color: #facc15;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 0 12px rgba(250,204,21,.35);
}
.jooba-widget-actions-bar { display: flex; gap: 6px; }
.jooba-icon-btn {
  width: 26px; height: 26px; border-radius: 6px; border: 1px solid #334155;
  background: #0f172a; color: #94a3b8; font-size: 12px; cursor: pointer;
}
.jooba-widget-body {
  padding: 22px 14px; display: flex; flex-direction: column;
  align-items: center; gap: 10px; min-height: 180px; position: relative;
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
.jooba-info-label { font-size: 12px; color: #94a3b8; }
.jooba-widget-footer { padding: 12px 14px; border-top: 1px solid #1e293b; background: rgba(0,0,0,.15); }
.jooba-widget-buttons-opt-wrapper { display: flex; gap: 8px; }
.jooba-btn {
  flex: 1; padding: 10px 14px; border-radius: 8px; border: none;
  font-weight: 700; cursor: pointer; font-size: 14px;
}
.jooba-btn-primary { background: #10b981; color: #022c22; }
.jooba-btn-secondary { background: #334155; color: #e2e8f0; }

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
