import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { TimeMachine, buildIsoTimestamp, defaultTimeMachine, type TimeMachineValue } from "./TimeMachine";
import { WinCelebration, type WinAnimationVariant, type WinInfo } from "./WinCelebration";
import { placeDemoBet } from "@/lib/demo/bet.functions";


type Jackpot = {
  id: number;
  name: string;
  enabled: boolean;
  poolBalance: number;
  seedAmount: number;
  contributionRate: number;
  brandId: string;
};

export type WidgetStyleKey = "slate" | "neon" | "pride-light";

const WIDGET_STYLES: { key: WidgetStyleKey; label: string }[] = [
  { key: "slate", label: "Slate (default)" },
  { key: "neon", label: "Neon Pop" },
  { key: "pride-light", label: "Pride Light" },
];

const WIN_ANIMATIONS: { key: WinAnimationVariant; label: string }[] = [
  { key: "default", label: "Default Confetti" },
  { key: "mega", label: "Mega Burst" },
  { key: "coin-storm", label: "Coin Storm" },
];

const fmt = (n: number, currency = "EUR") => {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n);
  } catch {
    return `€${n.toFixed(2)}`;
  }
};

export function QaOverlay({
  open,
  brandId,
  initialGameId,
  initialCategory,
  onClose,
}: {
  open: boolean;
  brandId: string;
  initialGameId: string;
  initialCategory: string;
  onClose: () => void;
}) {
  const [jackpots, setJackpots] = useState<Jackpot[]>([]);
  const [selectedJpId, setSelectedJpId] = useState<number | null>(null);
  const [optedIn, setOptedIn] = useState(false);
  const placeBet = useServerFn(placeDemoBet);

  const [gameId, setGameId] = useState(initialGameId);
  const [category, setCategory] = useState(initialCategory);
  const [wager, setWager] = useState(1);
  const [tm, setTm] = useState<TimeMachineValue>(() => defaultTimeMachine());
  const [widgetStyle, setWidgetStyle] = useState<WidgetStyleKey>("slate");
  const [winAnimation, setWinAnimation] = useState<WinAnimationVariant>("default");
  const [spinning, setSpinning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSplit, setLastSplit] = useState<{ pool: number; seed: number; house: number } | null>(null);
  const [win, setWin] = useState<WinInfo | null>(null);

  const [displayBalance, setDisplayBalance] = useState<number | null>(null);
  const displayFloorRef = useRef<number | null>(null);
  const selectedJpIdRef = useRef<number | null>(null);

  const headers = useCallback(
    (): HeadersInit => ({
      "Content-Type": "application/json",
      ...(brandId ? { "x-brand-id": brandId } : {}),
    }),
    [brandId],
  );

  useEffect(() => {
    if (!open) return;
    setGameId(initialGameId);
    setCategory(initialCategory);
    setOptedIn(false);
    setError(null);
    setLastSplit(null);
    displayFloorRef.current = null;
    setDisplayBalance(null);
  }, [open, initialGameId, initialCategory, brandId]);

  useEffect(() => {
    if (!open || !brandId) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch("/api/v1/jackpots", { headers: headers() });
        if (!res.ok) return;
        const data = (await res.json()) as Jackpot[];
        if (cancelled) return;
        const enabled = data.filter((j) => j.enabled);
        setJackpots(enabled);
        setSelectedJpId((cur) => {
          if (cur && enabled.some((j) => j.id === cur)) return cur;
          return enabled[0]?.id ?? null;
        });
      } catch {
        /* non-fatal */
      }
    };
    tick();
    const id = setInterval(tick, 2000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [open, brandId, headers]);

  useEffect(() => {
    selectedJpIdRef.current = selectedJpId;
  }, [selectedJpId]);

  useEffect(() => {
    if (selectedJpId == null) {
      setDisplayBalance(null);
      return;
    }
    const jp = jackpots.find((j) => j.id === selectedJpId);
    if (!jp) return;
    const floor = displayFloorRef.current;
    if (floor != null) {
      if (jp.poolBalance >= floor) {
        displayFloorRef.current = null;
        setDisplayBalance(jp.poolBalance);
      } else {
        setDisplayBalance((prev) => Math.max(prev ?? 0, floor));
      }
    } else {
      setDisplayBalance(jp.poolBalance);
    }
  }, [jackpots, selectedJpId]);

  const selectedJp = useMemo(
    () => jackpots.find((j) => j.id === selectedJpId) ?? null,
    [jackpots, selectedJpId],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !win) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, win]);

  const handleSpin = async () => {
    if (spinning || !selectedJp) return;
    const w = Number(wager);
    if (!Number.isFinite(w) || w <= 0) {
      setError("Wager must be a positive number");
      return;
    }
    setSpinning(true);
    setError(null);
    try {
      const clientTimestamp = buildIsoTimestamp(tm);
      const transactionId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `txn-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const payload: Record<string, unknown> = {
        transactionId,
        wager: w,
        gameId: gameId.trim() || "demo-game",
        category: category.trim() || undefined,
        jackpotId: selectedJp.id,
        clientTimestamp,
        clientTimezone: tm.timezone,
        playerSegments: [],
      };

      const res = await fetch("/api/v1/event/bet", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => ({}))) as {
        contribution?: { pool: number; seed: number; house: number };
        perJackpot?: Array<{ jackpotId: number; contribution: { pool: number; seed: number; house: number } }>;
        win?: {
          jackpotId: number;
          amount: number;
          isCommunity?: boolean;
          communitySize?: number;
          communityMemberPayOut?: number;
          triggeringPayout?: number;
          communityPool?: number;
          cappedDelta?: number;
        } | null;
        code?: string;
        message?: string;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(
          `Bet HTTP ${res.status}${json.code ? ` (${json.code})` : ""}${
            json.message || json.error ? `: ${json.message ?? json.error}` : ""
          }`,
        );
      }

      let poolAdd = 0;
      let seedAdd = 0;
      let houseAdd = 0;
      const per = json.perJackpot ?? [];
      const mine = per.find((e) => e.jackpotId === selectedJp.id);
      if (mine) {
        poolAdd = mine.contribution.pool;
        seedAdd = mine.contribution.seed;
        houseAdd = mine.contribution.house;
      } else if (json.contribution) {
        poolAdd = json.contribution.pool;
        seedAdd = json.contribution.seed;
        houseAdd = json.contribution.house;
      }
      setLastSplit({ pool: poolAdd, seed: seedAdd, house: houseAdd });

      if (poolAdd > 0) {
        setDisplayBalance((prev) => {
          const base = prev ?? selectedJp.poolBalance;
          const next = base + poolAdd;
          displayFloorRef.current = Math.max(displayFloorRef.current ?? -Infinity, next);
          return next;
        });
      }

      if (json.win) {
        const winJpName = jackpots.find((j) => j.id === json.win!.jackpotId)?.name;
        setWin({
          jackpotName: winJpName,
          amount: json.win.triggeringPayout ?? json.win.amount,
          community: json.win.isCommunity
            ? {
                triggeringPayout: json.win.triggeringPayout ?? 0,
                communityPool: json.win.communityPool ?? 0,
                communitySize: json.win.communitySize ?? 0,
                communityMemberPayOut: json.win.communityMemberPayOut ?? 0,
                cappedDelta: json.win.cappedDelta ?? 0,
              }
            : null,
        });
      } else {
        toast.success("Spin processed", {
          description: `Pool +${fmt(poolAdd)} · Seed +${fmt(seedAdd)} · House +${fmt(houseAdd)}`,
        });
      }
    } catch (e) {
      setError((e as Error).message);
      toast.error("Spin failed", { description: (e as Error).message });
    } finally {
      setSpinning(false);
    }
  };

  if (!open) return null;

  const widgetClasses: Record<WidgetStyleKey, string> = {
    slate: "from-slate-800 to-slate-950 border-slate-700",
    neon: "from-fuchsia-900 to-indigo-950 border-fuchsia-500/50 shadow-[0_0_40px_-10px_rgba(217,70,239,0.6)]",
    "pride-light": "from-amber-100 to-rose-100 border-rose-300 text-slate-900",
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        onClick={onClose}
      >
        <div
          className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl shadow-2xl my-8"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-emerald-400">
                QA Configuration
              </div>
              <h2 className="text-lg font-bold text-slate-100">Test Harness — {initialGameId}</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full border border-slate-700 text-slate-300 hover:bg-slate-800"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className="grid md:grid-cols-[320px_1fr] gap-6 p-6">
            <div className="flex flex-col gap-3">
              <div className="text-[10px] uppercase tracking-widest text-slate-400">
                Live Widget
              </div>
              <div
                className={`bg-gradient-to-b ${widgetClasses[widgetStyle]} border rounded-2xl p-5 flex flex-col items-center gap-3`}
              >
                <div className="text-xs uppercase tracking-widest opacity-70">
                  {selectedJp?.name ?? "No jackpot"}
                </div>
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-300 to-amber-700 flex items-center justify-center text-3xl font-black text-amber-950 shadow-[inset_0_-6px_0_rgba(0,0,0,0.2)]">
                  €
                </div>
                <div className="text-3xl font-black tabular-nums text-amber-400 drop-shadow">
                  {displayBalance != null ? fmt(displayBalance) : "—"}
                </div>
                <div className="text-[10px] opacity-60">Pool balance · live</div>
                <button
                  type="button"
                  onClick={() => setOptedIn((v) => !v)}
                  disabled={!selectedJp}
                  className={`w-full mt-2 rounded-lg px-3 py-2 font-bold text-sm transition disabled:opacity-50 ${
                    optedIn
                      ? "bg-slate-700 text-slate-200 hover:bg-slate-600"
                      : "bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
                  }`}
                >
                  {optedIn ? "Opt Out Jackpot" : "Opt in Jackpot"}
                </button>
                {optedIn && (
                  <div className="text-[10px] text-emerald-300">You are in, good luck!</div>
                )}
              </div>

              {lastSplit && (
                <div className="grid grid-cols-3 gap-1 text-[10px] uppercase">
                  <div className="bg-slate-950 border border-slate-800 rounded p-2 text-center">
                    <div className="text-slate-500">Pool</div>
                    <div className="text-emerald-400 font-bold tabular-nums">
                      +{fmt(lastSplit.pool)}
                    </div>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded p-2 text-center">
                    <div className="text-slate-500">Seed</div>
                    <div className="text-sky-400 font-bold tabular-nums">
                      +{fmt(lastSplit.seed)}
                    </div>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded p-2 text-center">
                    <div className="text-slate-500">House</div>
                    <div className="text-rose-400 font-bold tabular-nums">
                      +{fmt(lastSplit.house)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-xs text-slate-400">
                  Jackpot Campaign
                  <select
                    value={selectedJpId ?? ""}
                    onChange={(e) =>
                      setSelectedJpId(e.target.value ? Number(e.target.value) : null)
                    }
                    className="bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-slate-100 text-sm"
                  >
                    {jackpots.length === 0 && <option value="">No active jackpots</option>}
                    {jackpots.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.name} (€{j.poolBalance.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs text-slate-400">
                  Bet Size (EUR)
                  <input
                    type="number"
                    min={0.01}
                    step={0.01}
                    value={wager}
                    onChange={(e) => setWager(Number(e.target.value))}
                    className="bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-slate-100 text-sm"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs text-slate-400">
                  Game ID
                  <input
                    type="text"
                    value={gameId}
                    onChange={(e) => setGameId(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-slate-100 text-sm"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs text-slate-400">
                  Category
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-slate-100 text-sm"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs text-slate-400">
                  Widget Style
                  <select
                    value={widgetStyle}
                    onChange={(e) => setWidgetStyle(e.target.value as WidgetStyleKey)}
                    className="bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-slate-100 text-sm"
                  >
                    {WIDGET_STYLES.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs text-slate-400">
                  Win Animation
                  <select
                    value={winAnimation}
                    onChange={(e) => setWinAnimation(e.target.value as WinAnimationVariant)}
                    className="bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-slate-100 text-sm"
                  >
                    {WIN_ANIMATIONS.map((a) => (
                      <option key={a.key} value={a.key}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="border-t border-slate-800 pt-4">
                <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-2">
                  Time Machine
                </div>
                <TimeMachine value={tm} onChange={setTm} />
              </div>

              {error && (
                <div className="rounded bg-rose-950/50 border border-rose-700 px-3 py-2 text-xs text-rose-200">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={handleSpin}
                disabled={spinning || !selectedJp}
                className="relative mt-2 self-end px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-lg
                           text-amber-950 disabled:opacity-50 disabled:cursor-not-allowed
                           bg-gradient-to-b from-yellow-300 via-amber-400 to-amber-600
                           shadow-[0_8px_0_#78350f,0_12px_24px_rgba(245,158,11,0.5)]
                           hover:translate-y-0.5 hover:shadow-[0_6px_0_#78350f,0_10px_20px_rgba(245,158,11,0.5)]
                           active:translate-y-1.5 active:shadow-[0_2px_0_#78350f] transition"
              >
                {spinning ? "Spinning…" : `Spin €${Number(wager || 0).toFixed(2)}`}
              </button>
            </div>
          </div>
        </div>
      </div>
      <WinCelebration info={win} variant={winAnimation} onClose={() => setWin(null)} />
    </>
  );
}
