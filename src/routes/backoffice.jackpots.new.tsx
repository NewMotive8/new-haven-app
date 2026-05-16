import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import * as React from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { BrandContext } from "../backoffice/app";

// ─── Types ────────────────────────────────────────────────────────────────
type JackpotKind = "classic" | "frequency" | "must_drop" | "multi_level";
type FairnessCurve = "linear" | "exponential" | "smooth";
type ThresholdMode = "value" | "time";

interface Level {
  name: string;
  allocationPct: string;
  triggerWeight: string;
}

interface FormState {
  // shared
  name: string;
  type: JackpotKind | null;
  enabled: boolean;
  seedAmount: string;          // Base Seed Amount (per-type, but stored once)
  contributionPct: string;     // 0–100

  // classic
  classicVolatility: number;          // 1–10
  classicCapEnabled: boolean;
  classicCapAmount: string;

  // frequency
  freqTargetIntervalSpins: string;
  freqFairnessCurve: FairnessCurve;

  // must_drop
  mdThresholdMode: ThresholdMode;
  mdAmount: string;            // when value-bound
  mdAt: string;                // when time-bound (datetime-local string)

  // multi_level
  levels: Level[];
}

const initialState: FormState = {
  name: "",
  type: "classic",
  enabled: true,
  seedAmount: "1000",
  contributionPct: "1",

  classicVolatility: 5,
  classicCapEnabled: false,
  classicCapAmount: "10000",

  freqTargetIntervalSpins: "50000",
  freqFairnessCurve: "linear",

  mdThresholdMode: "value",
  mdAmount: "5000",
  mdAt: "",

  levels: [
    { name: "Bronze", allocationPct: "20", triggerWeight: "60" },
    { name: "Silver", allocationPct: "30", triggerWeight: "30" },
    { name: "Gold", allocationPct: "50", triggerWeight: "10" },
  ],
};

// ─── Styles ───────────────────────────────────────────────────────────────
const S = {
  page: { minHeight: "calc(100vh - 56px)", background: "#0a0a0a", color: "#f5f5f5" } as React.CSSProperties,
  sideTitle: { fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, color: "#737373" } as React.CSSProperties,
  h1: { margin: 0, fontSize: 24, fontWeight: 600 } as React.CSSProperties,
  sub: { margin: "6px 0 0", color: "#a3a3a3", fontSize: 14 } as React.CSSProperties,
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

function PercentInput({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ position: "relative" }}>
      <input id={id} type="number" min={0} max={100} step="0.01" value={value} onChange={(e) => onChange(e.target.value)} style={{ ...S.input, paddingRight: 28 }} />
      <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#737373", fontSize: 13 }}>%</span>
    </div>
  );
}

function PercentSliderInput({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  const num = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 130px", gap: 12, alignItems: "center" }}>
      <input
        type="range" min={0} max={100} step={0.1} value={num}
        onChange={(e) => onChange(e.target.value)}
        style={{ accentColor: "#3b82f6", width: "100%" }}
      />
      <PercentInput id={id} value={value} onChange={onChange} />
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

function VolatilitySlider({ id, value, onChange }: { id: string; value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 56px", gap: 12, alignItems: "center" }}>
      <input
        type="range" min={1} max={10} step={1} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ accentColor: "#3b82f6", width: "100%" }}
      />
      <div style={{ ...S.input, textAlign: "center", padding: "10px 0", fontWeight: 600 }}>{value}</div>
      <input id={id} type="hidden" value={value} readOnly />
    </div>
  );
}

function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div style={{ display: "flex", gap: 0, background: "#171717", border: "1px solid #262626", borderRadius: 6, padding: 4 }}>
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            style={{
              flex: 1, padding: "8px 12px", borderRadius: 4, border: "none", cursor: "pointer",
              background: active ? "#3b82f6" : "transparent",
              color: active ? "#fff" : "#d4d4d4",
              fontSize: 13, fontWeight: active ? 600 : 400,
              transition: "all 120ms",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Type-specific dynamic fields ─────────────────────────────────────────
type Setter = <K extends keyof FormState>(k: K, v: FormState[K]) => void;

function ClassicFields({ form, set, errors }: { form: FormState; set: Setter; errors: Record<string, string> }) {
  return (
    <>
      <Field label="Base Seed Amount" htmlFor="seed" error={errors.seedAmount} help="Pool resets to this amount after a win.">
        <MoneyInput id="seed" value={form.seedAmount} onChange={(v) => set("seedAmount", v)} />
      </Field>
      <Field label="Contribution Percentage" htmlFor="contrib" error={errors.contributionPct} help="Share of each wager that funds the jackpot pool.">
        <PercentSliderInput id="contrib" value={form.contributionPct} onChange={(v) => set("contributionPct", v)} />
      </Field>
      <Field label="Volatility Score" htmlFor="vol" help="1 = very low (frequent small wins) · 10 = very high (rare large wins).">
        <VolatilitySlider id="vol" value={form.classicVolatility} onChange={(v) => set("classicVolatility", v)} />
      </Field>
      <div style={{ ...S.row, padding: 16, border: "1px solid #262626", borderRadius: 8, background: "#0f0f0f" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: form.classicCapEnabled ? 14 : 0 }}>
          <div>
            <div style={{ ...S.label, marginBottom: 2 }}>Maximum Cap Limit</div>
            <div style={{ fontSize: 12, color: "#737373" }}>Cap the pool to a hard ceiling. Excess contributions overflow.</div>
          </div>
          <Toggle checked={form.classicCapEnabled} onChange={(v) => set("classicCapEnabled", v)} />
        </div>
        {form.classicCapEnabled && (
          <Field label="Cap Amount" htmlFor="cap" error={errors.classicCapAmount}>
            <MoneyInput id="cap" value={form.classicCapAmount} onChange={(v) => set("classicCapAmount", v)} />
          </Field>
        )}
      </div>
    </>
  );
}

function FrequencyFields({ form, set, errors }: { form: FormState; set: Setter; errors: Record<string, string> }) {
  return (
    <>
      <Field label="Base Seed Amount" htmlFor="freq-seed" error={errors.seedAmount}>
        <MoneyInput id="freq-seed" value={form.seedAmount} onChange={(v) => set("seedAmount", v)} />
      </Field>
      <Field label="Contribution Percentage" htmlFor="freq-contrib" error={errors.contributionPct}>
        <PercentInput id="freq-contrib" value={form.contributionPct} onChange={(v) => set("contributionPct", v)} />
      </Field>
      <Field label="Target Hit Interval" htmlFor="freq-interval" error={errors.freqTargetIntervalSpins} help="Average number of spins between drops.">
        <div style={{ position: "relative" }}>
          <input
            id="freq-interval" type="number" min={1} step={1}
            value={form.freqTargetIntervalSpins}
            onChange={(e) => set("freqTargetIntervalSpins", e.target.value)}
            style={{ ...S.input, paddingRight: 56 }}
          />
          <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#737373", fontSize: 13 }}>spins</span>
        </div>
      </Field>
      <Field label="Fairness Multiplier Curve" htmlFor="freq-curve" help="Controls how trigger probability ramps as the interval is approached.">
        <Select
          id="freq-curve" value={form.freqFairnessCurve}
          onChange={(v) => set("freqFairnessCurve", v as FairnessCurve)}
          options={[
            { value: "linear", label: "Linear" },
            { value: "exponential", label: "Exponential" },
            { value: "smooth", label: "Smooth" },
          ]}
        />
      </Field>
    </>
  );
}

function MustDropFields({ form, set, errors }: { form: FormState; set: Setter; errors: Record<string, string> }) {
  return (
    <>
      <Field label="Base Seed Amount" htmlFor="md-seed" error={errors.seedAmount}>
        <MoneyInput id="md-seed" value={form.seedAmount} onChange={(v) => set("seedAmount", v)} />
      </Field>
      <Field label="Contribution Percentage" htmlFor="md-contrib" error={errors.contributionPct}>
        <PercentInput id="md-contrib" value={form.contributionPct} onChange={(v) => set("contributionPct", v)} />
      </Field>
      <Field label="Threshold Type" help="Choose whether the jackpot must drop by a pool size or a deadline.">
        <Segmented<ThresholdMode>
          value={form.mdThresholdMode}
          onChange={(v) => set("mdThresholdMode", v)}
          options={[
            { value: "value", label: "Value-Bound" },
            { value: "time", label: "Time-Bound" },
          ]}
        />
      </Field>
      {form.mdThresholdMode === "value" ? (
        <Field label="Must Drop By Amount" htmlFor="md-amount" error={errors.mdAmount} help="Jackpot is forced to drop once the pool reaches this amount.">
          <MoneyInput id="md-amount" value={form.mdAmount} onChange={(v) => set("mdAmount", v)} />
        </Field>
      ) : (
        <Field label="Must Drop By Date / Time" htmlFor="md-at" error={errors.mdAt} help="Jackpot is forced to drop by this moment.">
          <input
            id="md-at" type="datetime-local"
            value={form.mdAt} onChange={(e) => set("mdAt", e.target.value)}
            style={{ ...S.input, colorScheme: "dark" }}
          />
        </Field>
      )}
    </>
  );
}

function MultiLevelFields({ form, set, errors }: { form: FormState; set: Setter; errors: Record<string, string> }) {
  function updateLevel(i: number, patch: Partial<Level>) {
    set("levels", form.levels.map((l, idx) => idx === i ? { ...l, ...patch } : l));
  }
  function addLevel() {
    set("levels", [...form.levels, { name: `Tier ${form.levels.length + 1}`, allocationPct: "0", triggerWeight: "0" }]);
  }
  function removeLevel(i: number) {
    if (form.levels.length <= 1) return;
    set("levels", form.levels.filter((_, idx) => idx !== i));
  }
  const sum = form.levels.reduce((acc, l) => acc + (Number(l.allocationPct) || 0), 0);
  const sumOk = Math.abs(sum - 100) < 0.01;
  return (
    <>
      <Field label="Global Base Seed Amount" htmlFor="ml-seed" error={errors.seedAmount}>
        <MoneyInput id="ml-seed" value={form.seedAmount} onChange={(v) => set("seedAmount", v)} />
      </Field>
      <Field label="Global Contribution Percentage" htmlFor="ml-contrib" error={errors.contributionPct}>
        <PercentInput id="ml-contrib" value={form.contributionPct} onChange={(v) => set("contributionPct", v)} />
      </Field>
      <Field label="Level Tiers" error={errors.levels} help="Split the contribution across named tiers. Allocation Share % should sum to 100.">
        <div style={{ border: "1px solid #262626", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 40px", gap: 8, padding: "10px 12px", background: "#171717", fontSize: 12, color: "#a3a3a3", fontWeight: 600 }}>
            <div>Level Name</div><div>Allocation Share %</div><div>Trigger Odds / Weight</div><div></div>
          </div>
          {form.levels.map((l, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 40px", gap: 8, padding: "10px 12px", borderTop: "1px solid #262626", alignItems: "center" }}>
              <input value={l.name} onChange={(e) => updateLevel(i, { name: e.target.value })} style={S.input} placeholder="Tier name" />
              <input type="number" min={0} max={100} step="0.01" value={l.allocationPct} onChange={(e) => updateLevel(i, { allocationPct: e.target.value })} style={S.input} />
              <input type="number" min={0} step="0.01" value={l.triggerWeight} onChange={(e) => updateLevel(i, { triggerWeight: e.target.value })} style={S.input} />
              <button type="button" onClick={() => removeLevel(i)} disabled={form.levels.length <= 1}
                style={{ background: "transparent", border: "1px solid #404040", color: "#a3a3a3", borderRadius: 6, cursor: form.levels.length <= 1 ? "not-allowed" : "pointer", height: 36 }}>
                ×
              </button>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
          <button type="button" onClick={addLevel} style={{ ...S.btnGhost, padding: "8px 16px" }}>+ Add Level Tier</button>
          <div style={{ fontSize: 12, color: sumOk ? "#22c55e" : "#fbbf24" }}>
            Allocation total: {sum.toFixed(2)}% {sumOk ? "✓" : "(should be 100%)"}
          </div>
        </div>
      </Field>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────
const TYPE_LABELS: Record<JackpotKind, string> = {
  classic: "Classic",
  frequency: "Frequency",
  must_drop: "Must Drop",
  multi_level: "Multi-Level",
};

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
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) e.contributionPct = "Must be between 0 and 100";

    const seed = Number(form.seedAmount);
    if (!Number.isFinite(seed) || seed < 0) e.seedAmount = "Must be ≥ 0";

    if (form.type === "classic" && form.classicCapEnabled) {
      const cap = Number(form.classicCapAmount);
      if (!Number.isFinite(cap) || cap <= seed) e.classicCapAmount = "Cap must be greater than seed";
    }
    if (form.type === "frequency") {
      const n = Number(form.freqTargetIntervalSpins);
      if (!Number.isFinite(n) || n < 1) e.freqTargetIntervalSpins = "Must be ≥ 1";
    }
    if (form.type === "must_drop") {
      if (form.mdThresholdMode === "value") {
        const a = Number(form.mdAmount);
        if (!Number.isFinite(a) || a <= 0) e.mdAmount = "Must be greater than 0";
      } else {
        if (!form.mdAt) e.mdAt = "Pick a date and time";
        else if (new Date(form.mdAt).getTime() <= Date.now()) e.mdAt = "Must be in the future";
      }
    }
    if (form.type === "multi_level") {
      if (form.levels.length === 0) e.levels = "Add at least one tier";
      else if (form.levels.some((l) => !l.name.trim())) e.levels = "All tiers need a name";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function buildConfig(): Record<string, any> {
    const contributionPct = Number(form.contributionPct) || 0;
    switch (form.type) {
      case "classic":
        return {
          type: "classic",
          contributionPct,
          volatility: form.classicVolatility,
          capEnabled: form.classicCapEnabled,
          ...(form.classicCapEnabled ? { capAmount: Number(form.classicCapAmount) } : {}),
        };
      case "frequency":
        return {
          type: "frequency",
          contributionPct,
          targetIntervalSpins: Number(form.freqTargetIntervalSpins),
          fairnessCurve: form.freqFairnessCurve,
        };
      case "must_drop":
        return {
          type: "must_drop",
          contributionPct,
          thresholdMode: form.mdThresholdMode,
          ...(form.mdThresholdMode === "value"
            ? { mustDropByAmount: Number(form.mdAmount) }
            : { mustDropByAt: form.mdAt ? new Date(form.mdAt).toISOString() : null }),
        };
      case "multi_level":
        return {
          type: "multi_level",
          contributionPct,
          tiers: form.levels.map((l) => ({
            name: l.name,
            allocationPct: Number(l.allocationPct) || 0,
            triggerWeight: Number(l.triggerWeight) || 0,
          })),
        };
      default:
        return {};
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
      const seedAmount = Number(form.seedAmount);
      const volatility = form.type === "classic" ? form.classicVolatility : 5;
      const body = {
        name: form.name.trim(),
        enabled: form.enabled,
        contributionRate: Number(form.contributionPct) / 100,
        seedAmount,
        poolBalance: seedAmount,
        triggerThreshold: seedAmount * 2,
        volatility,
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

  const typeLabel = form.type ? TYPE_LABELS[form.type] : "";
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
                <div style={{ fontSize: 13, maxWidth: 320 }}>The model-specific configuration fields will appear here.</div>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid #262626" }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: "#fafafa" }}>{typeLabel} Configuration</div>
                    <div style={{ fontSize: 13, color: "#a3a3a3", marginTop: 4 }}>All fields persist to the jackpot's trigger configuration.</div>
                  </div>
                </div>

                {form.type === "classic" && <ClassicFields form={form} set={set} errors={errors} />}
                {form.type === "frequency" && <FrequencyFields form={form} set={set} errors={errors} />}
                {form.type === "must_drop" && <MustDropFields form={form} set={set} errors={errors} />}
                {form.type === "multi_level" && <MultiLevelFields form={form} set={set} errors={errors} />}
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

export const Route = createFileRoute("/backoffice/jackpots/new")({
  ssr: false,
  component: NewJackpotPage,
});
