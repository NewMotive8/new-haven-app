import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import * as React from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { BrandContext } from "../backoffice/app";

const VOLATILITIES = [
  { value: 1, label: "1 — Very Low" },
  { value: 3, label: "3 — Low" },
  { value: 5, label: "5 — Medium" },
  { value: 7, label: "7 — High" },
  { value: 10, label: "10 — Very High" },
];

const label: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: "#9fb0c8",
  marginBottom: 6,
};
const input: React.CSSProperties = {
  width: "100%",
  background: "#0b1220",
  color: "#e6edf3",
  border: "1px solid #1f2a44",
  padding: "10px 12px",
  borderRadius: 8,
  fontSize: 14,
  boxSizing: "border-box",
};
const row: React.CSSProperties = { marginBottom: 18 };
const help: React.CSSProperties = { fontSize: 12, color: "#64748b", marginTop: 6 };
const errStyle: React.CSSProperties = { fontSize: 12, color: "#f87171", marginTop: 6 };

interface FormState {
  name: string;
  contributionPct: string; // %
  volatility: number;
  seedAmount: string;
  triggerThreshold: string;
  enabled: boolean;
}

function NewJackpotPage() {
  const { brandId } = React.useContext(BrandContext);
  const navigate = useNavigate();
  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState<FormState>({
    name: "",
    contributionPct: "1",
    volatility: 5,
    seedAmount: "100",
    triggerThreshold: "1000",
    enabled: true,
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    else if (form.name.trim().length > 100) e.name = "Max 100 characters";
    const pct = Number(form.contributionPct);
    if (!Number.isFinite(pct) || pct < 0 || pct > 100)
      e.contributionPct = "Must be between 0 and 100";
    const seed = Number(form.seedAmount);
    if (!Number.isFinite(seed) || seed < 0) e.seedAmount = "Must be ≥ 0";
    const trig = Number(form.triggerThreshold);
    if (!Number.isFinite(trig) || trig <= 0) e.triggerThreshold = "Must be > 0";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    if (brandId == null) {
      toast.error("No brand selected");
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        name: form.name.trim(),
        enabled: form.enabled,
        contributionRate: Number(form.contributionPct) / 100,
        seedAmount: Number(form.seedAmount),
        poolBalance: Number(form.seedAmount),
        triggerThreshold: Number(form.triggerThreshold),
      };
      await axios.post("/api/v1/jackpots", body, {
        headers: { brandId: String(brandId), "Content-Type": "application/json" },
      });
      toast.success("Jackpot created");
      navigate({ to: "/backoffice/jackpots" });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to create jackpot");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ padding: 28, maxWidth: 720, margin: "0 auto" }}>
      <div style={{ marginBottom: 22 }}>
        <Link to="/backoffice/jackpots" style={{ color: "#60a5fa", fontSize: 13, textDecoration: "none" }}>
          ← Back to Jackpots
        </Link>
        <h1 style={{ margin: "8px 0 4px", fontSize: 26 }}>Create New Jackpot</h1>
        <p style={{ margin: 0, color: "#9fb0c8", fontSize: 13 }}>
          Configure a new jackpot for this brand.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          background: "#0f172a",
          border: "1px solid #1f2a44",
          borderRadius: 12,
          padding: 24,
        }}
      >
        <div style={row}>
          <label style={label} htmlFor="name">Name</label>
          <input
            id="name"
            style={input}
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Mega Spin"
            maxLength={100}
          />
          {errors.name && <div style={errStyle}>{errors.name}</div>}
        </div>

        <div style={row}>
          <label style={label} htmlFor="contrib">Contribution Percentage</label>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <input
              id="contrib"
              type="range"
              min={0}
              max={10}
              step={0.1}
              value={form.contributionPct}
              onChange={(e) => set("contributionPct", e.target.value)}
              style={{ flex: 1 }}
            />
            <div style={{ position: "relative", width: 110 }}>
              <input
                type="number"
                min={0}
                max={100}
                step={0.01}
                value={form.contributionPct}
                onChange={(e) => set("contributionPct", e.target.value)}
                style={{ ...input, paddingRight: 28 }}
              />
              <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#9fb0c8", fontSize: 13 }}>%</span>
            </div>
          </div>
          <div style={help}>Percentage of each wager that funds the jackpot pool.</div>
          {errors.contributionPct && <div style={errStyle}>{errors.contributionPct}</div>}
        </div>

        <div style={row}>
          <label style={label} htmlFor="vol">Volatility Score</label>
          <select
            id="vol"
            style={input}
            value={form.volatility}
            onChange={(e) => set("volatility", Number(e.target.value))}
          >
            {VOLATILITIES.map((v) => (
              <option key={v.value} value={v.value}>{v.label}</option>
            ))}
          </select>
          <div style={help}>Higher volatility means rarer but larger wins.</div>
        </div>

        <div style={row}>
          <label style={label} htmlFor="seed">Base Seed Amount</label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9fb0c8", fontSize: 13 }}>$</span>
            <input
              id="seed"
              type="number"
              min={0}
              step="0.01"
              value={form.seedAmount}
              onChange={(e) => set("seedAmount", e.target.value)}
              style={{ ...input, paddingLeft: 24 }}
            />
          </div>
          <div style={help}>Initial pool funding. Pool starts equal to seed.</div>
          {errors.seedAmount && <div style={errStyle}>{errors.seedAmount}</div>}
        </div>

        <div style={row}>
          <label style={label} htmlFor="trig">Trigger Threshold</label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9fb0c8", fontSize: 13 }}>$</span>
            <input
              id="trig"
              type="number"
              min={0}
              step="0.01"
              value={form.triggerThreshold}
              onChange={(e) => set("triggerThreshold", e.target.value)}
              style={{ ...input, paddingLeft: 24 }}
            />
          </div>
          <div style={help}>Pool balance at which the jackpot can trigger.</div>
          {errors.triggerThreshold && <div style={errStyle}>{errors.triggerThreshold}</div>}
        </div>

        <div style={{ ...row, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ ...label, marginBottom: 2 }}>Enabled</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>Active jackpots accept contributions and can pay out.</div>
          </div>
          <button
            type="button"
            onClick={() => set("enabled", !form.enabled)}
            aria-pressed={form.enabled}
            style={{
              position: "relative",
              width: 52,
              height: 28,
              borderRadius: 999,
              border: "none",
              cursor: "pointer",
              background: form.enabled ? "#3b82f6" : "#334155",
              transition: "background 120ms",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: 3,
                left: form.enabled ? 27 : 3,
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: "#fff",
                transition: "left 120ms",
              }}
            />
          </button>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
          <Link
            to="/backoffice/jackpots"
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              border: "1px solid #1f2a44",
              color: "#e6edf3",
              textDecoration: "none",
              fontSize: 14,
            }}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: "10px 18px",
              borderRadius: 8,
              border: "none",
              background: submitting ? "#1e3a8a" : "#3b82f6",
              color: "#fff",
              fontWeight: 600,
              fontSize: 14,
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "Creating…" : "Create Jackpot"}
          </button>
        </div>
      </form>
    </div>
  );
}

export const Route = createFileRoute("/backoffice/jackpots/new")({
  ssr: false,
  component: NewJackpotPage,
});
