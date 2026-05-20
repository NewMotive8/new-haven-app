import { createFileRoute, useRouterState, useNavigate, Link } from "@tanstack/react-router";
import * as React from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { BrandContext } from "../backoffice/app";
import type { JackpotConfigDTO, SimulatorResponseDTO } from "@/lib/jackpot/types";
import type { JackpotSavePayload } from "@/components/jackpot/JackpotCreationForm";
import { mapPayloadToConfig } from "@/lib/jackpot/payload-to-config";
import { buildCreateBody } from "@/lib/jackpot/build-create-body";

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

function StatCard({ title, value, hint }: { title: string; value: string; hint?: string }) {
  return (
    <div style={{ ...panel, padding: 16 }}>
      <div style={{ fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase", color: "#9fb0c8" }}>{title}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: "#f8fafc", marginTop: 6 }}>{value}</div>
      {hint && <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

function Row({ k, v }: { k: string; v: number }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span style={{ color: "#9fb0c8" }}>{k}</span>
      <span style={{ color: "#f1f5f9", fontVariantNumeric: "tabular-nums" }}>
        {v.toLocaleString(undefined, { maximumFractionDigits: 2 })}
      </span>
    </div>
  );
}

function SimulatorPage() {
  const { brandId } = React.useContext(BrandContext);
  const navigate = useNavigate();
  const incoming = useRouterState({
    select: (s) => s.location.state as { jackpotConfig?: JackpotSavePayload } | undefined,
  });
  const originalPayloadRef = React.useRef<JackpotSavePayload | undefined>(incoming?.jackpotConfig);
  const initialConfig = React.useMemo<JackpotConfigDTO>(
    () => (incoming?.jackpotConfig ? mapPayloadToConfig(incoming.jackpotConfig) : DEFAULT_CONFIG),
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
  const [saving, setSaving] = React.useState(false);

  async function handleSave() {
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
    setSaving(true);
    try {
      const body = buildCreateBody(payload);
      await axios.post("/api/v1/jackpots", body, {
        headers: { brandId: String(brandId), "Content-Type": "application/json" },
      });
      toast.success("Jackpot created");
      navigate({ to: "/admin/jackpots" });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })
          ?.response?.data?.message ??
        (err as { message?: string })?.message ??
        "Failed to create jackpot";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

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
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "Simulation failed");
    } finally {
      setLoading(false);
    }
  }

  const summary = (() => {
    if (!result) {
      return { totalWins: 0, totalPaid: 0, totalRejected: 0, maxWin: 0, rtp: 0 };
    }
    const tiers = result.tierResults ?? [];
    if (tiers.length > 0) {
      let totalWins = 0;
      let totalPaid = 0;
      let totalRejected = 0;
      let maxWin = 0;
      for (const t of tiers) {
        totalWins += t.winCounter || 0;
        totalPaid += t.winAmountCounter || 0;
        totalRejected += t.rejectedByGate || 0;
        if ((t.maxWinAmount || 0) > maxWin) maxWin = t.maxWinAmount || 0;
      }
      const totalWagered = result.totalWagered || 0;
      const rtp = totalWagered > 0 ? (totalPaid / totalWagered) * 100 : 0;
      return { totalWins, totalPaid, totalRejected, maxWin, rtp };
    }
    let maxWin = typeof result.maxWinAmount === "number" ? result.maxWinAmount : 0;
    if (!maxWin && result.winEvents?.length) {
      for (const w of result.winEvents) if (w.amount > maxWin) maxWin = w.amount;
    }
    return {
      totalWins: result.winCounter || 0,
      totalPaid: result.winAmountCounter || 0,
      totalRejected: result.rejectedByGate ?? 0,
      maxWin,
      rtp: result.rtp || 0,
    };
  })();

  const tierWins = (() => {
    if (result?.tierCounts) return result.tierCounts;
    if (!result?.winEvents?.length) return {} as Record<string, number>;
    const buckets: Record<string, number> = {};
    for (const w of result.winEvents) {
      const mag = Math.floor(Math.log10(Math.max(1, w.amount)));
      const tier = `1e${mag}-1e${mag + 1}`;
      buckets[tier] = (buckets[tier] ?? 0) + 1;
    }
    return buckets;
  })();

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
      <h1 style={{ margin: 0, fontSize: 26 }}>Jackpot Simulator</h1>
      <p style={{ margin: "4px 0 20px", color: "#9fb0c8", fontSize: 13 }}>
        POST <code>/api/v1/event/simulate-bet</code> · brand <code>{String(brandId ?? "—")}</code>
      </p>

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
                  onClick={handleSave}
                  disabled={saving || loading}
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
            {error && <div style={{ color: "#f87171", fontSize: 13 }}>{error}</div>}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
            <StatCard title="RTP" value={result ? `${summary.rtp.toFixed(2)}%` : "—"} />
            <StatCard title="Win count" value={result ? summary.totalWins.toLocaleString() : "—"} />
            <StatCard title="Rejected by gate" value={result ? summary.totalRejected.toLocaleString() : "—"} hint="CDF hits dropped by minWin / seed gate" />
            <StatCard title="Max win" value={result ? summary.maxWin.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"} />
            <StatCard title="Total win amount" value={result ? summary.totalPaid.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"} />
            <StatCard title="Total wagered" value={result ? result.totalWagered.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"} />
            <StatCard title="Wallet contributions" value={result ? (result.walletContributions ?? result.totalContributions).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"} hint="Java: fromWallet" />
            <StatCard title="Operator contributions" value={result ? (result.operatorContributions ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"} hint="Java: notFromWallet" />
            <StatCard title="House margin" value={result ? (result.houseContributions ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"} hint="Split-mode operator rake" />
            <StatCard title="House %" value={result ? `${((result.houseRatio ?? 0) * 100).toFixed(2)}%` : "—"} hint="of total wagered" />
            <StatCard title="Final pool" value={result ? result.finalPool.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"} />
            <StatCard title="Final seed" value={result ? result.finalSeed.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"} />
          </div>

          {result?.tierResults && result.tierResults.length > 0 && (
            <div style={panel}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                Multi-Level tier results
                <span style={{ marginLeft: 8, fontSize: 11, color: "#9fb0c8", fontWeight: 400 }}>
                  · {result.structuralType ?? "MULTI_LEVEL"}
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
                {result.tierResults.map((t) => (
                  <div key={t.tier} style={{ background: "#0b1220", border: "1px solid #1f2a44", borderRadius: 8, padding: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#f8fafc" }}>
                        T{t.tier} · {t.label}
                      </div>
                      <div style={{ fontSize: 11, color: "#9fb0c8" }}>{t.winCounter} wins</div>
                    </div>
                    <div style={{ marginTop: 8, display: "grid", gap: 4, fontSize: 12, color: "#cbd5e1" }}>
                      <Row k="Total contribution" v={t.totalContribution} />
                      <Row k="Total paid" v={t.winAmountCounter} />
                      <Row k="Max win" v={t.maxWinAmount} />
                      <Row k="Final pool" v={t.finalPool} />
                      <Row k="Final seed" v={t.finalSeed} />
                      <Row k="Rejected" v={t.rejectedByGate} />
                      <Row k="House margin" v={t.houseContributions ?? 0} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={panel}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Tier wins</div>
            {Object.keys(tierWins).length === 0 ? (
              <div style={{ color: "#64748b", fontSize: 13 }}>Run a simulation to see win distribution.</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
                {Object.entries(tierWins)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([tier, count]) => (
                    <div key={tier} style={{ background: "#0b1220", border: "1px solid #1f2a44", borderRadius: 8, padding: 10 }}>
                      <div style={{ fontSize: 11, color: "#9fb0c8" }}>{tier}</div>
                      <div style={{ fontSize: 18, fontWeight: 600, color: "#f8fafc" }}>{count}</div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div style={panel}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Recent win events</div>
            {!result?.winEvents?.length ? (
              <div style={{ color: "#64748b", fontSize: 13 }}>No wins recorded.</div>
            ) : (
              <div style={{ maxHeight: 260, overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ color: "#9fb0c8", textAlign: "left" }}>
                      <th style={{ padding: "6px 8px", borderBottom: "1px solid #1f2a44" }}>#</th>
                      <th style={{ padding: "6px 8px", borderBottom: "1px solid #1f2a44" }}>Iteration</th>
                      <th style={{ padding: "6px 8px", borderBottom: "1px solid #1f2a44" }}>Amount</th>
                      <th style={{ padding: "6px 8px", borderBottom: "1px solid #1f2a44" }}>Pool before</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.winEvents.slice(0, 50).map((w, i) => (
                      <tr key={i}>
                        <td style={{ padding: "6px 8px", borderBottom: "1px solid #111a2e" }}>{i + 1}</td>
                        <td style={{ padding: "6px 8px", borderBottom: "1px solid #111a2e" }}>{w.iteration}</td>
                        <td style={{ padding: "6px 8px", borderBottom: "1px solid #111a2e" }}>{w.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                        <td style={{ padding: "6px 8px", borderBottom: "1px solid #111a2e" }}>{w.poolBeforeWin.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {result?.engineScopeAudit && (
            <div style={panel}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Engine Scope Audit</div>
              <div style={{ display: "grid", gap: 6, fontSize: 12, color: "#cbd5e1" }}>
                <Row k="Spin index" v={result.engineScopeAudit.spinIndex} />
                <Row k="Runtime tier" v={result.engineScopeAudit.tier} />
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <span style={{ color: "#9fb0c8" }}>Runtime label</span>
                  <span style={{ color: "#f1f5f9" }}>{result.engineScopeAudit.label}</span>
                </div>
                <Row k="Runtime Mini Target" v={result.engineScopeAudit.runtimeTargetAmount} />
                <Row k="Runtime Mini Min Win" v={result.engineScopeAudit.runtimeMinimumWinAmount} />
              </div>
            </div>
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
