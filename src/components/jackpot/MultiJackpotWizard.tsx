import * as React from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "@tanstack/react-router";
import {
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Check,
  Lock,
  Layers,
  Sparkles,
  Crown,
  Trophy,
  Medal,
  Gem,
  ShieldAlert,
  Coins,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { BrandContext } from "@/backoffice/app";
import type { JackpotDTO } from "@/lib/jackpot/types";
import { GameAssignmentStep, type GameAssignmentValue } from "@/components/jackpot/GameAssignmentStep";
import type { MasterCategory } from "@/lib/jackpot/master-categories";

import {
  denominatorToProbability,
  formatDropFrequency,
  probabilityFixed8,
} from "@/lib/jackpot/tier-forecast";

type ContributionSource = "player" | "operator";
type ContributionType = "percentage" | "fixed";

interface GroupDTO {
  id: number;
  name: string;
  status: "draft" | "active" | "disabled";
  overlappingRule: string;
  contributionSource: ContributionSource;
  contributionType: ContributionType;
  masterContributionValue: number;
}

interface ChildDraft {
  uid: string;
  tierName: string;
  tierRank: string;
  seedAmount: string;
  triggerDenominator: string;
  splitShare: string;
}

const TIER_PRESETS = ["Mini", "Minor", "Major", "Grand"] as const;
const DEFAULT_DAILY_VOLUME = 25000;

function newChildDraft(rank: number): ChildDraft {
  return {
    uid: crypto.randomUUID(),
    tierName: "",
    tierRank: String(rank),
    seedAmount: "100.00",
    triggerDenominator: "10000",
    splitShare: "0.00",
  };
}

/** Bronze → Silver → Gold → Platinum theming by tier rank. */
function rankTheme(rank: number) {
  if (rank >= 4) {
    return {
      label: "Platinum",
      Icon: Crown,
      ring: "ring-cyan-300/40",
      border: "border-cyan-300/50",
      chip: "bg-cyan-300/15 text-cyan-200 border-cyan-300/40",
      bar: "from-cyan-200/30 to-cyan-400/10",
    };
  }
  if (rank === 3) {
    return {
      label: "Gold",
      Icon: Trophy,
      ring: "ring-amber-400/40",
      border: "border-amber-400/50",
      chip: "bg-amber-400/15 text-amber-200 border-amber-400/40",
      bar: "from-amber-300/30 to-amber-500/10",
    };
  }
  if (rank === 2) {
    return {
      label: "Silver",
      Icon: Medal,
      ring: "ring-slate-300/30",
      border: "border-slate-300/40",
      chip: "bg-slate-200/10 text-slate-200 border-slate-300/30",
      bar: "from-slate-200/25 to-slate-400/10",
    };
  }
  return {
    label: "Bronze",
    Icon: Gem,
    ring: "ring-orange-500/30",
    border: "border-orange-500/40",
    chip: "bg-orange-500/10 text-orange-200 border-orange-500/40",
    bar: "from-orange-400/25 to-orange-600/10",
  };
}

function formatMasterValue(
  type: ContributionType,
  value: number,
): string {
  if (type === "percentage") return `${(value * 100).toFixed(4)}%`;
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDerivedRate(
  type: ContributionType,
  masterValue: number,
  splitShare: number,
): string {
  const derived = (masterValue * splitShare) / 100;
  if (type === "percentage") return `${(derived * 100).toFixed(4)}% of wager`;
  return `${derived.toFixed(4)} / spin`;
}

export function MultiJackpotWizard() {
  const { brandId } = React.useContext(BrandContext);
  const navigate = useNavigate();
  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = React.useState(false);

  // Step 1 — Master Strategy
  const [name, setName] = React.useState("");
  const [contributionSource, setContributionSource] =
    React.useState<ContributionSource>("player");
  const [contributionType, setContributionType] =
    React.useState<ContributionType>("percentage");
  const [masterValueInput, setMasterValueInput] = React.useState("1.00"); // % when percentage, currency when fixed
  const [assignment, setAssignment] = React.useState<GameAssignmentValue>({
    assignedCategories: [],
    assignedGameIds: [],
  });
  const [group, setGroup] = React.useState<GroupDTO | null>(null);


  // Step 2 — Tier Allocation
  const [draft, setDraft] = React.useState<ChildDraft | null>(null);
  const [savedChildren, setSavedChildren] = React.useState<
    Array<{
      jackpotId: number;
      tierRank: number;
      jackpotName: string;
      tierName: string;
      probability: number;
      splitShare: number;
      seedAmount: number;
    }>
  >([]);

  const sharesTotal = React.useMemo(
    () => savedChildren.reduce((acc, c) => acc + c.splitShare, 0),
    [savedChildren],
  );
  const sharesValid = Math.abs(sharesTotal - 100) <= 0.01;

  function nextRank() {
    return Math.max(0, ...savedChildren.map((c) => c.tierRank)) + 1;
  }

  function openDraft() {
    setDraft(newChildDraft(nextRank()));
  }

  function patchDraft(patch: Partial<ChildDraft>) {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  /** Convert the human-facing master input to the stored value.
   *  Percentage → fraction (1.00% input → 0.01 stored). Fixed → currency as-is. */
  function masterValueAsStored(): number {
    const raw = Number.parseFloat(masterValueInput) || 0;
    return contributionType === "percentage" ? raw / 100 : raw;
  }

  /* ───────────────── Step 1 ───────────────── */
  async function handleCreateGroup() {
    if (!name.trim()) return toast.error("MultiJackpot name is required");
    if (brandId == null) return toast.error("No brand selected");
    const masterValue = masterValueAsStored();
    if (!(masterValue > 0))
      return toast.error("Master contribution value must be greater than zero");
    setSubmitting(true);
    try {
      const res = await axios.post<GroupDTO>(
        "/api/v1/jackpot-groups",
        {
          name: name.trim(),
          overlappingRule: "split",
          contributionSource,
          contributionType,
          masterContributionValue: masterValue,
        },
        {
          headers: {
            brandId: String(brandId),
            "Content-Type": "application/json",
          },
        },
      );
      setGroup(res.data);
      setStep(2);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.error ??
          err?.message ??
          "Failed to create MultiJackpot",
      );
    } finally {
      setSubmitting(false);
    }
  }

  /* ───────────────── Step 2 ───────────────── */
  async function saveDraft() {
    if (!group || !draft) return;
    const tierName = draft.tierName.trim();
    if (!tierName) return toast.error("Tier Name is required");
    const tierRank = Math.max(0, Math.trunc(Number(draft.tierRank) || 0));
    const probability = denominatorToProbability(draft.triggerDenominator);
    const splitShare = Number.parseFloat(draft.splitShare) || 0;
    if (splitShare <= 0 || splitShare > 100) {
      return toast.error("Split share must be between 0 and 100");
    }
    const seedAmount = Number.parseFloat(draft.seedAmount) || 0;
    const triggerProbability = Number(probability.toFixed(8));

    // Prevent total > 100 before hitting the backend
    const projected = sharesTotal + splitShare;
    if (projected > 100.01) {
      return toast.error(
        `Adding ${splitShare.toFixed(2)}% would push the total to ${projected.toFixed(2)}%. Max is 100.00%.`,
      );
    }

    setSubmitting(true);
    try {
      // 1) Create the inline child jackpot (rate is derived server-side on attach)
      const createRes = await axios.post<JackpotDTO>(
        "/api/v1/jackpots",
        {
          name: tierName,
          enabled: true,
          seedAmount,
          poolBalance: seedAmount,
          triggerThreshold: seedAmount * 2,
        },
        {
          headers: {
            brandId: String(brandId),
            "Content-Type": "application/json",
          },
        },
      );
      const created = (createRes.data ?? {}) as Partial<JackpotDTO>;
      if (typeof created.id !== "number") {
        toast.error("Server did not return a jackpot id while creating the tier");
        return;
      }
      const newJackpotId = created.id;

      // 2) Attach it to the parent MultiJackpot group with its split share.
      const attachRes = await axios.post(
        `/api/v1/jackpot-groups/${group.id}/children`,
        {
          jackpotId: newJackpotId,
          tierRank,
          triggerProbability,
          splitShare,
          name: tierName,
        },
        {
          headers: {
            brandId: String(brandId),
            "Content-Type": "application/json",
          },
        },
      );
      const attached = (attachRes.data ?? {}) as Partial<JackpotDTO>;
      const jackpotName = attached.name ?? created.name ?? tierName;

      setSavedChildren((prev) => [
        ...prev,
        {
          jackpotId: newJackpotId,
          tierRank,
          jackpotName,
          tierName,
          probability,
          splitShare,
          seedAmount,
        },
      ]);
      setDraft(null);
      toast.success(`Created tier "${tierName}" at rank ${tierRank}`);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.error ?? err?.message ?? "Failed to create child tier",
      );
    } finally {
      setSubmitting(false);
    }
  }

  /* ───────────────── Step 3 ───────────────── */
  async function handleActivate() {
    if (!group) return;
    if (savedChildren.length === 0)
      return toast.error("Attach at least one child tier before activating");
    if (!sharesValid)
      return toast.error(
        `Split shares must total exactly 100.00% (currently ${sharesTotal.toFixed(2)}%)`,
      );
    setSubmitting(true);
    try {
      await axios.post(
        `/api/v1/jackpot-groups/${group.id}/status`,
        { status: "active" },
        {
          headers: {
            brandId: String(brandId),
            "Content-Type": "application/json",
          },
        },
      );
      toast.success(`MultiJackpot "${group.name}" is now active`);
      navigate({ to: "/admin/jackpot-groups" });
    } catch (err: any) {
      toast.error(
        err?.response?.data?.error ?? err?.message ?? "Failed to activate",
      );
    } finally {
      setSubmitting(false);
    }
  }

  /* ───────────────── render ───────────────── */
  return (
    <div className="space-y-8">
      <StepIndicator step={step} />

      {step === 1 && (
        <Card className="p-8 bg-neutral-900/60 border-neutral-800">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-blue-300 mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Step 1 · Master Strategy
          </div>
          <h2 className="text-2xl font-semibold text-white mb-1">
            Define group-level funding
          </h2>
          <p className="text-sm text-neutral-400 mb-8 max-w-2xl">
            All children inherit funding from this MultiJackpot. Set the source,
            type, and master value once — each tier will declare only its
            proportional split share in the next step.
          </p>

          <div className="grid gap-6 max-w-3xl">
            <div className="space-y-2">
              <Label htmlFor="mj-name" className="text-white">
                MultiJackpot name
              </Label>
              <Input
                id="mj-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Mega Drop Suite Q2"
                className="bg-neutral-800 border-neutral-700 text-white h-11"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-neutral-300">Contribution Source</Label>
                <select
                  value={contributionSource}
                  onChange={(e) =>
                    setContributionSource(e.target.value as ContributionSource)
                  }
                  className="w-full h-11 rounded-md bg-neutral-800 border border-neutral-700 px-3 text-sm text-white"
                >
                  <option value="player">Player (deducted from wager)</option>
                  <option value="operator">Operator (house-funded)</option>
                </select>
                <div className="text-xs text-neutral-500">
                  Who finances the pools.
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-neutral-300">Contribution Type</Label>
                <select
                  value={contributionType}
                  onChange={(e) =>
                    setContributionType(e.target.value as ContributionType)
                  }
                  className="w-full h-11 rounded-md bg-neutral-800 border border-neutral-700 px-3 text-sm text-white"
                >
                  <option value="percentage">Percentage of wager</option>
                  <option value="fixed">Fixed amount per spin</option>
                </select>
                <div className="text-xs text-neutral-500">
                  How the master value is interpreted.
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-neutral-300">
                  Master Contribution Value
                </Label>
                <div className="relative">
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={masterValueInput}
                    onChange={(e) => setMasterValueInput(e.target.value)}
                    placeholder={contributionType === "percentage" ? "1.00" : "10.00"}
                    className="bg-neutral-800 border-neutral-700 text-white h-11 font-mono pr-10"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
                    {contributionType === "percentage" ? "%" : "₵"}
                  </span>
                </div>
                <div className="text-xs text-neutral-500">
                  {contributionType === "percentage"
                    ? "Total share of every wager funnelled into the MultiJackpot."
                    : "Total amount drawn per spin and distributed across tiers."}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4 flex gap-3">
              <Coins className="w-5 h-5 text-blue-300 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-100">
                <div className="font-medium mb-0.5">Parent-governed split</div>
                Children inherit this master value. Their absolute contribution
                is derived from <span className="font-mono">master × share%</span>
                {" "}and saved to the transaction engine automatically.
              </div>
            </div>
          </div>

          <div className="mt-10 flex justify-end">
            <Button
              onClick={handleCreateGroup}
              disabled={submitting || !name.trim()}
              className="bg-blue-500 hover:bg-blue-600 h-11 px-6"
            >
              Continue to tier allocation{" "}
              <ChevronRight className="ml-1 w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {step === 2 && group && (
        <Step2ErrorBoundary onReset={() => setDraft(null)}>
          <Card className="p-8 bg-neutral-900/60 border-neutral-800">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-blue-300 mb-2">
              <Layers className="w-3.5 h-3.5" /> Step 2 · Tier Allocation
            </div>
            <h2 className="text-2xl font-semibold text-white mb-1">
              Allocate split shares
            </h2>
            <p className="text-sm text-neutral-400 mb-6 max-w-2xl">
              Each tier declares its share of the master contribution. Shares
              must total exactly 100.00% before activation.
            </p>

            <SharesBar
              total={sharesTotal}
              valid={sharesValid}
              hasChildren={savedChildren.length > 0}
            />

            <MasterRecap group={group} />

            <TierLadder
              savedChildren={savedChildren}
              group={group}
            />

            {draft ? (
              <DraftTierCard
                draft={draft}
                group={group}
                remaining={Math.max(0, 100 - sharesTotal)}
                onChange={patchDraft}
                onCancel={() => setDraft(null)}
                onSave={saveDraft}
                submitting={submitting}
              />
            ) : (
              <button
                type="button"
                onClick={openDraft}
                className="mt-4 w-full rounded-xl border-2 border-dashed border-neutral-700 hover:border-blue-500/60 hover:bg-blue-500/5 transition-colors py-6 flex items-center justify-center gap-2 text-neutral-300 hover:text-white"
              >
                <Plus className="w-5 h-5" /> Add New Tier
              </button>
            )}

            <div className="mt-10 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="border-neutral-700 text-neutral-200"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={savedChildren.length === 0 || !sharesValid}
                className="bg-blue-500 hover:bg-blue-600 h-11 px-6"
              >
                Continue to launch gate{" "}
                <ChevronRight className="ml-1 w-4 h-4" />
              </Button>
            </div>
          </Card>
        </Step2ErrorBoundary>
      )}

      {step === 3 && group && (
        <LaunchGate
          group={group}
          savedChildren={savedChildren}
          sharesTotal={sharesTotal}
          sharesValid={sharesValid}
          submitting={submitting}
          onBack={() => setStep(2)}
          onActivate={handleActivate}
        />
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/* Step indicator                                                     */
/* ────────────────────────────────────────────────────────────────── */
function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  const items: Array<{ n: 1 | 2 | 3; label: string; sub: string }> = [
    { n: 1, label: "Master Strategy", sub: "Funding rules" },
    { n: 2, label: "Tier Allocation", sub: "Split shares" },
    { n: 3, label: "The Launch Gate", sub: "Review & lock" },
  ];
  return (
    <ol className="flex items-stretch gap-2">
      {items.map((it, i) => {
        const active = it.n === step;
        const done = it.n < step;
        return (
          <React.Fragment key={it.n}>
            <li
              className={`flex-1 rounded-lg border px-4 py-3 flex items-center gap-3 ${
                active
                  ? "border-blue-500/60 bg-blue-500/10"
                  : done
                    ? "border-emerald-500/40 bg-emerald-500/5"
                    : "border-neutral-800 bg-neutral-900/40"
              }`}
            >
              <span
                className={`w-8 h-8 inline-flex items-center justify-center rounded-full text-xs font-semibold border ${
                  done
                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                    : active
                      ? "bg-blue-500/20 border-blue-500 text-blue-300"
                      : "bg-neutral-900 border-neutral-700 text-neutral-500"
                }`}
              >
                {done ? <Check className="w-4 h-4" /> : it.n}
              </span>
              <div className="min-w-0">
                <div
                  className={`text-sm font-medium ${
                    active
                      ? "text-white"
                      : done
                        ? "text-emerald-200"
                        : "text-neutral-400"
                  }`}
                >
                  {it.label}
                </div>
                <div className="text-xs text-neutral-500">{it.sub}</div>
              </div>
            </li>
            {i < items.length - 1 && (
              <span
                className="w-4 self-center h-px bg-neutral-700"
                aria-hidden
              />
            )}
          </React.Fragment>
        );
      })}
    </ol>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/* Shares bar + master recap                                          */
/* ────────────────────────────────────────────────────────────────── */
function SharesBar({
  total,
  valid,
  hasChildren,
}: {
  total: number;
  valid: boolean;
  hasChildren: boolean;
}) {
  const pct = Math.min(100, total);
  const tone = !hasChildren
    ? "neutral"
    : valid
      ? "emerald"
      : total > 100
        ? "red"
        : "amber";
  const colors: Record<string, { bar: string; text: string; border: string }> = {
    neutral: {
      bar: "bg-neutral-600",
      text: "text-neutral-300",
      border: "border-neutral-800",
    },
    emerald: {
      bar: "bg-emerald-500",
      text: "text-emerald-300",
      border: "border-emerald-500/40",
    },
    amber: {
      bar: "bg-amber-500",
      text: "text-amber-300",
      border: "border-amber-500/40",
    },
    red: { bar: "bg-red-500", text: "text-red-300", border: "border-red-500/40" },
  };
  const c = colors[tone];
  return (
    <div className={`rounded-lg border ${c.border} bg-neutral-950/50 p-4 mb-4`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs uppercase tracking-wider text-neutral-400">
          Allocated split shares
        </div>
        <div className={`font-mono text-sm font-semibold ${c.text}`}>
          {total.toFixed(2)}% / 100.00%
        </div>
      </div>
      <div className="h-2 rounded-full bg-neutral-800 overflow-hidden">
        <div
          className={`h-full ${c.bar} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {!valid && hasChildren && (
        <div className={`mt-2 flex items-center gap-1.5 text-xs ${c.text}`}>
          <AlertCircle className="w-3.5 h-3.5" />
          {total > 100
            ? "Total exceeds 100.00% — remove or reduce a tier."
            : `Need ${(100 - total).toFixed(2)}% more before activation.`}
        </div>
      )}
    </div>
  );
}

function MasterRecap({ group }: { group: GroupDTO }) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-4 mb-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
      <div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-0.5">
          Source
        </div>
        <div className="text-white capitalize">{group.contributionSource}</div>
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-0.5">
          Type
        </div>
        <div className="text-white capitalize">
          {group.contributionType === "percentage"
            ? "Percentage of wager"
            : "Fixed amount per spin"}
        </div>
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-0.5">
          Master value
        </div>
        <div className="text-white font-mono">
          {formatMasterValue(group.contributionType, group.masterContributionValue)}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/* Tier ladder (saved tiers, sorted highest → lowest)                 */
/* ────────────────────────────────────────────────────────────────── */
function TierLadder({
  savedChildren,
  group,
}: {
  savedChildren: Array<{
    jackpotId: number;
    tierRank: number;
    jackpotName: string;
    tierName: string;
    probability: number;
    splitShare: number;
    seedAmount: number;
  }>;
  group: GroupDTO;
}) {
  if (savedChildren.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-800 bg-neutral-950/40 p-10 text-center mb-4">
        <Layers className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
        <div className="text-neutral-300 font-medium">No tiers attached yet</div>
        <div className="text-sm text-neutral-500 mt-1">
          Each tier you add claims a slice of the 100.00% master share.
        </div>
      </div>
    );
  }
  const sorted = [...savedChildren].sort((a, b) => b.tierRank - a.tierRank);
  return (
    <div className="space-y-2 mb-4">
      {sorted.map((c, idx) => {
        const theme = rankTheme(c.tierRank);
        const { Icon } = theme;
        return (
          <div
            key={c.jackpotId}
            className={`relative rounded-xl border bg-neutral-900/60 p-4 flex items-center gap-4 ${theme.border}`}
          >
            <div
              className={`absolute inset-y-0 left-0 w-1 rounded-l-xl bg-gradient-to-b ${theme.bar}`}
              aria-hidden
            />
            <div
              className={`w-12 h-12 rounded-lg border flex items-center justify-center ${theme.chip}`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border ${theme.chip}`}
                >
                  {theme.label} · Rank {c.tierRank}
                </span>
                {idx === 0 && (
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border border-blue-400/40 bg-blue-400/10 text-blue-200">
                    Top tier
                  </span>
                )}
              </div>
              <div className="text-white font-medium mt-1 truncate">
                {c.tierName}
              </div>
              <div className="text-xs text-neutral-500 font-mono mt-0.5">
                #{c.jackpotId}
              </div>
            </div>
            <div className="hidden md:grid grid-cols-3 gap-6 text-right text-xs">
              <div>
                <div className="text-neutral-500 uppercase tracking-wider">
                  Odds
                </div>
                <div className="text-white font-mono">
                  1 in{" "}
                  {Math.round(
                    1 / Math.max(c.probability, 1e-12),
                  ).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-neutral-500 uppercase tracking-wider">
                  Share
                </div>
                <div className="text-white font-mono">
                  {c.splitShare.toFixed(2)}%
                </div>
              </div>
              <div>
                <div className="text-neutral-500 uppercase tracking-wider">
                  Derived
                </div>
                <div className="text-white font-mono">
                  {formatDerivedRate(
                    group.contributionType,
                    group.masterContributionValue,
                    c.splitShare,
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/* Inline draft tier card                                             */
/* ────────────────────────────────────────────────────────────────── */
function DraftTierCard({
  draft,
  group,
  remaining,
  onChange,
  onCancel,
  onSave,
  submitting,
}: {
  draft: ChildDraft;
  group: GroupDTO;
  remaining: number;
  onChange: (patch: Partial<ChildDraft>) => void;
  onCancel: () => void;
  onSave: () => void;
  submitting: boolean;
}) {
  const [dailyVolume, setDailyVolume] =
    React.useState<number>(DEFAULT_DAILY_VOLUME);
  const probability = denominatorToProbability(draft.triggerDenominator);
  const dropText = formatDropFrequency(probability, dailyVolume);
  const theme = rankTheme(Number(draft.tierRank) || 1);
  const splitShare = Number.parseFloat(draft.splitShare) || 0;
  const derivedText = formatDerivedRate(
    group.contributionType,
    group.masterContributionValue,
    splitShare,
  );
  const shareInvalid = splitShare <= 0 || splitShare > remaining + 0.01;

  return (
    <div
      className={`mt-4 rounded-xl border-2 ${theme.border} bg-neutral-900/80 p-6 space-y-6`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 text-[10px] uppercase tracking-wider rounded border ${theme.chip}`}
          >
            {theme.label} · New tier
          </span>
          <span className="text-sm text-neutral-400">
            Remaining allocation:{" "}
            <span className="text-white font-mono">{remaining.toFixed(2)}%</span>
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="text-neutral-400 hover:text-white"
        >
          Cancel
        </Button>
      </div>

      {/* Tier Name + quick chips */}
      <div className="space-y-2">
        <Label className="text-neutral-300">Tier Name</Label>
        <Input
          value={draft.tierName}
          onChange={(e) => onChange({ tierName: e.target.value })}
          placeholder="e.g. Friday Booster"
          className="bg-neutral-800 border-neutral-700 text-white h-10"
        />
        <div className="flex flex-wrap gap-2 pt-1">
          {TIER_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onChange({ tierName: preset })}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                draft.tierName === preset
                  ? "border-blue-500 bg-blue-500/15 text-blue-200"
                  : "border-neutral-700 bg-neutral-800 text-neutral-300 hover:border-neutral-500"
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-neutral-300">Tier rank</Label>
          <Input
            type="number"
            min={1}
            value={draft.tierRank}
            onChange={(e) => onChange({ tierRank: e.target.value })}
            className="bg-neutral-800 border-neutral-700 text-white h-10"
          />
          <div className="text-xs text-neutral-500">
            Higher numbers sit at the top of the ladder.
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-neutral-300">Seed Amount</Label>
          <Input
            type="text"
            inputMode="decimal"
            value={draft.seedAmount}
            onChange={(e) => onChange({ seedAmount: e.target.value })}
            placeholder="100.00"
            className="bg-neutral-800 border-neutral-700 text-white font-mono h-10"
          />
          <div className="text-xs text-neutral-500">
            Starting pool value after each reset.
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-neutral-300">Group Split Share (%)</Label>
          <div className="relative">
            <Input
              type="text"
              inputMode="decimal"
              value={draft.splitShare}
              onChange={(e) => onChange({ splitShare: e.target.value })}
              placeholder="25.00"
              className={`bg-neutral-800 border-neutral-700 text-white font-mono h-10 pr-8 ${shareInvalid && draft.splitShare !== "" ? "border-red-500/60" : ""}`}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
              %
            </span>
          </div>
          <div className="text-xs text-neutral-500">
            Derived rate: <span className="text-neutral-300 font-mono">{derivedText}</span>
          </div>
        </div>
      </div>

      {/* Probability + ephemeral volume + forecast */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-950/50 p-5 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-neutral-400 text-xs uppercase tracking-wider">
              Trigger probability
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-neutral-300 text-sm">1 in</span>
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                value={draft.triggerDenominator}
                onChange={(e) =>
                  onChange({ triggerDenominator: e.target.value })
                }
                placeholder="50000"
                className="bg-neutral-800 border-neutral-700 text-white font-mono h-10"
              />
              <span className="text-neutral-300 text-sm">spins</span>
            </div>
            <div className="text-xs text-neutral-500 font-mono pt-1">
              Raw p = {probabilityFixed8(probability)}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-neutral-400 text-xs uppercase tracking-wider">
                Simulated daily volume
              </Label>
              <span className="font-mono text-xs text-white">
                {dailyVolume.toLocaleString()} spins/day
              </span>
            </div>
            <Slider
              value={[dailyVolume]}
              min={1000}
              max={500000}
              step={1000}
              onValueChange={(v) =>
                setDailyVolume(v[0] ?? DEFAULT_DAILY_VOLUME)
              }
            />
            <div className="text-[11px] text-neutral-500">
              Preview only — never saved.
            </div>
          </div>
        </div>

        <div className="rounded-md border border-blue-500/30 bg-blue-500/5 p-4">
          <div className="text-[10px] uppercase tracking-[0.2em] text-blue-300 mb-1">
            Tier Forecast
          </div>
          <div className="text-sm text-white">{dropText}</div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="text-red-400 hover:text-red-300"
        >
          <Trash2 className="w-4 h-4 mr-1" /> Discard
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={onSave}
          disabled={
            submitting || !draft.tierName.trim() || shareInvalid
          }
          className="bg-blue-500 hover:bg-blue-600"
        >
          Save tier
        </Button>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/* Step 3 — Launch Gate                                               */
/* ────────────────────────────────────────────────────────────────── */
function LaunchGate({
  group,
  savedChildren,
  sharesTotal,
  sharesValid,
  submitting,
  onBack,
  onActivate,
}: {
  group: GroupDTO;
  savedChildren: Array<{
    jackpotId: number;
    tierRank: number;
    jackpotName: string;
    tierName: string;
    probability: number;
    splitShare: number;
    seedAmount: number;
  }>;
  sharesTotal: number;
  sharesValid: boolean;
  submitting: boolean;
  onBack: () => void;
  onActivate: () => void;
}) {
  const sorted = [...savedChildren].sort((a, b) => b.tierRank - a.tierRank);
  const totalSeedExposure = savedChildren.reduce(
    (sum, c) => sum + c.seedAmount,
    0,
  );
  const REFERENCE_DAILY = 50000;

  return (
    <Card className="p-8 bg-neutral-900/60 border-neutral-800">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-blue-300 mb-2">
        <ShieldAlert className="w-3.5 h-3.5" /> Step 3 · The Launch Gate
      </div>
      <h2 className="text-2xl font-semibold text-white mb-1">
        Executive verification
      </h2>
      <p className="text-sm text-neutral-400 mb-8 max-w-2xl">
        Review the master funding rules and tier allocation. Activation commits
        this MultiJackpot to production and freezes all configuration.
      </p>

      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <SummaryStat label="MultiJackpot" value={group.name} />
        <SummaryStat
          label="Source"
          value={group.contributionSource === "player" ? "Player" : "Operator"}
        />
        <SummaryStat
          label="Type"
          value={
            group.contributionType === "percentage" ? "Percentage" : "Fixed"
          }
        />
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <SummaryStat
          label="Master value"
          value={formatMasterValue(
            group.contributionType,
            group.masterContributionValue,
          )}
          accent="emerald"
        />
        <SummaryStat
          label="Allocated shares"
          value={`${sharesTotal.toFixed(2)}% / 100.00%`}
          accent={sharesValid ? "emerald" : "red"}
        />
        <SummaryStat
          label="Combined seed exposure"
          value={totalSeedExposure.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        />
      </div>

      <div className="rounded-xl border border-neutral-800 overflow-hidden mb-6">
        <div className="bg-neutral-900/80 px-5 py-3 text-xs uppercase tracking-[0.2em] text-neutral-400 border-b border-neutral-800">
          Par-sheet · Tier hierarchy
        </div>
        <div className="divide-y divide-neutral-800">
          {sorted.map((c) => {
            const theme = rankTheme(c.tierRank);
            const { Icon } = theme;
            return (
              <div
                key={c.jackpotId}
                className="grid grid-cols-12 gap-3 items-center px-5 py-3"
              >
                <div className="col-span-4 flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-md border flex items-center justify-center ${theme.chip}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-white text-sm font-medium truncate">
                      {c.tierName}
                    </div>
                    <div className="text-[11px] text-neutral-500 font-mono">
                      {theme.label} · rank {c.tierRank} · #{c.jackpotId}
                    </div>
                  </div>
                </div>
                <div className="col-span-2 text-xs">
                  <div className="text-neutral-500 uppercase tracking-wider">
                    Share
                  </div>
                  <div className="text-white font-mono">
                    {c.splitShare.toFixed(2)}%
                  </div>
                </div>
                <div className="col-span-3 text-xs">
                  <div className="text-neutral-500 uppercase tracking-wider">
                    Derived
                  </div>
                  <div className="text-white font-mono">
                    {formatDerivedRate(
                      group.contributionType,
                      group.masterContributionValue,
                      c.splitShare,
                    )}
                  </div>
                </div>
                <div className="col-span-3 text-xs">
                  <div className="text-neutral-500 uppercase tracking-wider">
                    Expected drop
                  </div>
                  <div className="text-white">
                    {formatDropFrequency(c.probability, REFERENCE_DAILY)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-5 mb-8 flex gap-3">
        <Lock className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-100">
          <div className="font-semibold mb-1">Activation locks configuration</div>
          Once activated, master funding rules, tier names, seed amounts, split
          shares, and probabilities all become read-only across the platform.
          Move the MultiJackpot to Disabled to edit again.
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={onBack}
          className="border-neutral-700 text-neutral-200"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <Button
          onClick={onActivate}
          disabled={submitting || savedChildren.length === 0 || !sharesValid}
          className="bg-emerald-500 hover:bg-emerald-600 h-11 px-6"
        >
          <Lock className="w-4 h-4 mr-2" />
          Activate MultiJackpot
        </Button>
      </div>
    </Card>
  );
}

function SummaryStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "emerald" | "red";
}) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
      <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-1">
        {label}
      </div>
      <div
        className={`font-semibold ${
          accent === "emerald"
            ? "text-emerald-300"
            : accent === "red"
              ? "text-red-300"
              : "text-white"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/* Local error boundary (Step 2)                                      */
/* ────────────────────────────────────────────────────────────────── */
class Step2ErrorBoundary extends React.Component<
  { children: React.ReactNode; onReset: () => void },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error) {
    // eslint-disable-next-line no-console
    console.error("[MultiJackpotWizard] Step 2 crashed:", error);
  }
  render() {
    if (this.state.error) {
      return (
        <Card className="p-6 bg-neutral-900/50 border-red-500/40">
          <h2 className="text-lg font-semibold text-white mb-2">
            Step 2 hit a rendering error
          </h2>
          <p className="text-sm text-neutral-400 mb-4">
            {this.state.error.message ||
              "An unexpected error occurred while rendering the tier editor."}
          </p>
          <Button
            type="button"
            onClick={() => {
              this.props.onReset();
              this.setState({ error: null });
            }}
            className="bg-blue-500 hover:bg-blue-600"
          >
            Reset step
          </Button>
        </Card>
      );
    }
    return this.props.children;
  }
}
