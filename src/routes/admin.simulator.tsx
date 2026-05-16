import { createFileRoute, useRouterState, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import axios from "axios";
import { BrandContext } from "../backoffice/app";
import type { JackpotConfigDTO, SimulatorResponseDTO } from "@/lib/jackpot/types";
import type { JackpotSavePayload } from "@/components/jackpot/JackpotCreationForm";
import { mapPayloadToConfig } from "@/lib/jackpot/payload-to-config";

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

function SimulatorPage() {
  const { brandId } = React.useContext(BrandContext);
  const incoming = useRouterState({
    select: (s) => s.location.state as { jackpotConfig?: JackpotSavePayload } | undefined,
  });
  const initialConfig = React.useMemo<JackpotConfigDTO>(
    () => (incoming?.jackpotConfig ? mapPayloadToConfig(incoming.jackpotConfig) : DEFAULT_CONFIG),
    // Intentionally empty: only read incoming state on first mount so user
    // edits in the textarea are never overwritten on re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const cameFromCreationFlow = Boolean(incoming?.jackpotConfig);
  const [wager, setWager] = React.useState(10);
  const [iterations, setIterations] = React.useState(100000);
  const [configText, setConfigText] = React.useState(JSON.stringify(initialConfig, null, 2));
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<SimulatorResponseDTO | null>(null);

  async function handleSimulate() {
    setError(null);
    setLoading(true);
    try {
      let body: JackpotConfigDTO;
      try {
        body = JSON.parse(configText);
      } catch (e) {
        throw new Error("Jackpot config is not valid JSON");
      }
      const res = await axios.post<SimulatorResponseDTO>(
        "/api/v1/event/simulate-bet",
        body,
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

  const maxWin = React.useMemo(() => {
    if (typeof result?.maxWinAmount === "number") return result.maxWinAmount;
    if (!result?.winEvents?.length) return 0;
    let m = 0;
    for (const w of result.winEvents) if (w.amount > m) m = w.amount;
    return m;
  }, [result]);

  const tierWins = React.useMemo(() => {
    if (result?.tierCounts) return result.tierCounts;
    if (!result?.winEvents?.length) return {} as Record<string, number>;
    const buckets: Record<string, number> = {};
    for (const w of result.winEvents) {
      const mag = Math.floor(Math.log10(Math.max(1, w.amount)));
      const tier = `1e${mag}-1e${mag + 1}`;
      buckets[tier] = (buckets[tier] ?? 0) + 1;
    }
    return buckets;
  }, [result]);

  return (
    <div style={{ padding: 28, maxWidth: 1200, margin: "0 auto" }}>
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
                onChange={(e) => setConfigText(e.target.value)}
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
            {error && <div style={{ color: "#f87171", fontSize: 13 }}>{error}</div>}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
            <StatCard title="RTP" value={result ? `${result.rtp.toFixed(2)}%` : "—"} />
            <StatCard title="Win count" value={result ? String(result.winCounter) : "—"} />
            <StatCard title="Max win" value={result ? maxWin.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"} />
            <StatCard title="Total win amount" value={result ? result.winAmountCounter.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"} />
            <StatCard title="Total wagered" value={result ? result.totalWagered.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"} />
            <StatCard title="Total contributions" value={result ? result.totalContributions.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"} />
            <StatCard title="Final pool" value={result ? result.finalPool.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"} />
            <StatCard title="Final seed" value={result ? result.finalSeed.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"} />
          </div>

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
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/admin/simulator")({
  ssr: false,
  component: SimulatorPage,
});
