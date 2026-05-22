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
      await axios.post("/api/v1/jackpots", body, {
        headers: { brandId: String(brandId), "Content-Type": "application/json" },
      });
      toast.success(asDraft ? "Draft saved" : "Jackpot created");
      try { sessionStorage.removeItem('jackpot:pendingPayload'); } catch { /* noop */ }
      navigate({ to: "/admin/jackpots" });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })
          ?.response?.data?.message ??
        (err as { message?: string })?.message ??
        (asDraft ? "Failed to save draft" : "Failed to create jackpot");
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
      const res = await axios.post<SimulatorResponseDTO>(
        "/api/v1/event/simulate-bet",
        parsedPayload,
        {
          params: { wager, iterations },
          headers: { brandId: String(brandId ?? "") },
        },
      );
      setResult(res.data);
      setActiveConfig(parsedPayload);
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "Simulation failed");
    } finally {
      setLoading(false);
    }
  }




  return (
    <div style={{ padding: 28, maxWidth: 1200, margin: "0 auto" }}>
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
                  {savingDraft ? "Saving…" : "Save as Draft"}
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
                  {saving ? "Saving…" : "Save Jackpot"}
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
              Run a simulation to see the executive summary.
            </div>
          ) : (
            <ResultsSummary result={result} config={activeConfig} />
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
  const totalPayout = isMultiLevel
    ? tiers.reduce((s, t) => s + (t.winAmountCounter || 0), 0)
    : result.winAmountCounter || 0;
  const contribPctOfWager = totalWager > 0 ? (totalContributionReceived / totalWager) * 100 : 0;
  const payoutPctOfWager = totalWager > 0 ? (totalPayout / totalWager) * 100 : 0;
  const averageDropAmount = totalDrops > 0 ? totalPayout / totalDrops : 0;

  return (
    <>
      {/* 1. Headline KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        <KpiCard label="Total Wager" value={`€ ${fmt(totalWager)}`} />
        <KpiCard
          label="Total Contribution Received"
          value={`€ ${fmt(totalContributionReceived)}`}
          badge={`${contribPctOfWager.toFixed(2)}% of wager`}
        />
        <KpiCard
          label="Total Payout"
          value={`€ ${fmt(totalPayout)}`}
          badge={`${payoutPctOfWager.toFixed(2)}% of wager`}
        />
        <KpiCard
          label="House Revenue"
          value={`€ ${fmt(houseRevenue)}`}
          badge={`${housePctActual.toFixed(2)}% of wager`}
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
              />
            );
          })}
        </div>
      )}
    </>
  );
}

function KpiCard({ label, value, badge }: { label: string; value: string; badge?: string }) {
  return (
    <div style={{ ...panel, padding: 18 }}>
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
}: {
  title?: string;
  configuredProb: number;
  iterations: number;
  wins: number;
}) {
  const configuredN = configuredProb > 0 ? 1 / configuredProb : 0;
  const actualN = wins > 0 ? iterations / wins : 0;
  // Within ±25% of configured = compliant. Also pass if no configured target.
  const ratio = configuredN > 0 && actualN > 0 ? actualN / configuredN : 0;
  const compliant = configuredN === 0 || (ratio >= 0.75 && ratio <= 1.25);

  const cell: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 4 };
  const k: React.CSSProperties = { fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: "#9fb0c8" };
  const v: React.CSSProperties = { fontSize: 18, fontWeight: 700, color: "#f8fafc", fontVariantNumeric: "tabular-nums" };

  return (
    <div style={panel}>
      {title && <div style={{ fontSize: 13, fontWeight: 600, color: "#cbd5e1", marginBottom: 12 }}>{title}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 16, alignItems: "center" }}>
        <div style={cell}>
          <span style={k}>Configured Probability</span>
          <span style={v}>{configuredN > 0 ? `1 in ${fmt(configuredN, 0)}` : "—"}</span>
        </div>
        <div style={cell}>
          <span style={k}>Actual Hit Rate</span>
          <span style={v}>{actualN > 0 ? `1 in ${fmt(actualN, 0)}` : "—"}</span>
        </div>
        <div>
          {compliant ? (
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
    </div>
  );
}

export const Route = createFileRoute("/admin/simulator")({
  ssr: false,
  component: SimulatorPage,
});
