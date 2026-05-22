import * as React from "react";
import axios from "axios";
import { useQuery } from "react-query";
import { toast } from "react-toastify";
import { useNavigate } from "@tanstack/react-router";
import { Plus, Trash2, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { BrandContext } from "@/backoffice/app";
import type { JackpotDTO } from "@/lib/jackpot/types";
import {
  denominatorToProbability,
  formatDropFrequency,
  probabilityFixed8,
} from "@/lib/jackpot/tier-forecast";

type OverlappingRule = "split" | "additive";

interface GroupDTO {
  id: number;
  name: string;
  status: "draft" | "active" | "disabled";
  overlappingRule: string;
}

/**
 * Step 2 child-tier draft. Numeric fields that carry high precision
 * (triggerProbability, contributionRate) are kept as plain strings until
 * submission to avoid React/JS float truncation. They are converted via
 * `Number.parseFloat(val).toFixed(8)` only at the POST boundary.
 */
interface ChildDraft {
  uid: string;
  jackpotId: number | null;
  tierName: string;
  tierRank: string;
  /** "1 in X" denominator as typed by the operator (string for precision/UX). */
  triggerDenominator: string;
  contributionRate: string; // string until submit
}

function newChildDraft(rank: number): ChildDraft {
  return {
    uid: crypto.randomUUID(),
    jackpotId: null,
    tierName: "",
    tierRank: String(rank),
    triggerDenominator: "10000",
    contributionRate: "0.01000000",
  };
}

/** Default ephemeral daily-volume slider value. NEVER persisted. */
const DEFAULT_DAILY_VOLUME = 25000;


export function MultiJackpotWizard() {
  const { brandId } = React.useContext(BrandContext);
  const navigate = useNavigate();
  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = React.useState(false);

  // Step 1
  const [name, setName] = React.useState("");
  const [overlappingRule, setOverlappingRule] =
    React.useState<OverlappingRule>("split");
  const [group, setGroup] = React.useState<GroupDTO | null>(null);

  // Step 2
  const [children, setChildren] = React.useState<ChildDraft[]>([
    newChildDraft(1),
  ]);
  const [savedChildren, setSavedChildren] = React.useState<
    Array<{ jackpotId: number; tierRank: number; jackpotName: string }>
  >([]);

  const jackpotsQuery = useQuery<JackpotDTO[]>({
    queryKey: ["wizard-jackpots", brandId],
    enabled: brandId != null,
    queryFn: async () => {
      const res = await axios.get<JackpotDTO[]>("/api/v1/jackpots", {
        headers: { brandId: String(brandId) },
      });
      return res.data;
    },
  });

  const attachableJackpots = React.useMemo(() => {
    return (jackpotsQuery.data ?? []).filter((j) => {
      // Exclude jackpots already attached (in DB sense; simple check by id)
      return !savedChildren.some((c) => c.jackpotId === j.id);
    });
  }, [jackpotsQuery.data, savedChildren]);

  /* ──────────────────────────  Step 1: create group  ─────────────────────── */
  async function handleCreateGroup() {
    if (!name.trim()) {
      toast.error("MultiJackpot name is required");
      return;
    }
    if (brandId == null) {
      toast.error("No brand selected");
      return;
    }
    setSubmitting(true);
    try {
      const res = await axios.post<GroupDTO>(
        "/api/v1/jackpot-groups",
        { name: name.trim(), overlappingRule },
        { headers: { brandId: String(brandId), "Content-Type": "application/json" } },
      );
      setGroup(res.data);
      setStep(2);
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? err?.message ?? "Failed to create MultiJackpot");
    } finally {
      setSubmitting(false);
    }
  }

  /* ──────────────────────────  Step 2: attach tier  ──────────────────────── */
  function updateChild(uid: string, patch: Partial<ChildDraft>) {
    setChildren((prev) =>
      prev.map((c) => (c.uid === uid ? { ...c, ...patch } : c)),
    );
  }

  function addChildRow() {
    const nextRank =
      Math.max(0, ...savedChildren.map((c) => c.tierRank), ...children.map((c) => Number(c.tierRank) || 0)) + 1;
    setChildren((prev) => [...prev, newChildDraft(nextRank)]);
  }

  function removeChildRow(uid: string) {
    setChildren((prev) => (prev.length <= 1 ? prev : prev.filter((c) => c.uid !== uid)));
  }

  async function saveChild(draft: ChildDraft) {
    if (!group) return;
    if (draft.jackpotId == null) {
      toast.error("Select a jackpot to attach");
      return;
    }
    const tierRank = Math.max(0, Math.trunc(Number(draft.tierRank) || 0));
    const probability = denominatorToProbability(draft.triggerDenominator);
    const body: Record<string, unknown> = {
      jackpotId: draft.jackpotId,
      tierRank,
      triggerProbability: Number(probability.toFixed(8)),
      contributionRate: Number((Number.parseFloat(draft.contributionRate) || 0).toFixed(8)),
    };
    if (draft.tierName.trim()) body.name = draft.tierName.trim();
    setSubmitting(true);
    try {
      const res = await axios.post(
        `/api/v1/jackpot-groups/${group.id}/children`,
        body,
        { headers: { brandId: String(brandId), "Content-Type": "application/json" } },
      );
      const attached = res.data as JackpotDTO;
      setSavedChildren((prev) => [
        ...prev,
        { jackpotId: attached.id, tierRank, jackpotName: attached.name },
      ]);
      // Drop the saved draft row, leave the rest editable.
      setChildren((prev) => {
        const remaining = prev.filter((c) => c.uid !== draft.uid);
        return remaining.length === 0 ? [newChildDraft(tierRank + 1)] : remaining;
      });
      toast.success(`Attached ${attached.name} at tier ${tierRank}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? err?.message ?? "Failed to attach child tier");
    } finally {
      setSubmitting(false);
    }
  }

  /* ──────────────────────────  Step 3: activate  ─────────────────────────── */
  async function handleActivate() {
    if (!group) return;
    if (savedChildren.length === 0) {
      toast.error("Attach at least one child tier before activating");
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(
        `/api/v1/jackpot-groups/${group.id}/status`,
        { status: "active" },
        { headers: { brandId: String(brandId), "Content-Type": "application/json" } },
      );
      toast.success(`MultiJackpot "${group.name}" is now active`);
      navigate({ to: "/admin/jackpot-groups" });
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? err?.message ?? "Failed to activate");
    } finally {
      setSubmitting(false);
    }
  }

  /* ───────────────────────────────  render  ──────────────────────────────── */
  return (
    <div className="space-y-6">
      <StepIndicator step={step} />

      {step === 1 && (
        <Card className="p-6 bg-neutral-900/50 border-neutral-800">
          <h2 className="text-lg font-semibold text-white mb-1">
            Step 1 · MultiJackpot details
          </h2>
          <p className="text-sm text-neutral-400 mb-6">
            Name the MultiJackpot group and choose how overlapping wins are split across child tiers.
          </p>
          <div className="grid gap-6 max-w-2xl">
            <div className="space-y-2">
              <Label htmlFor="mj-name" className="text-white">MultiJackpot name</Label>
              <Input
                id="mj-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Mega Drop Suite Q2"
                className="bg-neutral-800 border-neutral-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Overlapping rule</Label>
              <div className="grid grid-cols-2 gap-3">
                <RuleCard
                  active={overlappingRule === "split"}
                  title="Split"
                  description="When more than one tier wins on the same spin, the contribution is split proportionally."
                  onClick={() => setOverlappingRule("split")}
                />
                <RuleCard
                  active={overlappingRule === "additive"}
                  title="Additive"
                  description="Each tier independently consumes its share; bet contribution stacks across winners."
                  onClick={() => setOverlappingRule("additive")}
                />
              </div>
            </div>
          </div>
          <div className="mt-8 flex justify-end">
            <Button
              onClick={handleCreateGroup}
              disabled={submitting || !name.trim()}
              className="bg-blue-500 hover:bg-blue-600"
            >
              Continue <ChevronRight className="ml-1 w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {step === 2 && group && (
        <Card className="p-6 bg-neutral-900/50 border-neutral-800">
          <h2 className="text-lg font-semibold text-white mb-1">
            Step 2 · Attach child tiers
          </h2>
          <p className="text-sm text-neutral-400 mb-6">
            Pick existing jackpots, assign a tier rank, and define each tier's trigger probability and contribution rate.
          </p>

          {savedChildren.length > 0 && (
            <div className="mb-6 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
              <div className="text-xs uppercase tracking-wider text-emerald-400 mb-2">
                Attached ({savedChildren.length})
              </div>
              <ul className="space-y-1 text-sm text-white">
                {savedChildren
                  .slice()
                  .sort((a, b) => a.tierRank - b.tierRank)
                  .map((c) => (
                    <li key={c.jackpotId} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="font-mono text-xs text-neutral-400">tier {c.tierRank}</span>
                      <span>{c.jackpotName}</span>
                      <span className="text-xs text-neutral-500">#{c.jackpotId}</span>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          <div className="space-y-4">
            {children.map((draft) => (
              <ChildTierRow
                key={draft.uid}
                draft={draft}
                jackpots={attachableJackpots}
                onChange={(patch) => updateChild(draft.uid, patch)}
                onRemove={() => removeChildRow(draft.uid)}
                onSave={() => saveChild(draft)}
                disableRemove={children.length <= 1}
                submitting={submitting}
              />
            ))}
          </div>

          <div className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={addChildRow}
              className="border-neutral-700 text-neutral-200"
            >
              <Plus className="w-4 h-4 mr-1" /> Add another tier
            </Button>
          </div>

          <div className="mt-8 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              className="border-neutral-700 text-neutral-200"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <Button
              onClick={() => setStep(3)}
              disabled={savedChildren.length === 0}
              className="bg-blue-500 hover:bg-blue-600"
            >
              Review &amp; activate <ChevronRight className="ml-1 w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {step === 3 && group && (
        <Card className="p-6 bg-neutral-900/50 border-neutral-800">
          <h2 className="text-lg font-semibold text-white mb-1">
            Step 3 · Review &amp; activate
          </h2>
          <p className="text-sm text-neutral-400 mb-6">
            Activating locks the MultiJackpot. To change any child configuration later you must first move it back to Disabled.
          </p>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
              <div className="text-xs uppercase text-neutral-500 mb-1">Name</div>
              <div className="text-white font-medium">{group.name}</div>
            </div>
            <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
              <div className="text-xs uppercase text-neutral-500 mb-1">Overlapping rule</div>
              <div className="text-white font-medium capitalize">{group.overlappingRule}</div>
            </div>
          </div>

          <div className="rounded-lg border border-neutral-800 overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead className="bg-neutral-900 text-neutral-400 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-2">Tier</th>
                  <th className="text-left px-4 py-2">Jackpot</th>
                  <th className="text-left px-4 py-2">ID</th>
                </tr>
              </thead>
              <tbody>
                {savedChildren
                  .slice()
                  .sort((a, b) => a.tierRank - b.tierRank)
                  .map((c) => (
                    <tr key={c.jackpotId} className="border-t border-neutral-800">
                      <td className="px-4 py-2 text-white">{c.tierRank}</td>
                      <td className="px-4 py-2 text-white">{c.jackpotName}</td>
                      <td className="px-4 py-2 font-mono text-xs text-neutral-400">#{c.jackpotId}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 mb-6 text-amber-200 text-sm">
            Activation is a hard lock: child jackpot configuration becomes read-only across the platform until the MultiJackpot is moved back to Disabled.
          </div>

          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setStep(2)}
              className="border-neutral-700 text-neutral-200"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <Button
              onClick={handleActivate}
              disabled={submitting || savedChildren.length === 0}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              Activate MultiJackpot
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  const items: Array<{ n: 1 | 2 | 3; label: string }> = [
    { n: 1, label: "Details" },
    { n: 2, label: "Child tiers" },
    { n: 3, label: "Activate" },
  ];
  return (
    <ol className="flex items-center gap-3">
      {items.map((it, i) => {
        const active = it.n === step;
        const done = it.n < step;
        return (
          <React.Fragment key={it.n}>
            <li className="flex items-center gap-2">
              <span
                className={`w-7 h-7 inline-flex items-center justify-center rounded-full text-xs font-semibold border ${
                  done
                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                    : active
                    ? "bg-blue-500/20 border-blue-500 text-blue-300"
                    : "bg-neutral-900 border-neutral-700 text-neutral-500"
                }`}
              >
                {done ? <Check className="w-4 h-4" /> : it.n}
              </span>
              <span
                className={`text-sm ${
                  active ? "text-white font-medium" : done ? "text-emerald-300" : "text-neutral-500"
                }`}
              >
                {it.label}
              </span>
            </li>
            {i < items.length - 1 && (
              <span className="h-px w-8 bg-neutral-700" aria-hidden />
            )}
          </React.Fragment>
        );
      })}
    </ol>
  );
}

function RuleCard({
  active,
  title,
  description,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-lg border-2 p-4 transition-colors ${
        active
          ? "border-blue-500 bg-blue-500/10"
          : "border-neutral-700 bg-neutral-800/40 hover:border-neutral-600"
      }`}
    >
      <div className="text-white font-medium mb-1">{title}</div>
      <div className="text-xs text-neutral-400">{description}</div>
    </button>
  );
}

function ChildTierRow({
  draft,
  jackpots,
  onChange,
  onRemove,
  onSave,
  disableRemove,
  submitting,
}: {
  draft: ChildDraft;
  jackpots: JackpotDTO[];
  onChange: (patch: Partial<ChildDraft>) => void;
  onRemove: () => void;
  onSave: () => void;
  disableRemove: boolean;
  submitting: boolean;
}) {
  // Simulated daily volume is ephemeral UI-only state — never sent to the API.
  const [dailyVolume, setDailyVolume] = React.useState<number>(DEFAULT_DAILY_VOLUME);
  const probability = denominatorToProbability(draft.triggerDenominator);
  const dropText = formatDropFrequency(probability, dailyVolume);

  function handleJackpotChange(nextId: number | null) {
    const patch: Partial<ChildDraft> = { jackpotId: nextId };
    // Autofill tier name from jackpot profile when picking, but never
    // overwrite a name the operator has already customized.
    if (nextId != null && !draft.tierName.trim()) {
      const picked = jackpots.find((j) => j.id === nextId);
      if (picked?.name) patch.tierName = picked.name;
    }
    onChange(patch);
  }

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-4 space-y-4">
      {/* Custom Tier Name — prominent, top of card */}
      <div className="space-y-2">
        <Label className="text-neutral-300">
          Tier Name <span className="text-neutral-500 font-normal">(operator-facing label)</span>
        </Label>
        <Input
          type="text"
          value={draft.tierName}
          onChange={(e) => onChange({ tierName: e.target.value })}
          placeholder="e.g. Mini, Super Drop, Friday Booster"
          className="bg-neutral-800 border-neutral-700 text-white"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <div className="md:col-span-2 space-y-2">
          <Label className="text-neutral-300">Jackpot</Label>
          <select
            value={draft.jackpotId ?? ""}
            onChange={(e) =>
              handleJackpotChange(e.target.value ? Number(e.target.value) : null)
            }
            className="w-full h-10 rounded-md bg-neutral-800 border border-neutral-700 px-3 text-sm text-white disabled:opacity-60"
          >
            <option value="">Select existing jackpot…</option>
            {jackpots.map((j) => (
              <option key={j.id} value={j.id}>
                #{j.id} · {j.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label className="text-neutral-300">Tier rank</Label>
          <Input
            type="number"
            min={0}
            value={draft.tierRank}
            onChange={(e) => onChange({ tierRank: e.target.value })}
            className="bg-neutral-800 border-neutral-700 text-white"
          />
        </div>
      </div>

      {/* Trigger Probability — dual-input parsing view */}
      <div className="rounded-md border border-neutral-800 bg-neutral-950/40 p-4 space-y-3">
        <div className="text-sm font-medium text-white">Trigger Probability</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <div className="space-y-1">
            <Label className="text-neutral-400 text-xs uppercase tracking-wider">
              Odds
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-neutral-300 text-sm whitespace-nowrap">1 in</span>
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                value={draft.triggerDenominator}
                onChange={(e) => onChange({ triggerDenominator: e.target.value })}
                placeholder="50000"
                className="bg-neutral-800 border-neutral-700 text-white font-mono"
              />
              <span className="text-neutral-300 text-sm whitespace-nowrap">spins</span>
            </div>
            <div className="text-xs text-neutral-500 font-mono pt-1">
              Raw probability: {probabilityFixed8(probability)}
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-neutral-400 text-xs uppercase tracking-wider">
              Contribution rate
            </Label>
            <Input
              type="text"
              inputMode="decimal"
              value={draft.contributionRate}
              onChange={(e) => onChange({ contributionRate: e.target.value })}
              placeholder="0.01000000"
              className="bg-neutral-800 border-neutral-700 text-white font-mono"
            />
            <div className="text-xs text-neutral-500 pt-1">
              Fraction of wager contributed (0–1).
            </div>
          </div>
        </div>
      </div>

      {/* Simulated Daily Volume — local UI only */}
      <div className="rounded-md border border-neutral-800 bg-neutral-950/40 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-neutral-300">
            Simulated Daily Volume{" "}
            <span className="text-neutral-500 font-normal text-xs">(preview only — not saved)</span>
          </Label>
          <span className="font-mono text-sm text-white">
            {dailyVolume.toLocaleString()} spins/day
          </span>
        </div>
        <Slider
          value={[dailyVolume]}
          min={1000}
          max={500000}
          step={1000}
          onValueChange={(v) => setDailyVolume(v[0] ?? DEFAULT_DAILY_VOLUME)}
        />
        <div className="rounded border border-blue-500/30 bg-blue-500/5 p-3">
          <div className="text-xs uppercase tracking-wider text-blue-300 mb-1">
            Estimated Drop Frequency
          </div>
          <div className="text-sm text-white">{dropText}</div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          disabled={disableRemove}
          className="text-red-400 hover:text-red-300"
        >
          <Trash2 className="w-4 h-4 mr-1" /> Remove row
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={onSave}
          disabled={submitting || draft.jackpotId == null}
          className="bg-blue-500 hover:bg-blue-600"
        >
          Save tier
        </Button>
      </div>
    </div>
  );
}

