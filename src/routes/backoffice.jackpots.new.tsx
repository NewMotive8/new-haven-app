import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import * as React from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { BrandContext } from "../backoffice/app";

// ─── Types ────────────────────────────────────────────────────────────────
type JackpotKind = "classic" | "frequency" | "must_drop" | "multi_level";

interface Tier {
  name: string;
  minWin: string;
  maxWin: string;
  contributionPct: string;
}

interface FormState {
  // shared
  name: string;
  type: JackpotKind | null;
  contributionPct: string;
  volatility: number;
  minWager: string;
  maxWager: string;
  poolBalance: string;
  seedAmount: string;
  enabled: boolean;
  // classic — uses shared only

  // frequency
  freqMode: "fixed" | "range";
  freqFixedWin: string;
  freqAvgWin: string;
  freqMinWin: string;
  freqMaxWin: string;
  freqCadence: "daily" | "weekly" | "monthly";

  // must_drop
  mdMinWin: string;
  mdMaxWin: string;
  mdFrequency: "daily" | "weekly" | "monthly";
  mdStartAt: string;
  mdEndAt: string;
  mdCommunitySplit: boolean;

  // multi_level
  tiers: Tier[];
}

const initialState: FormState = {
  name: "",
  type: null,
  contributionPct: "1",
  volatility: 5,
  minWager: "0.10",
  maxWager: "100",
  poolBalance: "1000",
  seedAmount: "1000",
  enabled: true,

  freqMode: "fixed",
  freqFixedWin: "500",
  freqAvgWin: "500",
  freqMinWin: "100",
  freqMaxWin: "1000",
  freqCadence: "daily",

  mdMinWin: "100",
  mdMaxWin: "5000",
  mdFrequency: "daily",
  mdStartAt: "",
  mdEndAt: "",
  mdCommunitySplit: false,

  tiers: [
    { name: "Bronze", minWin: "10", maxWin: "50", contributionPct: "0.5" },
    { name: "Silver", minWin: "50", maxWin: "500", contributionPct: "1" },
    { name: "Gold", minWin: "500", maxWin: "5000", contributionPct: "2" },
  ],
};


// ─── Styles ───────────────────────────────────────────────────────────────
const S = {
  page: { minHeight: "calc(100vh - 56px)", background: "#0a0a0a", color: "#f5f5f5" } as React.CSSProperties,
  shell: { display: "flex", maxWidth: 1400, margin: "0 auto" } as React.CSSProperties,
  sidebar: {
    width: 260,
    borderRight: "1px solid #262626",
    padding: "32px 20px",
    background: "#0f0f0f",
    minHeight: "calc(100vh - 56px)",
  } as React.CSSProperties,
  sideTitle: { fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, color: "#737373", marginBottom: 16 } as React.CSSProperties,
  main: { flex: 1, padding: "32px 48px 120px", minWidth: 0 } as React.CSSProperties,
  h1: { margin: 0, fontSize: 24, fontWeight: 600 } as React.CSSProperties,
  sub: { margin: "6px 0 0", color: "#a3a3a3", fontSize: 14 } as React.CSSProperties,
  panel: { background: "transparent", marginTop: 32 } as React.CSSProperties,
  label: { display: "block", fontSize: 13, fontWeight: 500, color: "#e5e5e5", marginBottom: 8 } as React.CSSProperties,
  input: {
    width: "100%",
    background: "#171717",
    color: "#fafafa",
    border: "1px solid #262626",
    padding: "10px 12px",
    borderRadius: 6,
    fontSize: 14,
    boxSizing: "border-box",
  } as React.CSSProperties,
  row: { marginBottom: 20 } as React.CSSProperties,
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 } as React.CSSProperties,
  help: { fontSize: 12, color: "#737373", marginTop: 6 } as React.CSSProperties,
  err: { fontSize: 12, color: "#f87171", marginTop: 6 } as React.CSSProperties,
  footer: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    background: "#0a0a0a",
    borderTop: "1px solid #262626",
    padding: "14px 48px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 5,
  } as React.CSSProperties,
  btnPrimary: (disabled?: boolean) => ({
    background: disabled ? "#1e3a8a" : "#3b82f6",
    color: "#fff",
    border: "none",
    padding: "10px 22px",
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 500,
    cursor: disabled ? "not-allowed" : "pointer",
  }) as React.CSSProperties,
  btnGhost: {
    background: "transparent",
    color: "#e5e5e5",
    border: "1px solid #404040",
    padding: "10px 22px",
    borderRadius: 6,
    fontSize: 14,
    cursor: "pointer",
  } as React.CSSProperties,
};

// ─── Reusable atoms ───────────────────────────────────────────────────────
function Field({ label, htmlFor, error, help, children }: { label: string; htmlFor?: string; error?: string; help?: string; children: React.ReactNode }) {
  return (
    <div style={S.row}>
      <label style={S.label} htmlFor={htmlFor}>{label}</label>
      {children}
      {help && <div style={S.help}>{help}</div>}
      {error && <div style={S.err}>{error}</div>}
    </div>
  );
}

function MoneyInput({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ position: "relative" }}>
      <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#737373", fontSize: 13 }}>$</span>
      <input id={id} type="number" min={0} step="0.01" value={value} onChange={(e) => onChange(e.target.value)} style={{ ...S.input, paddingLeft: 24 }} />
    </div>
  );
}

function Select({ id, value, onChange, options }: { id: string; value: string | number; onChange: (v: string) => void; options: { value: string | number; label: string }[] }) {
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)} style={S.input}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      style={{
        position: "relative", width: 44, height: 24, borderRadius: 999, border: "none",
        cursor: "pointer", background: checked ? "#3b82f6" : "#404040", transition: "background 120ms",
      }}
    >
      <span style={{ position: "absolute", top: 2, left: checked ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left 120ms" }} />
    </button>
  );
}

const VOLATILITY_OPTS = [
  { value: 1, label: "1 — Very Low" },
  { value: 3, label: "3 — Low" },
  { value: 5, label: "5 — Medium" },
  { value: 7, label: "7 — High" },
  { value: 10, label: "10 — Very High" },
];

// ─── Type cards (Step 1) ──────────────────────────────────────────────────
const TYPE_CARDS: { id: JackpotKind; name: string; desc: string; icon: string }[] = [
  { id: "classic", name: "Classic", desc: "Standard wager-contribution jackpot", icon: "$" },
  { id: "frequency", name: "Frequency", desc: "Time-based win cadence", icon: "⏱" },
  { id: "must_drop", name: "Must Drop", desc: "Guaranteed payout by deadline", icon: "📈" },
  { id: "multi_level", name: "Multi-Level", desc: "Tiered wins (Bronze/Silver/Gold)", icon: "♛" },
];

function TypeCards({ selected, onSelect }: { selected: JackpotKind | null; onSelect: (t: JackpotKind) => void }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginTop: 8 }}>
      {TYPE_CARDS.map((t) => {
        const active = selected === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t.id)}
            style={{
              display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 10,
              padding: 24, borderRadius: 12, cursor: "pointer", textAlign: "left",
              border: `2px solid ${active ? "#3b82f6" : "#262626"}`,
              background: active ? "rgba(59,130,246,0.08)" : "#0f0f0f",
              transition: "all 120ms",
            }}
          >
            <div style={{ fontSize: 32 }}>{t.icon}</div>
            <div style={{ fontSize: 17, fontWeight: 600, color: "#fafafa" }}>{t.name}</div>
            <div style={{ fontSize: 13, color: "#a3a3a3" }}>{t.desc}</div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Type-specific dynamic fields (Step 3: Model) ─────────────────────────
function ClassicFields({ form, set }: { form: FormState; set: <K extends keyof FormState>(k: K, v: FormState[K]) => void }) {
  return (
    <>
      <Field label="Contribution Percentage" htmlFor="contrib" help="Percentage of each wager that funds the jackpot pool.">
        <div style={{ position: "relative" }}>
          <input id="contrib" type="number" min={0} max={100} step="0.01" value={form.contributionPct} onChange={(e) => set("contributionPct", e.target.value)} style={{ ...S.input, paddingRight: 28 }} />
          <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#737373", fontSize: 13 }}>%</span>
        </div>
      </Field>
      <Field label="Volatility" htmlFor="vol" help="Higher volatility means rarer but larger wins.">
        <Select id="vol" value={form.volatility} onChange={(v) => set("volatility", Number(v))} options={VOLATILITY_OPTS} />
      </Field>
      <div style={S.grid2}>
        <Field label="Minimum Wager" htmlFor="min-wager"><MoneyInput id="min-wager" value={form.minWager} onChange={(v) => set("minWager", v)} /></Field>
        <Field label="Maximum Wager" htmlFor="max-wager"><MoneyInput id="max-wager" value={form.maxWager} onChange={(v) => set("maxWager", v)} /></Field>
      </div>
    </>
  );
}

function FrequencyFields({ form, set }: { form: FormState; set: <K extends keyof FormState>(k: K, v: FormState[K]) => void }) {
  return (
    <>
      <Field label="Win Mode">
        <div style={{ display: "flex", gap: 12 }}>
          {(["fixed", "range"] as const).map((m) => (
            <button key={m} type="button" onClick={() => set("freqMode", m)}
              style={{
                flex: 1, padding: 12, borderRadius: 6, cursor: "pointer",
                border: `1px solid ${form.freqMode === m ? "#3b82f6" : "#262626"}`,
                background: form.freqMode === m ? "rgba(59,130,246,0.08)" : "#171717",
                color: "#fafafa", fontSize: 14, textTransform: "capitalize",
              }}>
              {m === "fixed" ? "Fixed Win Amount" : "Win Range"}
            </button>
          ))}
        </div>
      </Field>
      {form.freqMode === "fixed" ? (
        <Field label="Fixed Win Amount" htmlFor="freq-fixed"><MoneyInput id="freq-fixed" value={form.freqFixedWin} onChange={(v) => set("freqFixedWin", v)} /></Field>
      ) : (
        <>
          <Field label="Average Win Amount" htmlFor="freq-avg"><MoneyInput id="freq-avg" value={form.freqAvgWin} onChange={(v) => set("freqAvgWin", v)} /></Field>
          <div style={S.grid2}>
            <Field label="Minimum Win" htmlFor="freq-min"><MoneyInput id="freq-min" value={form.freqMinWin} onChange={(v) => set("freqMinWin", v)} /></Field>
            <Field label="Maximum Win" htmlFor="freq-max"><MoneyInput id="freq-max" value={form.freqMaxWin} onChange={(v) => set("freqMaxWin", v)} /></Field>
          </div>
        </>
      )}
      <Field label="Volatility" htmlFor="freq-vol">
        <Select id="freq-vol" value={form.volatility} onChange={(v) => set("volatility", Number(v))} options={VOLATILITY_OPTS} />
      </Field>
      <div style={S.grid2}>
        <Field label="Minimum Wager" htmlFor="freq-min-wager"><MoneyInput id="freq-min-wager" value={form.minWager} onChange={(v) => set("minWager", v)} /></Field>
        <Field label="Maximum Wager" htmlFor="freq-max-wager"><MoneyInput id="freq-max-wager" value={form.maxWager} onChange={(v) => set("maxWager", v)} /></Field>
      </div>
      <Field label="Cadence" htmlFor="freq-cadence">
        <Select id="freq-cadence" value={form.freqCadence} onChange={(v) => set("freqCadence", v as FormState["freqCadence"])}
          options={[{ value: "daily", label: "Daily" }, { value: "weekly", label: "Weekly" }, { value: "monthly", label: "Monthly" }]} />
      </Field>
    </>
  );
}

function MustDropFields({ form, set }: { form: FormState; set: <K extends keyof FormState>(k: K, v: FormState[K]) => void }) {
  return (
    <>
      <div style={S.grid2}>
        <Field label="Minimum Win Amount" htmlFor="md-min"><MoneyInput id="md-min" value={form.mdMinWin} onChange={(v) => set("mdMinWin", v)} /></Field>
        <Field label="Maximum Win Amount" htmlFor="md-max"><MoneyInput id="md-max" value={form.mdMaxWin} onChange={(v) => set("mdMaxWin", v)} /></Field>
      </div>
      <Field label="Volatility" htmlFor="md-vol">
        <Select id="md-vol" value={form.volatility} onChange={(v) => set("volatility", Number(v))} options={VOLATILITY_OPTS} />
      </Field>
      <div style={S.grid2}>
        <Field label="Minimum Wager" htmlFor="md-min-wager"><MoneyInput id="md-min-wager" value={form.minWager} onChange={(v) => set("minWager", v)} /></Field>
        <Field label="Maximum Wager" htmlFor="md-max-wager"><MoneyInput id="md-max-wager" value={form.maxWager} onChange={(v) => set("maxWager", v)} /></Field>
      </div>
      <Field label="Drop Frequency" htmlFor="md-freq">
        <Select id="md-freq" value={form.mdFrequency} onChange={(v) => set("mdFrequency", v as FormState["mdFrequency"])}
          options={[{ value: "daily", label: "Daily" }, { value: "weekly", label: "Weekly" }, { value: "monthly", label: "Monthly" }]} />
      </Field>
      <div style={S.grid2}>
        <Field label="Start Date & Time" htmlFor="md-start">
          <input id="md-start" type="datetime-local" value={form.mdStartAt} onChange={(e) => set("mdStartAt", e.target.value)} style={S.input} />
        </Field>
        <Field label="End Date & Time" htmlFor="md-end">
          <input id="md-end" type="datetime-local" value={form.mdEndAt} onChange={(e) => set("mdEndAt", e.target.value)} style={S.input} />
        </Field>
      </div>
      <div style={{ ...S.row, display: "flex", alignItems: "center", justifyContent: "space-between", padding: 16, border: "1px solid #262626", borderRadius: 8, background: "#0f0f0f" }}>
        <div>
          <div style={{ ...S.label, marginBottom: 2 }}>Community Split</div>
          <div style={{ fontSize: 12, color: "#737373" }}>Split the prize across multiple eligible players.</div>
        </div>
        <Toggle checked={form.mdCommunitySplit} onChange={(v) => set("mdCommunitySplit", v)} />
      </div>
    </>
  );
}

function MultiLevelFields({ form, set }: { form: FormState; set: <K extends keyof FormState>(k: K, v: FormState[K]) => void }) {
  function updateTier(i: number, patch: Partial<Tier>) {
    set("tiers", form.tiers.map((t, idx) => idx === i ? { ...t, ...patch } : t));
  }
  function addTier() {
    set("tiers", [...form.tiers, { name: `Tier ${form.tiers.length + 1}`, minWin: "0", maxWin: "0", contributionPct: "0.5" }]);
  }
  function removeTier(i: number) {
    set("tiers", form.tiers.filter((_, idx) => idx !== i));
  }
  return (
    <>
      <Field label="Volatility" htmlFor="ml-vol" help="Applies to all tiers.">
        <Select id="ml-vol" value={form.volatility} onChange={(v) => set("volatility", Number(v))} options={VOLATILITY_OPTS} />
      </Field>
      <Field label="Tiers" help="Each tier defines a win-amount band and its share of the contribution.">
        <div style={{ border: "1px solid #262626", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr 40px", gap: 8, padding: "10px 12px", background: "#171717", fontSize: 12, color: "#a3a3a3", fontWeight: 600 }}>
            <div>Name</div><div>Min Win</div><div>Max Win</div><div>Contribution %</div><div></div>
          </div>
          {form.tiers.map((t, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr 40px", gap: 8, padding: "10px 12px", borderTop: "1px solid #262626", alignItems: "center" }}>
              <input value={t.name} onChange={(e) => updateTier(i, { name: e.target.value })} style={S.input} />
              <input type="number" min={0} step="0.01" value={t.minWin} onChange={(e) => updateTier(i, { minWin: e.target.value })} style={S.input} />
              <input type="number" min={0} step="0.01" value={t.maxWin} onChange={(e) => updateTier(i, { maxWin: e.target.value })} style={S.input} />
              <input type="number" min={0} step="0.01" value={t.contributionPct} onChange={(e) => updateTier(i, { contributionPct: e.target.value })} style={S.input} />
              <button type="button" onClick={() => removeTier(i)} disabled={form.tiers.length <= 1}
                style={{ background: "transparent", border: "1px solid #404040", color: "#a3a3a3", borderRadius: 6, cursor: form.tiers.length <= 1 ? "not-allowed" : "pointer", height: 36 }}>
                ×
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addTier} style={{ ...S.btnGhost, marginTop: 10, padding: "8px 16px" }}>+ Add Tier</button>
      </Field>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────
function NewJackpotPage() {
  const { brandId } = React.useContext(BrandContext);
  const navigate = useNavigate();
  const [form, setForm] = React.useState<FormState>(initialState);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [submitting, setSubmitting] = React.useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  }

  function validateAll(): boolean {
    const e: Record<string, string> = {};
    if (!form.type) e.type = "Select a jackpot type";
    if (!form.name.trim()) e.name = "Name is required";
    else if (form.name.trim().length > 100) e.name = "Max 100 characters";
    const pct = Number(form.contributionPct);
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) e.contributionPct = "0–100";
    const seed = Number(form.seedAmount);
    if (!Number.isFinite(seed) || seed < 0) e.seedAmount = "Must be ≥ 0";
    const pool = Number(form.poolBalance);
    if (!Number.isFinite(pool) || pool < 0) e.poolBalance = "Must be ≥ 0";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function buildConfig(): Record<string, any> {
    const base: Record<string, any> = {
      type: form.type,
      minWager: Number(form.minWager) || 0,
      maxWager: Number(form.maxWager) || 0,
    };
    switch (form.type) {
      case "frequency":
        return {
          ...base,
          mode: form.freqMode,
          fixedWin: form.freqMode === "fixed" ? Number(form.freqFixedWin) : undefined,
          avgWin: form.freqMode === "range" ? Number(form.freqAvgWin) : undefined,
          minWin: form.freqMode === "range" ? Number(form.freqMinWin) : undefined,
          maxWin: form.freqMode === "range" ? Number(form.freqMaxWin) : undefined,
          cadence: form.freqCadence,
        };
      case "must_drop":
        return {
          ...base,
          minWin: Number(form.mdMinWin),
          maxWin: Number(form.mdMaxWin),
          frequency: form.mdFrequency,
          startAt: form.mdStartAt || null,
          endAt: form.mdEndAt || null,
          communitySplit: form.mdCommunitySplit,
        };
      case "multi_level":
        return {
          ...base,
          tiers: form.tiers.map((t) => ({
            name: t.name,
            minWin: Number(t.minWin),
            maxWin: Number(t.maxWin),
            contributionPct: Number(t.contributionPct),
          })),
        };
      default:
        return base;
    }
  }

  async function handleSubmit() {
    if (!validateAll()) {
      toast.error("Please fix the validation errors");
      return;
    }
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
        poolBalance: Number(form.poolBalance),
        triggerThreshold: Number(form.poolBalance) * 2,
        volatility: form.volatility,
        jackpotType: form.type,
        config: buildConfig(),
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

  const typeLabel = TYPE_CARDS.find((t) => t.id === form.type)?.name ?? "";
  const canSave = form.type !== null && form.name.trim().length > 0 && !submitting;

  return (
    <div style={S.page}>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 48px 120px" }}>
        <div>
          <Link to="/backoffice/jackpots" style={{ color: "#60a5fa", fontSize: 13, textDecoration: "none" }}>← Back to Jackpots</Link>
          <h1 style={{ ...S.h1, marginTop: 8 }}>Create New Jackpot</h1>
          <p style={S.sub}>Configure the general setup on the left, then fine-tune the model on the right.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 32, marginTop: 32, alignItems: "start" }}>
          {/* Left column — General Setup */}
          <aside style={{ position: "sticky", top: 24, background: "#0f0f0f", border: "1px solid #262626", borderRadius: 10, padding: 24 }}>
            <div style={{ ...S.sideTitle, marginBottom: 20 }}>General Setup</div>

            <Field label="Jackpot Name" htmlFor="name" error={errors.name}>
              <input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} maxLength={100} placeholder="e.g. Mega Spin" style={S.input} />
            </Field>

            <div style={{ ...S.row, display: "flex", alignItems: "center", justifyContent: "space-between", padding: 14, border: "1px solid #262626", borderRadius: 8, background: "#171717" }}>
              <div>
                <div style={{ ...S.label, marginBottom: 2 }}>Enabled</div>
                <div style={{ fontSize: 12, color: "#737373" }}>Accept contributions on save.</div>
              </div>
              <Toggle checked={form.enabled} onChange={(v) => set("enabled", v)} />
            </div>

            <Field label="Jackpot Type" htmlFor="jp-type" error={errors.type} help="Determines which model-specific fields appear on the right.">
              <Select
                id="jp-type"
                value={form.type ?? ""}
                onChange={(v) => set("type", (v || null) as JackpotKind | null)}
                options={[
                  { value: "", label: "Select a type…" },
                  { value: "classic", label: "Classic" },
                  { value: "frequency", label: "Frequency" },
                  { value: "must_drop", label: "Must Drop" },
                  { value: "multi_level", label: "Multi-Level" },
                ]}
              />
            </Field>
          </aside>

          {/* Right column — Dynamic Setup */}
          <section style={{ background: "#0f0f0f", border: "1px solid #262626", borderRadius: 10, padding: 28, minHeight: 480 }}>
            {!form.type ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "80px 20px", color: "#737373" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>⚙️</div>
                <div style={{ fontSize: 16, color: "#d4d4d4", marginBottom: 6 }}>Pick a Jackpot Type</div>
                <div style={{ fontSize: 13, maxWidth: 320 }}>The model, pool, and seed configuration fields will appear here.</div>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid #262626" }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: "#fafafa" }}>{typeLabel} Configuration</div>
                    <div style={{ fontSize: 13, color: "#a3a3a3", marginTop: 4 }}>Model · Pool · Seed</div>
                  </div>
                </div>

                {/* Model section */}
                <SectionHeading>Model</SectionHeading>
                {form.type === "classic" && <ClassicFields form={form} set={set} />}
                {form.type === "frequency" && <FrequencyFields form={form} set={set} />}
                {form.type === "must_drop" && <MustDropFields form={form} set={set} />}
                {form.type === "multi_level" && <MultiLevelFields form={form} set={set} />}

                {/* Pool & Seed section */}
                <SectionHeading>Pool &amp; Seed</SectionHeading>
                <div style={S.grid2}>
                  <Field label="Initial Pool Balance" htmlFor="pool" error={errors.poolBalance} help="Starting pool balance.">
                    <MoneyInput id="pool" value={form.poolBalance} onChange={(v) => set("poolBalance", v)} />
                  </Field>
                  <Field label="Base Seed Amount" htmlFor="seed" error={errors.seedAmount} help="Reset amount after a win.">
                    <MoneyInput id="seed" value={form.seedAmount} onChange={(v) => set("seedAmount", v)} />
                  </Field>
                </div>
              </>
            )}
          </section>
        </div>
      </div>

      {/* Bottom action bar */}
      <div style={S.footer}>
        <Link to="/backoffice/jackpots" style={{ ...S.btnGhost, textDecoration: "none", display: "inline-block" }}>Cancel</Link>
        <button type="button" onClick={handleSubmit} disabled={!canSave} style={S.btnPrimary(!canSave)}>
          {submitting ? "Creating…" : "Save Jackpot"}
        </button>
      </div>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, color: "#737373", margin: "8px 0 16px", fontWeight: 600 }}>
      {children}
    </div>
  );
}

function SummaryRow({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #1f1f1f", fontSize: 14 }}>
      <span style={{ color: "#a3a3a3" }}>{k}</span>
      <span style={{ color: "#fafafa", fontWeight: 500 }}>{v}</span>
    </div>
  );
}

export const Route = createFileRoute("/backoffice/jackpots/new")({
  ssr: false,
  component: NewJackpotPage,
});
