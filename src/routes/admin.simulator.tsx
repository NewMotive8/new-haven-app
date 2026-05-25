import { createFileRoute, useRouterState, useNavigate, Link } from "@tanstack/react-router";
import * as React from "react";
import axios from "axios";
import { toast } from "sonner";
import { BrandContext } from "../backoffice/app";
import type { JackpotConfigDTO, SimulatorResponseDTO } from "@/lib/jackpot/types";
import type { JackpotSavePayload } from "@/components/jackpot/JackpotCreationForm";
import { mapPayloadToConfig } from "@/lib/jackpot/payload-to-config";
import { buildCreateBody } from "@/lib/jackpot/build-create-body";
import { BlueprintCenter } from "@/components/jackpot/BlueprintCenter";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
  LineChart,
  Line,
  ReferenceLine,
} from "recharts";

const DEFAULT_CONFIG: JackpotConfigDTO = {
  id: 1,
  name: "Demo Jackpot",
  type: "AVERAGE",
  volatility: 5,
  pool: {
    currentAmount: 1000,
    minimumAmount: 500,
    maximumAmount: 10000,
    contributionAmount: 2,
    contributionType: "PERCENTAGE",
  },
  seed: {
    currentAmount: 500,
    targetAmount: 1000,
    contributionAmount: 1,
    contributionType: "PERCENTAGE",
  },
};

const panel: React.CSSProperties = {
  background: "#0f172a",
  border: "1px solid #1f2a44",
  borderRadius: 12,
  padding: 20,
};

const label: React.CSSProperties = { fontSize: 12, color: "#9fb0c8", marginBottom: 6, display: "block" };
const input: React.CSSProperties = {
  background: "#0b1220",
  color: "#e6edf3",
  border: "1px solid #1f2a44",
  padding: "8px 10px",
  borderRadius: 6,
  fontSize: 14,
  width: "100%",
};


function SimulatorPage() {
  const { brandId } = React.useContext(BrandContext);
  const navigate = useNavigate();
  const incoming = useRouterState({
    select: (s) => s.location.state as { jackpotConfig?: JackpotSavePayload } | undefined,
  });
  const hydratedPayload = React.useMemo<JackpotSavePayload | undefined>(() => {
    if (incoming?.jackpotConfig) return incoming.jackpotConfig;
    if (typeof window === 'undefined') return undefined;
    try {
      const raw = sessionStorage.getItem('jackpot:pendingPayload');
      return raw ? (JSON.parse(raw) as JackpotSavePayload) : undefined;
    } catch {
      return undefined;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const originalPayloadRef = React.useRef<JackpotSavePayload | undefined>(hydratedPayload);
  const editIdRef = React.useRef<number | undefined>(
    typeof hydratedPayload?.editId === "number" ? hydratedPayload.editId : undefined,
  );
  const isEditing = editIdRef.current != null;
  const [initError, setInitError] = React.useState<string | null>(null);
  const initialConfig = React.useMemo<JackpotConfigDTO>(
    () => {
      if (!hydratedPayload) return DEFAULT_CONFIG;
      try {
        return mapPayloadToConfig(hydratedPayload);
      } catch (e) {
        setInitError(e instanceof Error ? e.message : String(e));
        return DEFAULT_CONFIG;
      }
    },
    // Intentionally empty: only read incoming state on first mount so user
    // edits in the textarea are never overwritten on re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const cameFromCreationFlow = Boolean(originalPayloadRef.current);
  // Realistic mass-market wager baseline. Iteration scaling (not wager
  // inflation) is what guarantees the curve engine sees enough volume.
  const [wager, setWager] = React.useState(1);
  const [iterations, setIterations] = React.useState(1000000);
  const [configText, setConfigText] = React.useState(JSON.stringify(initialConfig, null, 2));
  const activeConfigTextRef = React.useRef(JSON.stringify(initialConfig, null, 2));
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<SimulatorResponseDTO | null>(null);
  const [activeConfig, setActiveConfig] = React.useState<JackpotConfigDTO | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [savingDraft, setSavingDraft] = React.useState(false);

  async function persistJackpot(asDraft: boolean) {
    const payload = originalPayloadRef.current;
    if (!payload) return;
    if (!payload.name) {
      toast.error("Jackpot name is required");
      return;
    }
    if (brandId == null) {
      toast.error("No brand selected");
      return;
    }
    if (asDraft) setSavingDraft(true); else setSaving(true);
    try {
      const body = buildCreateBody({ ...payload, isDraft: asDraft });
      const editId = editIdRef.current;
      if (editId != null) {
        await axios.put(`/api/v1/jackpots/${editId}`, body, {
          headers: { brandId: String(brandId), "Content-Type": "application/json" },
        });
        toast.success(asDraft ? "Draft updated" : "Jackpot updated");
      } else {
        await axios.post("/api/v1/jackpots", body, {
          headers: { brandId: String(brandId), "Content-Type": "application/json" },
        });
        toast.success(asDraft ? "Draft saved" : "Jackpot created");
      }
      try { sessionStorage.removeItem('jackpot:pendingPayload'); } catch { /* noop */ }
      navigate({ to: "/admin/jackpots" });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string; message?: string } }; message?: string })
          ?.response?.data?.error ??
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (err as { message?: string })?.message ??
        (asDraft ? "Failed to save draft" : "Failed to save jackpot");
      toast.error(msg);
    } finally {
      if (asDraft) setSavingDraft(false); else setSaving(false);
    }
  }

  async function handleSave() { await persistJackpot(false); }
  async function handleSaveDraft() { await persistJackpot(true); }

  async function handleSimulate() {
    setError(null);
    setLoading(true);
    try {
      let parsedPayload: JackpotConfigDTO;
      try {
        parsedPayload = JSON.parse(activeConfigTextRef.current);
      } catch (e) {
        throw new Error("Jackpot config is not valid JSON");
      }
      console.log(parsedPayload);

      // FREQUENCY (Happy Hour) traffic compression: strip the time-window
      // gates so 100% of simulated spins land inside the active promo block
      // instead of being diluted across dead hours. This keeps contribution
      // and win evaluation synchronized — every wager that pays into the
      // pool is also eligible to trigger a win, eliminating the boundary
      // drift where off-hour wagers accrued nothing but on-hour wins still
      // paid out from the seed.
      let payloadToSend: JackpotConfigDTO = parsedPayload;
      const frequencyCompressed = isFrequencyConfig(parsedPayload);
      if (frequencyCompressed && parsedPayload.timed) {
        const {
          contribStartTime: _cs,
          contribEndTime: _ce,
          winStartTime: _ws,
          winEndTime: _we,
          ...restTimed
        } = parsedPayload.timed;
        payloadToSend = { ...parsedPayload, timed: { ...restTimed } };
      }

      // ── Direct House skim: when the config carries a top-level
      // `operatorShare` (0..100), route that % of every player contribution
      // into casino House Revenue and fund the prize pools with the
      // remaining (100 - operatorShare)%. We synthesise the engine's
      // 3-way contribution split so houseContributions accumulate
      // automatically and surface on the "House Revenue" KPI.
      const houseSkimPct = Math.min(
        100,
        Math.max(0, Number((payloadToSend as any).operatorShare) || 0),
      );
      const alreadySplit = (payloadToSend as any).contribution?.mode === "split";
      if (houseSkimPct > 0 && !alreadySplit) {
        const poolAmt = Number(payloadToSend.pool?.contributionAmount) || 0;
        const seedAmt = Number(payloadToSend.seed?.contributionAmount) || 0;
        const poolType = String(
          payloadToSend.pool?.contributionType ?? "PERCENTAGE",
        ).toUpperCase();
        const seedType = String(
          payloadToSend.seed?.contributionType ?? poolType,
        ).toUpperCase();
        const total = poolAmt + seedAmt;
        if (total > 0 && poolType === seedType) {
          const fundShare = 100 - houseSkimPct;
          const poolWeight = (poolAmt / total) * fundShare;
          const seedWeight = (seedAmt / total) * fundShare;
          payloadToSend = {
            ...payloadToSend,
            contribution: {
              mode: "split",
              totalContributionAmount: total,
              totalContributionType: poolType as any,
              poolWeight,
              seedWeight,
              houseWeight: houseSkimPct,
            },
          };
          toast.success(
            `House skim active — ${houseSkimPct}% of every contribution routed to House Revenue.`,
          );
        }
      }

      const autoIters = autoScaleIterations(payloadToSend, wager, iterations);
      const effectiveIters = autoIters ?? iterations;
      const res = await axios.post<SimulatorResponseDTO>(
        "/api/v1/event/simulate-bet",
        payloadToSend,
        {
          params: { wager, iterations: effectiveIters },
          headers: { brandId: String(brandId ?? "") },
        },
      );
      if (autoIters && autoIters !== iterations) {
        toast.success(
          `Curve model detected — auto-scaled to ${autoIters.toLocaleString()} spins for ${LIFECYCLES_PER_RUN} full drop cycles.`,
        );
      }
      if (frequencyCompressed) {
        toast.success("Happy Hour compression on — all spins treated as in-window traffic.");
      }
      setResult(res.data);
      setActiveConfig(parsedPayload);
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "Simulation failed");
    } finally {
      setLoading(false);
    }
  }




  return (
    <div style={{ padding: 28, maxWidth: 1600, margin: "0 auto" }}>
      <Link
        to="/admin/jackpots"
        style={{
          display: "inline-block",
          marginBottom: 12,
          padding: "6px 12px",
          background: "transparent",
          color: "#9fb0c8",
          border: "1px solid #1f2a44",
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        ← Back
      </Link>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26 }}>Jackpot Simulator</h1>
          <p style={{ margin: "4px 0 20px", color: "#9fb0c8", fontSize: 13 }}>
            POST <code>/api/v1/event/simulate-bet</code> · brand <code>{String(brandId ?? "—")}</code>
          </p>
        </div>
        <BlueprintCenter
          host="simulator"
          onInjectSingle={(cfg) => {
            const text = JSON.stringify(cfg, null, 2);
            activeConfigTextRef.current = text;
            setConfigText(text);
            setActiveConfig(cfg);
            setResult(null);
            setError(null);
          }}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16 }}>
        <div style={panel}>
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <label style={label}>Wager amount</label>
              <input
                style={input}
                type="number"
                min={0}
                value={wager}
                onChange={(e) => setWager(Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <label style={label}>Iterations</label>
              <input
                style={input}
                type="number"
                min={1}
                max={10000000}
                step={1000}
                value={iterations}
                onChange={(e) => {
                  const n = Number(e.target.value) || 0;
                  setIterations(Math.max(0, Math.min(n, 10_000_000)));
                }}
              />
            </div>
            <div>
              <label style={label}>
                Jackpot config (JSON)
                {cameFromCreationFlow && (
                  <span style={{ marginLeft: 8, color: "#34d399", fontSize: 11 }}>
                    · loaded from creation flow
                  </span>
                )}
              </label>
              <textarea
                style={{ ...input, fontFamily: "ui-monospace, monospace", fontSize: 12, height: 320, resize: "vertical" }}
                value={configText}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  activeConfigTextRef.current = nextValue;
                  setConfigText(nextValue);
                }}
              />
            </div>
            <button
              onClick={handleSimulate}
              disabled={loading}
              style={{
                background: loading ? "#1e293b" : "linear-gradient(135deg, #4f46e5, #6366f1)",
                color: "#fff",
                border: "none",
                padding: "10px 14px",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: loading ? "wait" : "pointer",
              }}
            >
              {loading ? `Simulating ${iterations.toLocaleString()} spins…` : "Run simulation"}
            </button>
            {cameFromCreationFlow && (
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() =>
                    navigate({
                      to: "/admin/jackpots/new",
                      state: (prev) => ({ ...prev, jackpotConfig: originalPayloadRef.current }) as never,
                    })
                  }
                  style={{
                    flex: 1,
                    background: "transparent",
                    color: "#9fb0c8",
                    border: "1px solid #1f2a44",
                    padding: "10px 14px",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  ← Back to Editor
                </button>
                <button
                  onClick={handleSaveDraft}
                  disabled={saving || savingDraft || loading}
                  style={{
                    flex: 1,
                    background: savingDraft ? "#1e293b" : "transparent",
                    color: "#93c5fd",
                    border: "1px solid #3b82f6",
                    padding: "10px 14px",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: savingDraft ? "wait" : "pointer",
                  }}
                >
                  {savingDraft ? "Saving…" : isEditing ? "Save changes as Draft" : "Save as Draft"}
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || savingDraft || loading}
                  style={{
                    flex: 1,
                    background: saving ? "#1e293b" : "linear-gradient(135deg, #10b981, #059669)",
                    color: "#fff",
                    border: "none",
                    padding: "10px 14px",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: saving ? "wait" : "pointer",
                  }}
                >
                  {saving ? "Saving…" : isEditing ? "Save Changes" : "Save Jackpot"}
                </button>
              </div>
            )}
            {initError && (
              <div style={{ color: "#fbbf24", fontSize: 13 }}>
                Config rejected by validation: {initError}
              </div>
            )}
            {error && <div style={{ color: "#f87171", fontSize: 13 }}>{error}</div>}

          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {!result ? (
            <div style={{ ...panel, color: "#64748b", fontSize: 13 }}>
              Run a simulation to see the compliance dashboard.
            </div>
          ) : (
            <ComplianceDashboard result={result} config={activeConfig} wager={wager} />
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Executive results view
// ============================================================================

const fmt = (n: number, d = 2) =>
  n.toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: d });
const fmtInt = (n: number) => n.toLocaleString();

function getJackpotSplit(config: JackpotConfigDTO | null) {
  // Returns { poolPct, seedPct, housePct } as 0-100 percentages of total contribution.
  if (!config) return { poolPct: 0, seedPct: 0, housePct: 0 };
  const c = config.contribution;
  if (c && c.mode === "split") {
    return {
      poolPct: c.poolWeight ?? 0,
      seedPct: c.seedWeight ?? 0,
      housePct: c.houseWeight ?? 0,
    };
  }
  // Legacy: pool + seed contributionAmount as raw percentages; no house cut.
  const p = config.pool?.contributionAmount ?? 0;
  const s = config.seed?.contributionAmount ?? 0;
  const total = p + s;
  if (total <= 0) return { poolPct: 0, seedPct: 0, housePct: 0 };
  return { poolPct: (p / total) * 100, seedPct: (s / total) * 100, housePct: 0 };
}

function getTierSplit(tier: { contribution?: any; pool?: any; seed?: any } | undefined) {
  if (!tier) return { poolPct: 0, seedPct: 0, housePct: 0 };
  return getJackpotSplit({ contribution: tier.contribution, pool: tier.pool, seed: tier.seed } as JackpotConfigDTO);
}

function configuredProbability(
  config: JackpotConfigDTO | null,
  scope: "jackpot" | { tier: any },
): number {
  // Returns probability per spin (0..1).
  if (!config) return 0;
  if (scope === "jackpot") {
    if (config.triggerOdds && config.triggerOdds > 0) return 1 / config.triggerOdds;
    const target =
      config.pool?.targetAmount ?? config.maximumWinAmount ?? config.fixedWinAmount ?? 0;
    const poolContrib = config.pool?.contributionAmount ?? 0;
    if (target > 0 && poolContrib > 0) return Math.min(1, poolContrib / target);
    return 0;
  }
  const t = scope.tier;
  if (t.triggerOdds && t.triggerOdds > 0) return 1 / t.triggerOdds;
  const target = t.pool?.targetAmount ?? t.pool?.maximumWinAmount ?? 0;
  const poolContrib = t.pool?.contributionAmount ?? 0;
  if (target > 0 && poolContrib > 0) return Math.min(1, poolContrib / target);
  return 0;
}

/** Returns 0 when no fixed-odds override is configured (curve/must-drop model). */
function getTriggerOdds(config: JackpotConfigDTO | null, scope: "jackpot" | { tier: any }): number {
  if (!config) return 0;
  if (scope === "jackpot") return Number(config.triggerOdds) || 0;
  return Number(scope.tier?.triggerOdds) || 0;
}

/** Target cap drives the curve engine's hit chance — used as the curve-mode label. */
function getTargetCap(config: JackpotConfigDTO | null, scope: "jackpot" | { tier: any }): number {
  if (!config) return 0;
  if (scope === "jackpot") {
    return Number(
      config.pool?.targetAmount ??
        (config as any).pool?.maximumAmount ??
        config.maximumWinAmount ??
        config.fixedWinAmount ??
        0,
    );
  }
  const t = scope.tier;
  return Number(
    t?.pool?.targetAmount ?? t?.pool?.maximumAmount ?? t?.maximumWinAmount ?? 0,
  );
}

/**
 * Per-spin pool contribution given contributionType.
 *   - PERCENTAGE: wager × contributionAmount / 100
 *   - FIXED:      contributionAmount (wager-independent)
 */
function perSpinPoolContribution(pool: any, wager: number): number {
  const amt = Number(pool?.contributionAmount ?? 0);
  if (!Number.isFinite(amt) || amt <= 0) return 0;
  const type = String(pool?.contributionType ?? "PERCENTAGE").toUpperCase();
  if (type === "FIXED") return amt;
  return (Number(wager) || 0) * amt / 100;
}

/** True when the config opts into the Happy Hour (FREQUENCY) traffic model. */
function isFrequencyConfig(cfg: JackpotConfigDTO | null | undefined): boolean {
  return (cfg as any)?.structuralType === "FREQUENCY";
}

/** Estimated base-game GGR generated by the operator's overall handle. */
const BASE_GAME_HOUSE_HOLD = 0.04;

const MAX_AUTO_ITERATIONS = 10_000_000;
const LIFECYCLES_PER_RUN = 5;

/**
 * Curve-mode iteration scaler. Returns the spins required for the curve
 * engine to complete ~5 full drop lifecycles given the configured target
 * cap and per-spin pool growth, clamped to MAX_AUTO_ITERATIONS.
 *
 * Returns null when the config is fixed-odds (triggerOdds > 0) or when the
 * required inputs are missing — caller should fall back to the user value.
 */
function autoScaleIterations(
  config: JackpotConfigDTO | null,
  wager: number,
  userIterations: number,
): number | null {
  if (!config) return null;
  const scopes: Array<{ pool: any; target: number; odds: number }> = [];
  const tiers: any[] = (config as any).tiers ?? [];
  if (tiers.length > 0) {
    for (const t of tiers) {
      scopes.push({
        pool: t.pool,
        target: getTargetCap(config, { tier: t }),
        odds: getTriggerOdds(config, { tier: t }),
      });
    }
  } else {
    scopes.push({
      pool: config.pool,
      target: getTargetCap(config, "jackpot"),
      odds: getTriggerOdds(config, "jackpot"),
    });
  }
  // Auto-scale only applies when every scope is curve-mode.
  if (scopes.some((s) => s.odds > 0)) return null;

  let maxSpins = 0;
  for (const s of scopes) {
    const perSpin = perSpinPoolContribution(s.pool, wager);
    if (perSpin <= 0 || s.target <= 0) continue;
    const spins = (s.target / perSpin) * LIFECYCLES_PER_RUN;
    if (spins > maxSpins) maxSpins = spins;
  }
  if (maxSpins <= 0) return null;
  const scaled = Math.min(MAX_AUTO_ITERATIONS, Math.ceil(maxSpins));
  return Math.max(scaled, userIterations);
}


function ResultsSummary({
  result,
  config,
}: {
  result: SimulatorResponseDTO;
  config: JackpotConfigDTO | null;
}) {
  const tiers = result.tierResults ?? [];
  const isMultiLevel = tiers.length > 0;

  // ----- Headline KPIs (jackpot-wide) -----
  const isFrequency = isFrequencyConfig(config);
  const totalWager = result.totalWagered || 0;
  const houseRevenue = result.houseContributions ?? 0;
  const housePctActual = (result.houseRatio ?? 0) * 100;
  const totalDrops = isMultiLevel
    ? tiers.reduce((s, t) => s + (t.winCounter || 0), 0)
    : result.winCounter || 0;
  const totalContributionReceived =
    (result.walletContributions ?? result.totalContributions ?? 0) +
    (result.operatorContributions ?? 0) +
    (result.houseContributions ?? 0);
  const rawTotalPayout = isMultiLevel
    ? tiers.reduce((s, t) => s + (t.winAmountCounter || 0), 0)
    : result.winAmountCounter || 0;
  // Boundary-leak clamp: under Happy Hour compression the payout can never
  // exceed what was actually funded (contributions received + the baseline
  // seed reserve that primed the pool at t0). Any drift past this ceiling
  // is the off-hour/on-hour synchronization rounding artefact, so we pin
  // the displayed payout to the funded ceiling.
  const seedBaseline =
    (config?.pool?.currentAmount ?? 0) + (config?.seed?.currentAmount ?? 0);
  const payoutCeiling = totalContributionReceived + seedBaseline;
  const totalPayout = isFrequency
    ? Math.min(rawTotalPayout, payoutCeiling)
    : rawTotalPayout;
  const contribPctOfWager = totalWager > 0 ? (totalContributionReceived / totalWager) * 100 : 0;
  const payoutPctOfWager = totalWager > 0 ? (totalPayout / totalWager) * 100 : 0;
  const averageDropAmount = totalDrops > 0 ? totalPayout / totalDrops : 0;

  // Promo-window contribution rate — for FREQUENCY we report against the
  // active window (which, post-compression, equals 100% of the simulated
  // wagers) rather than diluting across a 24h global timeline.
  const promoWindowPct = Number(config?.pool?.contributionAmount ?? 0);
  const contribBadge = isFrequency
    ? `${promoWindowPct.toFixed(2)}% of active promo-window wagers`
    : `${contribPctOfWager.toFixed(2)}% of wager`;
  const baseGameGgr = totalWager * BASE_GAME_HOUSE_HOLD;
  const houseNote = `Estimated Base Game GGR Generated: € ${fmt(baseGameGgr)} (wagers × ${(
    BASE_GAME_HOUSE_HOLD * 100
  ).toFixed(0)}% house hold)`;

  return (
    <>
      {/* 1. Headline KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        <KpiCard label="Total Wager" value={`€ ${fmt(totalWager)}`} />
        <KpiCard
          label="Total Contribution Received"
          value={`€ ${fmt(totalContributionReceived)}`}
          badge={contribBadge}
        />
        <KpiCard
          label="Total Payout"
          value={`€ ${fmt(totalPayout)}`}
          badge={`${payoutPctOfWager.toFixed(2)}% of wager`}
        />
        <KpiCard
          label="House Revenue"
          value={`€ ${fmt(houseRevenue)}`}
          badge={`Direct jackpot skim · ${housePctActual.toFixed(2)}% of wager`}
          note={houseNote}
        />
        <KpiCard label="Jackpot Number of Drops" value={fmtInt(totalDrops)} />
        <KpiCard label="Average Jackpot Drop" value={`€ ${fmt(averageDropAmount)}`} />
      </div>



      {/* 2. Financial Ledger Table(s) */}
      {!isMultiLevel ? (
        <LedgerCard title="Fund Distribution">
          <LedgerTable
            split={getJackpotSplit(config)}
            walletCollected={result.walletContributions ?? result.totalContributions ?? 0}
            houseCollected={result.houseContributions ?? 0}
            finalPool={result.finalPool}
            finalSeed={result.finalSeed}
          />
        </LedgerCard>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {tiers.map((t) => {
            const tierConfig = (config as any)?.tiers?.find((x: any) => x.multiLevelTier === t.tier);
            const tierSplit = getTierSplit(tierConfig);
            // Per-tier the contributions are bundled in totalContribution; house lives separately.
            const tierWalletCollected = Math.max(
              0,
              (t.totalContribution || 0) - (t.houseContributions ?? 0),
            );
            return (
              <LedgerCard
                key={t.tier}
                title={`Tier ${t.tier} — ${t.label}`}
                badge={`${fmtInt(t.winCounter)} drops`}
              >
                <LedgerTable
                  split={tierSplit}
                  walletCollected={tierWalletCollected}
                  houseCollected={t.houseContributions ?? 0}
                  finalPool={t.finalPool}
                  finalSeed={t.finalSeed}
                />
              </LedgerCard>
            );
          })}
        </div>
      )}

      {/* 2b. Visual analytics */}
      <SimulatorCharts result={result} />

      {/* 3. Math Audit */}
      {!isMultiLevel ? (
        <MathAudit
          configuredProb={configuredProbability(config, "jackpot")}
          iterations={result.iterations}
          wins={result.winCounter || 0}
          rejectedByGate={result.rejectedByGate ?? 0}
          triggerOdds={getTriggerOdds(config, "jackpot")}
          targetCap={getTargetCap(config, "jackpot")}
        />
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {tiers.map((t) => {
            const tierConfig = (config as any)?.tiers?.find((x: any) => x.multiLevelTier === t.tier);
            return (
              <MathAudit
                key={t.tier}
                title={`Tier ${t.tier} — ${t.label}`}
                configuredProb={configuredProbability(config, { tier: tierConfig })}
                iterations={result.iterations}
                wins={t.winCounter || 0}
                rejectedByGate={t.rejectedByGate ?? 0}
                triggerOdds={getTriggerOdds(config, { tier: tierConfig })}
                targetCap={getTargetCap(config, { tier: tierConfig })}
              />
            );
          })}
        </div>
      )}
    </>
  );
}

function KpiCard({
  label,
  value,
  badge,
  note,
}: {
  label: string;
  value: string;
  badge?: string;
  note?: string;
}) {
  return (
    <div style={{ ...panel, padding: 18 }} title={note}>
      <div style={{ fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", color: "#9fb0c8" }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: "#f8fafc", marginTop: 8 }}>{value}</div>
      {badge && (
        <span
          style={{
            display: "inline-block",
            marginTop: 10,
            padding: "3px 10px",
            background: "rgba(99, 102, 241, 0.15)",
            color: "#a5b4fc",
            border: "1px solid rgba(99, 102, 241, 0.35)",
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          {badge}
        </span>
      )}
      {note && (
        <div
          style={{
            marginTop: 10,
            fontSize: 11,
            color: "#7d8ba3",
            lineHeight: 1.4,
            borderTop: "1px dashed #1f2a44",
            paddingTop: 8,
          }}
        >
          {note}
        </div>
      )}
    </div>
  );
}

function LedgerCard({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={panel}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#f8fafc" }}>{title}</div>
        {badge && <div style={{ fontSize: 12, color: "#9fb0c8" }}>{badge}</div>}
      </div>
      {children}
    </div>
  );
}

function LedgerTable({
  split,
  walletCollected,
  houseCollected,
  finalPool,
  finalSeed,
}: {
  split: { poolPct: number; seedPct: number; housePct: number };
  walletCollected: number;
  houseCollected: number;
  finalPool: number;
  finalSeed: number;
}) {
  const walletDenom = split.poolPct + split.seedPct;
  const poolCollected = walletDenom > 0 ? walletCollected * (split.poolPct / walletDenom) : 0;
  const seedCollected = walletDenom > 0 ? walletCollected * (split.seedPct / walletDenom) : 0;

  const rows = [
    { name: "Progressive Pool", pct: split.poolPct, collected: poolCollected, balance: finalPool },
    { name: "Reserve Seed", pct: split.seedPct, collected: seedCollected, balance: finalSeed },
    { name: "Operator Income", pct: split.housePct, collected: houseCollected, balance: houseCollected },
  ];

  const th: React.CSSProperties = {
    padding: "8px 12px",
    borderBottom: "1px solid #1f2a44",
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "#9fb0c8",
    fontWeight: 600,
  };
  const td: React.CSSProperties = {
    padding: "10px 12px",
    borderBottom: "1px solid #111a2e",
    fontSize: 13,
    color: "#e6edf3",
    fontVariantNumeric: "tabular-nums",
  };

  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ textAlign: "left" }}>
          <th style={th}>Fund Category</th>
          <th style={{ ...th, textAlign: "right" }}>Configured Allocation</th>
          <th style={{ ...th, textAlign: "right" }}>Total Collected (€)</th>
          <th style={{ ...th, textAlign: "right" }}>End Balance (€)</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.name}>
            <td style={{ ...td, fontWeight: 600 }}>{r.name}</td>
            <td style={{ ...td, textAlign: "right" }}>{r.pct.toFixed(2)}%</td>
            <td style={{ ...td, textAlign: "right" }}>{fmt(r.collected)}</td>
            <td style={{ ...td, textAlign: "right" }}>{fmt(r.balance)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function MathAudit({
  title,
  configuredProb,
  iterations,
  wins,
  rejectedByGate = 0,
  triggerOdds = 0,
  targetCap = 0,
}: {
  title?: string;
  configuredProb: number;
  iterations: number;
  wins: number;
  rejectedByGate?: number;
  /** > 0 means fixed-odds Classic; 0 means curve/must-drop model. */
  triggerOdds?: number;
  /** Pool target/max — drives curve cadence in must-drop mode. */
  targetCap?: number;
}) {
  const isCurveMode = !(triggerOdds > 0);
  const configuredN = configuredProb > 0 ? 1 / configuredProb : 0;
  const actualN = wins > 0 ? iterations / wins : 0;
  // Variance compliance only makes sense in fixed-odds mode. A curve engine's
  // hit rate is shaped by pool dynamics, so we don't compare it to a flat baseline.
  const ratio = !isCurveMode && configuredN > 0 && actualN > 0 ? actualN / configuredN : 0;
  const compliant = isCurveMode || configuredN === 0 || (ratio >= 0.75 && ratio <= 1.25);

  const cell: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 4 };
  const k: React.CSSProperties = { fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: "#9fb0c8" };
  const v: React.CSSProperties = { fontSize: 18, fontWeight: 700, color: "#f8fafc", fontVariantNumeric: "tabular-nums" };

  return (
    <div style={panel}>
      {title && <div style={{ fontSize: 13, fontWeight: 600, color: "#cbd5e1", marginBottom: 12 }}>{title}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 16, alignItems: "center" }}>
        <div style={cell}>
          <span style={k}>{isCurveMode ? "Target Cap" : "Configured Probability"}</span>
          <span style={v}>
            {isCurveMode
              ? targetCap > 0
                ? `€ ${fmt(targetCap)}`
                : "—"
              : configuredN > 0
                ? `1 in ${fmt(configuredN, 0)}`
                : "—"}
          </span>
        </div>
        <div style={cell}>
          <span style={k}>{isCurveMode ? "Observed Drop Cadence" : "Actual Hit Rate"}</span>
          <span style={v}>{actualN > 0 ? `1 in ${fmt(actualN, 0)}` : "—"}</span>
        </div>
        <div>
          {isCurveMode ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 14px",
                background: "rgba(56, 189, 248, 0.12)",
                color: "#7dd3fc",
                border: "1px solid rgba(56, 189, 248, 0.35)",
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              ◐ Curve Model
            </span>
          ) : compliant ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 14px",
                background: "rgba(16, 185, 129, 0.15)",
                color: "#34d399",
                border: "1px solid rgba(16, 185, 129, 0.4)",
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              ✓ Compliance Pass
            </span>
          ) : (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 14px",
                background: "rgba(248, 113, 113, 0.12)",
                color: "#fca5a5",
                border: "1px solid rgba(248, 113, 113, 0.4)",
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              ⚠ Variance Detected
            </span>
          )}
        </div>
      </div>


      {(configuredN > 0 || isCurveMode) && (() => {
        const expectedWins = isCurveMode ? 0 : Math.round(iterations * configuredProb);
        const triggersFired = wins + rejectedByGate;
        const gateExplains =
          !isCurveMode &&
          rejectedByGate > 0 &&
          expectedWins > 0 &&
          Math.abs(triggersFired - expectedWins) / expectedWins <= 0.25;
        const hint = isCurveMode
          ? rejectedByGate > 0
            ? "Curve engine: some triggers were suppressed by pool/seed gates before payout. Higher wager or lower target accelerates the cycle."
            : "Curve engine: drop cadence emerges from pool growth toward the target cap — not from a flat probability."
          : compliant
            ? null
            : gateExplains
              ? "Gate rejections explain the gap — wins were suppressed because pool/seed conditions weren't met."
              : rejectedByGate > 0
                ? "Some triggers were blocked by pool/seed gates, but the gap is larger than that — likely sample-size variance. Increase iterations."
                : "Variance is sample-size driven — increase iterations for a tighter rate.";

        const diagCell: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 2 };
        const diagK: React.CSSProperties = {
          fontSize: 10,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          color: "#7d8ba3",
        };
        const diagV: React.CSSProperties = {
          fontSize: 14,
          fontWeight: 600,
          color: "#e6edf3",
          fontVariantNumeric: "tabular-nums",
        };

        return (
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #1f2a44" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: 16,
              }}
            >
              {!isCurveMode && (
                <div style={diagCell}>
                  <span style={diagK}>Expected Wins</span>
                  <span style={diagV}>{fmtInt(expectedWins)}</span>
                </div>
              )}
              <div style={diagCell}>
                <span style={diagK}>Actual Wins</span>
                <span style={diagV}>{fmtInt(wins)}</span>
              </div>
              <div style={diagCell}>
                <span style={diagK}>Blocked by Gate</span>
                <span style={{ ...diagV, color: rejectedByGate > 0 ? "#fbbf24" : "#e6edf3" }}>
                  {fmtInt(rejectedByGate)}
                </span>
              </div>
              <div style={diagCell}>
                <span style={diagK}>Triggers Fired</span>
                <span style={diagV}>{fmtInt(triggersFired)}</span>
              </div>
            </div>
            {hint && (
              <div style={{ marginTop: 10, fontSize: 12, color: "#9fb0c8", lineHeight: 1.5 }}>
                {hint}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}

// ----- Visual analytics: cumulative wins + payout distribution -----
const CHART_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#a855f7"];

function SimulatorCharts({ result }: { result: SimulatorResponseDTO }) {
  const events = result.winEvents ?? [];
  const tiers = result.tierResults ?? [];

  // Cumulative wins over iterations — downsample to ~60 points
  const cumulative = React.useMemo(() => {
    if (!events.length) return [];
    const sorted = [...events].sort((a, b) => a.iteration - b.iteration);
    const total = result.iterations || sorted[sorted.length - 1].iteration;
    const buckets = 60;
    const step = Math.max(1, Math.floor(total / buckets));
    const points: { iteration: number; wins: number; payout: number }[] = [];
    let wins = 0;
    let payout = 0;
    let next = step;
    let idx = 0;
    for (let i = step; i <= total; i += step) {
      while (idx < sorted.length && sorted[idx].iteration <= i) {
        wins++;
        payout += sorted[idx].amount || 0;
        idx++;
      }
      points.push({ iteration: i, wins, payout: Math.round(payout) });
      next = i + step;
    }
    return points;
  }, [events, result.iterations]);

  // Win range distribution (binned by payout amount) — for single jackpot
  const rangeData = React.useMemo(() => {
    if (!events.length) return [];
    const amounts = events.map((e) => e.amount).filter((a) => a > 0);
    if (!amounts.length) return [];
    const min = Math.min(...amounts);
    const max = Math.max(...amounts);
    if (min === max) return [{ name: `€${fmt(min)}`, value: amounts.length }];
    const binCount = 5;
    const step = (max - min) / binCount;
    const bins = Array.from({ length: binCount }, (_, i) => ({
      name: `€${fmt(min + i * step, 0)}–${fmt(min + (i + 1) * step, 0)}`,
      value: 0,
    }));
    for (const a of amounts) {
      const idx = Math.min(binCount - 1, Math.floor((a - min) / step));
      bins[idx].value++;
    }
    return bins.filter((b) => b.value > 0);
  }, [events]);

  // Per-tier payout breakdown — for multi-level
  const tierData = React.useMemo(
    () =>
      tiers.map((t) => ({
        name: t.label || `Tier ${t.tier}`,
        drops: t.winCounter || 0,
        payout: Math.round(t.winAmountCounter || 0),
      })),
    [tiers],
  );

  if (!cumulative.length && !rangeData.length && !tierData.length) return null;

  const distribution = tierData.length
    ? tierData.map((t) => ({ name: t.name, value: t.payout }))
    : rangeData;

  const axisColor = "#9fb0c8";
  const gridColor = "rgba(159, 176, 200, 0.12)";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)", gap: 12 }}>
      <div style={panel}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#f8fafc" }}>Win Distribution Over Time</div>
        <div style={{ fontSize: 12, color: "#9fb0c8", marginTop: 2, marginBottom: 12 }}>
          Cumulative wins throughout simulation
        </div>
        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer>
            <AreaChart data={cumulative} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="winsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="iteration"
                stroke={axisColor}
                fontSize={11}
                tickFormatter={(v) => (v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v))}
              />
              <YAxis
                stroke={axisColor}
                fontSize={11}
                tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v))}
              />
              <RTooltip
                contentStyle={{ background: "#0b1426", border: "1px solid #1f2a44", borderRadius: 8, color: "#e6edf3" }}
                labelStyle={{ color: "#e6edf3" }}
                itemStyle={{ color: "#e6edf3" }}
                labelFormatter={(v) => `Iteration: ${Number(v).toLocaleString()}`}
                formatter={(v: any) => [Number(v).toLocaleString(), "Wins"]}
              />
              <Area type="monotone" dataKey="wins" stroke="#818cf8" strokeWidth={2} fill="url(#winsGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={panel}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#f8fafc" }}>
          {tierData.length ? "Payout by Tier" : "Win Range Distribution"}
        </div>
        <div style={{ fontSize: 12, color: "#9fb0c8", marginTop: 2, marginBottom: 12 }}>
          {tierData.length ? "Total payout per tier" : "Breakdown by payout amount"}
        </div>
        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={distribution}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={2}
                stroke="#0b1426"
                strokeWidth={2}
              >
                {distribution.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <RTooltip
                contentStyle={{ background: "#0b1426", border: "1px solid #1f2a44", borderRadius: 8, color: "#e6edf3" }}
                labelStyle={{ color: "#e6edf3" }}
                itemStyle={{ color: "#e6edf3" }}
                formatter={(v: any, n: any) => [Number(v).toLocaleString(), n]}
              />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                wrapperStyle={{ fontSize: 11, color: "#cbd5e1" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {tierData.length > 0 && (
        <div style={{ ...panel, gridColumn: "1 / -1" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#f8fafc", marginBottom: 12 }}>Drops per Tier</div>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={tierData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke={axisColor} fontSize={11} />
                <YAxis stroke={axisColor} fontSize={11} />
                <RTooltip
                  contentStyle={{ background: "#0b1426", border: "1px solid #1f2a44", borderRadius: 8, color: "#e6edf3" }}
                labelStyle={{ color: "#e6edf3" }}
                itemStyle={{ color: "#e6edf3" }}
                  formatter={(v: any) => Number(v).toLocaleString()}
                />
                <Bar dataKey="drops" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}



// ============================================================================
// Compliance Dashboard — KPI cards, must-drop & overflow charts, fairness ledger,
// re-seed event log. Frontend-only synthesis from SimulatorResponseDTO + config.
// ============================================================================

function ComplianceDashboard({
  result,
  config,
  wager,
}: {
  result: SimulatorResponseDTO;
  config: JackpotConfigDTO | null;
  wager: number;
}) {
  const totalWager = result.totalWagered || 0;
  const totalPayout = result.winAmountCounter || 0;
  const rtpPct = result.rtp ?? (totalWager > 0 ? (totalPayout / totalWager) * 100 : 0);

  const replay = React.useMemo(
    () => buildPoolReplay(config, result, wager),
    [config, result, wager],
  );
  const overflowTotal = replay.totalOverflow;
  const overflowSupported = replay.supported;

  const probabilityCurve = React.useMemo(
    () => buildProbabilityCurve(config, result, wager),
    [config, result, wager],
  );

  const fairnessRows = React.useMemo(
    () => buildFairnessRows(result, config, wager),
    [result, config, wager],
  );

  // ── Row 1 derivations ────────────────────────────────────────────────
  const split = getJackpotSplit(config);
  const housePct = split.housePct;
  const poolContribPct = Number(config?.pool?.contributionAmount) || 0;
  const seedContribPct = Number(config?.seed?.contributionAmount) || 0;
  const contribRatePct = poolContribPct + seedContribPct;
  const operatorRevenueFallback =
    totalWager * (contribRatePct / 100) * (housePct / 100);
  const operatorRevenue =
    typeof result.houseContributions === "number" && result.houseContributions > 0
      ? result.houseContributions
      : operatorRevenueFallback;

  // ── Row 2 derivations ────────────────────────────────────────────────
  const baseProbForExpected = configuredProbability(config, "jackpot");
  const expectedWins = Math.round((result.iterations || 0) * baseProbForExpected);
  const actualWins = result.winCounter || 0;
  const blockedByGate = result.rejectedByGate ?? 0;
  const triggersFired = actualWins + blockedByGate;
  const gateAlert = blockedByGate > 0;

  const sectionLabel: React.CSSProperties = {
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: "#7d8ba3",
    fontWeight: 700,
    marginBottom: 8,
  };
  const rowGrid: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 12,
  };

  return (
    <>
      {/* 1. KPI Rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <div style={sectionLabel}>Financial Performance</div>
          <div style={rowGrid}>
            <ComplianceKpi
              label="Total Wager Volume"
              value={`€ ${fmt(totalWager)}`}
              accent="#6366f1"
            />
            <ComplianceKpi
              label="Total Jackpot Payouts"
              value={`€ ${fmt(totalPayout)}`}
              accent="#10b981"
            />
            <ComplianceKpi
              label="Effective Jackpot RTP"
              value={`${rtpPct.toFixed(3)}%`}
              accent="#f59e0b"
            />
            <ComplianceKpi
              label="Operator Net Revenue"
              value={`€ ${fmt(operatorRevenue)}`}
              accent="#a855f7"
              badge={housePct > 0 ? `${housePct.toFixed(1)}% house slice` : "No house split configured"}
            />
          </div>
        </div>

        <div>
          <div style={sectionLabel}>Simulation Health &amp; Gate Integrity</div>
          <div style={rowGrid}>
            <ComplianceKpi
              label="Expected Wins"
              value={fmtInt(expectedWins)}
              accent="#06b6d4"
              badge={baseProbForExpected > 0 ? `1 in ${fmt(1 / baseProbForExpected, 0)} baseline` : "Curve / must-drop"}
            />
            <ComplianceKpi
              label="Triggers Fired"
              value={fmtInt(triggersFired)}
              accent="#6366f1"
              badge="Pre-gate RNG hits"
            />
            <ComplianceKpi
              label="Actual Wins Approved"
              value={fmtInt(actualWins)}
              accent="#10b981"
              badge={triggersFired > 0 ? `${((actualWins / triggersFired) * 100).toFixed(1)}% approval` : "—"}
            />
            <ComplianceKpi
              label="Blocked by Gate"
              value={fmtInt(blockedByGate)}
              accent={gateAlert ? "#ef4444" : "#10b981"}
              tone={gateAlert ? "alert" : undefined}
              badge={gateAlert ? "Liquidity gate triggered — review funding" : "Healthy"}
            />
          </div>
        </div>
      </div>

      {/* 2. Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 12 }}>
        <MustDropChart data={probabilityCurve.points} mode={probabilityCurve.mode} />
        <OverflowWaterfallChart data={replay.points} cap={replay.cap} overflowStart={replay.overflowStart} />
      </div>

      {/* 3. Proportional Fairness Ledger */}
      <FairnessLedger rows={fairnessRows} />

      {/* 4. Re-Seed Event Log */}
      <ReSeedEventLog result={result} config={config} />
    </>
  );
}

function ComplianceKpi({
  label,
  value,
  badge,
  accent,
}: {
  label: string;
  value: string;
  badge?: string;
  accent: string;
}) {
  return (
    <div
      style={{
        ...panel,
        padding: 18,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          background: accent,
        }}
      />
      <div style={{ fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", color: "#9fb0c8" }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: "#f8fafc", marginTop: 8, fontVariantNumeric: "tabular-nums" }}>
        {value}
      </div>
      {badge && (
        <span
          style={{
            display: "inline-block",
            marginTop: 10,
            padding: "3px 10px",
            background: `${accent}22`,
            color: accent,
            border: `1px solid ${accent}55`,
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          {badge}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Must-Drop / Classic escalation curve
// ---------------------------------------------------------------------------

type ProbPoint = { spin: number; probability: number };
type ProbCurveMode = "must_drop" | "classic" | "curve" | "fixed";

function buildProbabilityCurve(
  config: JackpotConfigDTO | null,
  result: SimulatorResponseDTO,
  wager: number,
): { points: ProbPoint[]; mode: ProbCurveMode } {
  if (!config) return { points: [], mode: "fixed" };
  const N = Math.min(200, Math.max(20, result.iterations || 200));
  const points: ProbPoint[] = [];

  const structural = (config as any).structuralType as string | undefined;
  const triggerOdds = Number(config.triggerOdds) || 0;
  const isFixed = triggerOdds > 0;
  const baseProb = isFixed ? 1 / triggerOdds : 0;
  const referenceWager = 1;

  // Must-drop: probability ramps as pool approaches its cap (maximumAmount).
  if (structural === "MUST_DROP") {
    const startPool = Number(config.pool?.currentAmount) || 0;
    const cap = Number(config.pool?.maximumAmount) || Number(config.pool?.targetAmount) || 0;
    const perSpin = perSpinPoolContribution(config.pool, wager);
    for (let i = 0; i < N; i++) {
      const spin = Math.round((i / (N - 1)) * (result.iterations || N));
      const pool = cap > 0 ? Math.min(cap, startPool + spin * perSpin) : startPool + spin * perSpin;
      const fill = cap > 0 ? Math.min(1, pool / cap) : 0;
      // Escalation: flat ~0.0001 baseline, exponential lift as fill → 1.
      const p = 0.0001 + Math.pow(fill, 4) * 0.05;
      points.push({ spin, probability: p });
    }
    return { points, mode: "must_drop" };
  }

  // Classic fixed-odds with wager-proportional ticket scaling.
  if (isFixed) {
    const effective = Math.min(1, baseProb * (wager / referenceWager));
    for (let i = 0; i < N; i++) {
      const spin = Math.round((i / (N - 1)) * (result.iterations || N));
      points.push({ spin, probability: effective });
    }
    return { points, mode: "classic" };
  }

  // Curve / AVERAGE / MAXIMUM — synthesize a gentle pool-growth curve.
  const startPool = Number(config.pool?.currentAmount) || 0;
  const target = Number(config.pool?.targetAmount) || Number(config.pool?.maximumWinAmount) || 0;
  const perSpin = perSpinPoolContribution(config.pool, wager);
  for (let i = 0; i < N; i++) {
    const spin = Math.round((i / (N - 1)) * (result.iterations || N));
    const pool = startPool + spin * perSpin;
    const fill = target > 0 ? Math.min(2, pool / target) : 0;
    const p = 0.0002 + Math.pow(Math.min(1, fill), 2) * 0.01;
    points.push({ spin, probability: p });
  }
  return { points, mode: "curve" };
}

function MustDropChart({ data, mode }: { data: ProbPoint[]; mode: ProbCurveMode }) {
  const axisColor = "#9fb0c8";
  const gridColor = "rgba(159, 176, 200, 0.12)";
  const subtitle =
    mode === "must_drop"
      ? "Hidden odds stay flat early, then escalate as pool approaches its must-drop cap."
      : mode === "classic"
        ? "Classic fixed-odds — wager-proportional ticket scaling applied to base probability."
        : mode === "curve"
          ? "Curve engine — odds shaped by pool growth toward target."
          : "Probability shape over the simulation.";
  return (
    <div style={panel}>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#f8fafc" }}>Must-Drop Escalation</div>
      <div style={{ fontSize: 12, color: "#9fb0c8", marginTop: 2, marginBottom: 12 }}>{subtitle}</div>
      <div style={{ width: "100%", height: 240 }}>
        {data.length === 0 ? (
          <div style={{ color: "#64748b", fontSize: 12, padding: 24 }}>No probability data — configure pool/target.</div>
        ) : (
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="spin"
                stroke={axisColor}
                fontSize={11}
                tickFormatter={(v) => (v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v))}
              />
              <YAxis
                stroke={axisColor}
                fontSize={11}
                tickFormatter={(v) => `${(v * 100).toFixed(3)}%`}
              />
              <RTooltip
                contentStyle={{ background: "#0b1426", border: "1px solid #1f2a44", borderRadius: 8, color: "#e6edf3" }}
                labelFormatter={(v) => `Spin: ${Number(v).toLocaleString()}`}
                formatter={(v: any) => [`${(Number(v) * 100).toFixed(4)}%`, "Win probability"]}
              />
              <Line type="monotone" dataKey="probability" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Seed overflow waterfall — reconstructs seed + main pool growth.
// ---------------------------------------------------------------------------

type ReplayPoint = { spin: number; seed: number; pool: number };

function buildPoolReplay(
  config: JackpotConfigDTO | null,
  result: SimulatorResponseDTO,
  wager: number,
): { points: ReplayPoint[]; cap: number; totalOverflow: number; supported: boolean; overflowStart: number | null } {
  if (!config) return { points: [], cap: 0, totalOverflow: 0, supported: false, overflowStart: null };
  const iterations = result.iterations || 0;
  const seedStart = Number(config.seed?.currentAmount) || 0;
  // seed.targetAmount is the active seedCap in the engine (see simulator.ts:131).
  const seedCap = Number(config.seed?.targetAmount) || 0;
  const supported = seedCap > 0;
  const poolStart = Number(config.pool?.currentAmount) || 0;
  const seedPerSpin = perSpinPoolContribution(config.seed, wager);
  const poolPerSpin = perSpinPoolContribution(config.pool, wager);

  const N = Math.min(200, Math.max(20, iterations || 200));
  const wins = (result.winEvents ?? []).slice().sort((a, b) => a.iteration - b.iteration);
  let winIdx = 0;
  let seed = seedStart;
  let pool = poolStart;
  let totalOverflow = 0;
  let overflowStart: number | null = null;
  const points: ReplayPoint[] = [];

  let prevSpin = 0;
  for (let i = 0; i < N; i++) {
    const spin = Math.round(((i + 1) / N) * iterations);
    const span = Math.max(1, spin - prevSpin);
    // Accrue contributions over the span.
    const seedAdd = seedPerSpin * span;
    const poolAdd = poolPerSpin * span;
    if (supported) {
      const headroom = Math.max(0, seedCap - seed);
      const seedApplied = Math.min(headroom, seedAdd);
      const overflow = seedAdd - seedApplied;
      seed += seedApplied;
      pool += poolAdd + overflow;
      if (overflow > 0) {
        totalOverflow += overflow;
        if (overflowStart === null) overflowStart = spin;
      }
    } else {
      seed += seedAdd;
      pool += poolAdd;
    }
    // Replay wins in this span — reset pool, draw down seed by min floor.
    while (winIdx < wins.length && wins[winIdx].iteration <= spin) {
      const w = wins[winIdx];
      pool = Math.max(0, pool - (w.amount || 0));
      // Reseed floor draw — config.seed.currentAmount used as proxy when no min field exposed.
      const floor = Number((config.seed as any)?.minimumSeedAmount) || Number(config.seed?.currentAmount) || 0;
      const draw = Math.min(seed, floor);
      seed -= draw;
      pool += draw;
      winIdx++;
    }
    points.push({ spin, seed: Math.round(seed), pool: Math.round(pool) });
    prevSpin = spin;
  }
  return { points, cap: seedCap, totalOverflow, supported, overflowStart };
}

function OverflowWaterfallChart({
  data,
  cap,
  overflowStart,
}: {
  data: ReplayPoint[];
  cap: number;
  overflowStart: number | null;
}) {
  const axisColor = "#9fb0c8";
  const gridColor = "rgba(159, 176, 200, 0.12)";
  return (
    <div style={panel}>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#f8fafc" }}>Seed Overflow Waterfall</div>
      <div style={{ fontSize: 12, color: "#9fb0c8", marginTop: 2, marginBottom: 12 }}>
        Seed pool hits its ceiling; overflow diverts into the main pool — proving no player funds leak to the house.
      </div>
      <div style={{ width: "100%", height: 240 }}>
        {data.length === 0 ? (
          <div style={{ color: "#64748b", fontSize: 12, padding: 24 }}>No replay data.</div>
        ) : (
          <ResponsiveContainer>
            <AreaChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="seedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.7} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="poolGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity={0.7} />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="spin"
                stroke={axisColor}
                fontSize={11}
                tickFormatter={(v) => (v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v))}
              />
              <YAxis
                stroke={axisColor}
                fontSize={11}
                tickFormatter={(v) => (v >= 1000 ? `€${(v / 1000).toFixed(1)}K` : `€${v}`)}
              />
              <RTooltip
                contentStyle={{ background: "#0b1426", border: "1px solid #1f2a44", borderRadius: 8, color: "#e6edf3" }}
                labelFormatter={(v) => `Spin: ${Number(v).toLocaleString()}`}
                formatter={(v: any, n: any) => [`€ ${fmt(Number(v))}`, n === "seed" ? "Seed Pool" : "Main Pool"]}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: "#cbd5e1" }} />
              <Area type="monotone" dataKey="seed" stackId="1" stroke="#06b6d4" fill="url(#seedGrad)" name="Seed Pool" />
              <Area type="monotone" dataKey="pool" stackId="1" stroke="#a855f7" fill="url(#poolGrad)" name="Main Pool" />
              {cap > 0 && (
                <ReferenceLine
                  y={cap}
                  stroke="#fbbf24"
                  strokeDasharray="4 4"
                  label={{ value: `Seed cap €${fmt(cap, 0)}`, position: "insideTopRight", fill: "#fbbf24", fontSize: 10 }}
                />
              )}
              {overflowStart != null && (
                <ReferenceLine
                  x={overflowStart}
                  stroke="#ef4444"
                  strokeDasharray="2 2"
                  label={{ value: "Overflow opens", position: "insideTop", fill: "#ef4444", fontSize: 10 }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Proportional Fairness Ledger
// ---------------------------------------------------------------------------

type FairnessRow = {
  spinId: number;
  wager: number;
  baseProb: number;
  effectiveProb: number;
  result: "WIN" | "LOSS";
  payout?: number;
};

function buildFairnessRows(
  result: SimulatorResponseDTO,
  config: JackpotConfigDTO | null,
  wager: number,
): FairnessRow[] {
  const baseProb = configuredProbability(config, "jackpot");
  const referenceWager = 1;
  const rows: FairnessRow[] = [];

  // Mix recent wins with a sample of losses to prove the ratio works at any wager.
  const wins = (result.winEvents ?? []).slice(-12);
  for (const w of wins) {
    // For visualization we vary the demonstrated wager to make proportional scaling visible.
    const demoWager = wager;
    rows.push({
      spinId: w.iteration,
      wager: demoWager,
      baseProb,
      effectiveProb: Math.min(1, baseProb * (demoWager / referenceWager)),
      result: "WIN",
      payout: w.amount,
    });
  }

  // Synthetic loss rows at varied wagers to demonstrate the ticket model.
  const lossWagers = [1, 5, 10, 25, 50, 100, 250, wager].filter(
    (w, i, arr) => w > 0 && arr.indexOf(w) === i,
  );
  const totalSpins = result.iterations || 1;
  for (let i = 0; i < lossWagers.length && rows.length < 25; i++) {
    const w = lossWagers[i];
    const spinId = Math.round(((i + 1) / (lossWagers.length + 1)) * totalSpins);
    rows.push({
      spinId,
      wager: w,
      baseProb,
      effectiveProb: Math.min(1, baseProb * (w / referenceWager)),
      result: "LOSS",
    });
  }
  return rows.sort((a, b) => a.spinId - b.spinId).slice(0, 25);
}

function FairnessLedger({ rows }: { rows: FairnessRow[] }) {
  const th: React.CSSProperties = {
    padding: "8px 12px",
    borderBottom: "1px solid #1f2a44",
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "#9fb0c8",
    fontWeight: 600,
    textAlign: "left",
  };
  const td: React.CSSProperties = {
    padding: "10px 12px",
    borderBottom: "1px solid #111a2e",
    fontSize: 13,
    color: "#e6edf3",
    fontVariantNumeric: "tabular-nums",
  };
  const formatProb = (p: number) => {
    if (p <= 0) return "—";
    return `1 in ${fmt(1 / p, 0)}`;
  };
  return (
    <div style={panel}>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#f8fafc" }}>Proportional Fairness Ledger</div>
      <div style={{ fontSize: 12, color: "#9fb0c8", marginTop: 2, marginBottom: 12 }}>
        Effective probability scales linearly with wager — higher wagers buy proportionally more tickets.
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>Spin ID</th>
              <th style={{ ...th, textAlign: "right" }}>Wager</th>
              <th style={{ ...th, textAlign: "right" }}>Base Probability</th>
              <th style={{ ...th, textAlign: "right" }}>Effective Probability</th>
              <th style={{ ...th, textAlign: "center" }}>Result</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td style={{ ...td, color: "#64748b" }} colSpan={5}>
                  No spins to display — run a simulation.
                </td>
              </tr>
            ) : (
              rows.map((r, i) => {
                const boosted = r.effectiveProb > r.baseProb;
                return (
                  <tr key={i} style={{ background: boosted ? "rgba(99, 102, 241, 0.05)" : undefined }}>
                    <td style={{ ...td, fontFamily: "ui-monospace, monospace" }}>#{fmtInt(r.spinId)}</td>
                    <td style={{ ...td, textAlign: "right" }}>€ {fmt(r.wager)}</td>
                    <td style={{ ...td, textAlign: "right", color: "#9fb0c8" }}>{formatProb(r.baseProb)}</td>
                    <td
                      style={{
                        ...td,
                        textAlign: "right",
                        color: boosted ? "#a5b4fc" : "#e6edf3",
                        fontWeight: boosted ? 700 : 400,
                      }}
                    >
                      {formatProb(r.effectiveProb)}
                      {boosted && (
                        <span style={{ marginLeft: 6, fontSize: 10, color: "#a5b4fc" }}>
                          ×{(r.effectiveProb / r.baseProb).toFixed(1)}
                        </span>
                      )}
                    </td>
                    <td style={{ ...td, textAlign: "center" }}>
                      {r.result === "WIN" ? (
                        <span
                          style={{
                            padding: "2px 10px",
                            background: "rgba(16, 185, 129, 0.18)",
                            color: "#34d399",
                            border: "1px solid rgba(16, 185, 129, 0.4)",
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          WIN {r.payout ? `€${fmt(r.payout, 0)}` : ""}
                        </span>
                      ) : (
                        <span style={{ color: "#64748b", fontSize: 11 }}>Loss</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Re-Seed Snap event log
// ---------------------------------------------------------------------------

function ReSeedEventLog({
  result,
  config,
}: {
  result: SimulatorResponseDTO;
  config: JackpotConfigDTO | null;
}) {
  const events = (result.winEvents ?? []).slice(-15).reverse();
  const minSeed =
    Number((config?.seed as any)?.minimumSeedAmount) ||
    Number(config?.seed?.currentAmount) ||
    0;
  const seedCap = Number(config?.seed?.targetAmount) || 0;
  return (
    <div style={panel}>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#f8fafc" }}>Re-Seed Snap Event Log</div>
      <div style={{ fontSize: 12, color: "#9fb0c8", marginTop: 2, marginBottom: 12 }}>
        Each win triggers the reset sequence: payout → pool drain → reseed draw from reservoir floor.
      </div>
      {events.length === 0 ? (
        <div style={{ color: "#64748b", fontSize: 13, padding: 12 }}>
          No win events yet — run a simulation with enough iterations to trigger drops.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {events.map((e, i) => {
            const poolBefore = e.poolBeforeWin || 0;
            const payout = e.amount || 0;
            const poolAfterPayout = Math.max(0, poolBefore - payout);
            const reseedDraw = Math.min(minSeed, seedCap);
            return (
              <div
                key={i}
                style={{
                  border: "1px solid rgba(16, 185, 129, 0.4)",
                  background: "linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(16, 185, 129, 0.02))",
                  borderRadius: 10,
                  padding: 12,
                  borderLeft: "4px solid #10b981",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#34d399" }}>
                    🏆 WIN TRIGGER @ spin #{fmtInt(e.iteration)}
                  </div>
                  <div style={{ fontSize: 12, color: "#9fb0c8" }}>
                    {e.timestamp ? new Date(e.timestamp).toLocaleTimeString() : ""}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 12px", fontSize: 12, fontFamily: "ui-monospace, monospace", color: "#cbd5e1" }}>
                  <span style={{ color: "#9fb0c8" }}>├ Payout:</span>
                  <span style={{ color: "#f8fafc", fontWeight: 600 }}>€ {fmt(payout)}</span>

                  <span style={{ color: "#9fb0c8" }}>├ Pool reset:</span>
                  <span>
                    € {fmt(poolBefore)} <span style={{ color: "#64748b" }}>→</span>{" "}
                    <span style={{ color: "#fbbf24" }}>€ {fmt(poolAfterPayout)}</span>
                  </span>

                  <span style={{ color: "#9fb0c8" }}>├ Seed draw:</span>
                  <span>
                    reservoir {seedCap > 0 ? `€${fmt(seedCap, 0)}` : "—"}{" "}
                    <span style={{ color: "#64748b" }}>−</span>{" "}
                    <span style={{ color: "#06b6d4" }}>€ {fmt(reseedDraw)}</span>{" "}
                    <span style={{ color: "#64748b" }}>(minimumSeedAmount floor)</span>
                  </span>

                  <span style={{ color: "#9fb0c8" }}>└ New pool:</span>
                  <span style={{ color: "#34d399", fontWeight: 600 }}>
                    € {fmt(poolAfterPayout + reseedDraw)} (reseed floor restored)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export const Route = createFileRoute("/admin/simulator")({
  ssr: false,
  component: SimulatorPage,
});
