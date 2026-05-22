import * as React from "react";
import axios from "axios";
import { toast } from "sonner";
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
  Dice5,
  TrendingUp,
  Clock,
  Zap,
  Flame,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { BrandContext } from "@/backoffice/app";
import type { JackpotDTO } from "@/lib/jackpot/types";
import { GameAssignmentStep, type GameAssignmentValue } from "@/components/jackpot/GameAssignmentStep";
import { parseFrequencyJSON, pickFrequencyInterval, pickTime } from "@/lib/jackpot/hydrate-draft";

type ContributionSource = "player" | "operator";
type ContributionType = "percentage" | "fixed";
type TriggerModel = "pure_chance" | "hype_curve" | "happy_hour";
type FreqInterval = "DAILY" | "WEEKLY" | "MONTHLY";

type TierType = "classic" | "must_drop" | "happy_hour";

// ── UI-only blocks ported from Single Jackpot form ──────────────────
export interface EligibilityValue {
  vertical: "casino" | "sportsbook";
  casino: { categories: string[]; providers: string[]; gameIds: string[] };
  sportsbook: { betType: "live" | "prematch" | "all"; sportType: string; leagues: string[]; matchIdsRaw: string };
}

export interface PlayerTargetingValue {
  audienceMode: "all" | "custom";
  vipTiers: string[];
  crmSegmentsInclude: string[];
  crmSegmentsExclude: string[];
  restrictedCountries: string[];
  blacklistedIdsRaw: string;
}

export interface CommunityValue {
  enabled: boolean;
  split: number; // 0..100
  payoutInterval: "logged_in" | "contributed_once" | "contributed_within_time";
  payoutIntervalSeconds: number;
  maxWinAmount: number;
  maxPlayers: number;
}

interface GroupDTO {
  id: number;
  name: string;
  status: "draft" | "active" | "disabled";
  overlappingRule: string;
  contributionSource: ContributionSource;
  contributionType: ContributionType;
  masterContributionValue: number;
  // UI-only mirror of the Single-Jackpot Contribution card.
  // Persisted via masterContributionValue; these extras live in wizard memory.
  minWagerAmount: number;
  maxWagerAmount: number;
  assignedCategories?: string[];
  assignedGameIds?: number[];
  // UI-only master config — not yet persisted on jackpot_groups columns.
  eligibility?: EligibilityValue;
  playerTargeting?: PlayerTargetingValue;
  community?: CommunityValue;
}

interface ChildDraft {
  uid: string;
  tierName: string;
  tierRank: string;
  tierType: TierType;
  // Allocation & Fuel
  initialPoolAmount: string;   // Starting pool value
  seedAmount: string;          // Initial Seed Amount (operator floor)
  reseedingAmount: string;
  splitShare: string;
  // Per-tier contribution weight grid (Pool / Seed / House — sum = 100)
  poolWeight: number;
  seedWeight: number;
  houseWeight: number;
  // Classic — 1 in N spins
  spinsInterval: string;
  // Must Drop (Hype Curve) — boundaries
  minBoundary: string;
  maxBoundary: string;
  dropPacing: "fast" | "balanced" | "slow";
  // Happy Hour — calendar window
  freqInterval: FreqInterval;
  freqDay: string;
  contribStartTime: string;
  contribEndTime: string;
  winStartTime: string;
  winEndTime: string;
  cloneContribToWin: boolean;
  // Per-tier extras
  volatility: number;
  maxWinAmount: string;
  fixedWinAmount: string;
  // Tier Safeguards
  maxNumberOfWins: string;
  maxTotalPayout: string;
  maxPoolAmount: string;
}

interface SavedChild {
  jackpotId: number;
  tierRank: number;
  jackpotName: string;
  tierName: string;
  tierType: TierType;
  splitShare: number;
  seedAmount: number;
  reseedingAmount: number;
  poolWeight: number;
  seedWeight: number;
  houseWeight: number;
  triggerSummary: string;
  probability: number;
  volatility: number;
  maxWinAmount?: number;
  fixedWinAmount?: number;
  maxNumberOfWins?: number;
  maxTotalPayout?: number;
}

const TIER_PRESETS = ["Mini", "Minor", "Major", "Grand"] as const;

function newChildDraft(rank: number): ChildDraft {
  return {
    uid: crypto.randomUUID(),
    tierName: "",
    tierRank: String(rank),
    tierType: "classic",
    initialPoolAmount: "100.00",
    seedAmount: "100.00",
    reseedingAmount: "100.00",
    splitShare: "0.00",
    poolWeight: 60,
    seedWeight: 30,
    houseWeight: 10,
    spinsInterval: "50000",
    minBoundary: "500.00",
    maxBoundary: "5000.00",
    dropPacing: "balanced",
    freqInterval: "DAILY",
    freqDay: "",
    contribStartTime: "18:00",
    contribEndTime: "22:00",
    winStartTime: "18:00",
    winEndTime: "22:00",
    cloneContribToWin: true,
    volatility: 5,
    maxWinAmount: "",
    fixedWinAmount: "",
    maxNumberOfWins: "",
    maxTotalPayout: "",
    maxPoolAmount: "",
  };
}

// Default UI-only blocks for the master.
function defaultEligibility(): EligibilityValue {
  return {
    vertical: "casino",
    casino: { categories: [], providers: [], gameIds: [] },
    sportsbook: { betType: "all", sportType: "", leagues: [], matchIdsRaw: "" },
  };
}
function defaultPlayerTargeting(): PlayerTargetingValue {
  return {
    audienceMode: "all",
    vipTiers: [],
    crmSegmentsInclude: [],
    crmSegmentsExclude: [],
    restrictedCountries: [],
    blacklistedIdsRaw: "",
  };
}
function defaultCommunity(): CommunityValue {
  return {
    enabled: false,
    split: 50,
    payoutInterval: "logged_in",
    payoutIntervalSeconds: 0,
    maxWinAmount: 0,
    maxPlayers: 0,
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

function formatMasterValue(type: ContributionType, value: number): string {
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

/* ────────────────────────────────────────────────────────────────── */
/* Logarithmic interval slider helpers (Pure Chance)                  */
/* Mirrors the single-jackpot form: 1k–10M spins, log10 mapping.      */
/* ────────────────────────────────────────────────────────────────── */
const MIN_SPINS = 1000;
const MAX_SPINS = 10_000_000;
const LOG_MIN = Math.log10(MIN_SPINS);
const LOG_MAX = Math.log10(MAX_SPINS);

function sliderToSpins(pct: number): number {
  const t = Math.min(1, Math.max(0, pct / 100));
  const v = Math.pow(10, LOG_MIN + (LOG_MAX - LOG_MIN) * t);
  return Math.round(v / 100) * 100;
}
function spinsToSlider(n: number): number {
  const clamped = Math.min(MAX_SPINS, Math.max(MIN_SPINS, n || MIN_SPINS));
  const t = (Math.log10(clamped) - LOG_MIN) / (LOG_MAX - LOG_MIN);
  return Math.round(t * 1000) / 10;
}

function pickPureChanceVibe(spins: number) {
  if (spins < 10_000)
    return {
      Icon: Zap,
      label: "⚡ Rapid-Fire Mode",
      chip: "bg-yellow-400/15 text-yellow-200 border-yellow-400/40",
      copy: "Constant action — drops roughly every spin-cluster network-wide.",
    };
  if (spins < 100_000)
    return {
      Icon: Flame,
      label: "🔥 Action-Packed",
      chip: "bg-orange-400/15 text-orange-200 border-orange-400/40",
      copy: "Frequent wins with healthy energy across the floor.",
    };
  if (spins < 500_000)
    return {
      Icon: TrendingUp,
      label: "📈 Daily Driver",
      chip: "bg-blue-400/15 text-blue-200 border-blue-400/40",
      copy: "Reliable daily pacing for steady, consistent engagement.",
    };
  if (spins < 2_500_000)
    return {
      Icon: Trophy,
      label: "🏆 Major Milestone",
      chip: "bg-amber-400/15 text-amber-200 border-amber-400/40",
      copy: "Buzz-worthy, high-value tracking event. Expect headline drops.",
    };
  return {
    Icon: Gem,
    label: "💎 The Mega Event",
    chip: "bg-fuchsia-400/15 text-fuchsia-200 border-fuchsia-400/40",
    copy: "Ultra-rare, legendary network event — your headline campaign.",
  };
}

/* ────────────────────────────────────────────────────────────────── */
/* Trigger condition assembly + summary                               */
/* ────────────────────────────────────────────────────────────────── */
function buildTriggerCondition(d: ChildDraft): Record<string, unknown> {
  if (d.tierType === "classic") {
    const n = Math.max(1, Math.trunc(Number(d.spinsInterval) || 1));
    return {
      triggerModel: "pure_chance",
      tierType: "classic",
      spinsInterval: n,
      triggerOdds: n,
    };
  }
  if (d.tierType === "must_drop") {
    return {
      triggerModel: "hype_curve",
      tierType: "must_drop",
      mustDrop: {
        minBoundary: Number(d.minBoundary) || 0,
        maxBoundary: Number(d.maxBoundary) || 0,
        dropPacing: d.dropPacing,
      },
    };
  }
  // happy_hour — persist both contrib + win windows as JSON strings to mirror
  // the single-jackpot Frequency payload shape the engine already understands.
  const cs = d.contribStartTime;
  const ce = d.contribEndTime;
  const ws = d.cloneContribToWin ? cs : d.winStartTime;
  const we = d.cloneContribToWin ? ce : d.winEndTime;
  const window = (s: string, e: string) =>
    JSON.stringify({
      frequency: d.freqInterval,
      day: d.freqDay || undefined,
      startTime: s,
      endTime: e,
    });
  return {
    triggerModel: "happy_hour",
    tierType: "happy_hour",
    contributionFrequency: window(cs, ce),
    winFrequency: window(ws, we),
    freqInterval: d.freqInterval,
    freqDay: d.freqDay,
    contribStartTime: cs,
    contribEndTime: ce,
    winStartTime: ws,
    winEndTime: we,
    cloneContribToWin: d.cloneContribToWin,
  };
}

function triggerSummary(d: ChildDraft): string {
  if (d.tierType === "classic") {
    const n = Math.max(1, Math.trunc(Number(d.spinsInterval) || 1));
    return `Classic · 1 in ${n.toLocaleString()} spins`;
  }
  if (d.tierType === "must_drop") {
    return `Must Drop · ${Number(d.minBoundary || 0).toLocaleString()} – ${Number(
      d.maxBoundary || 0,
    ).toLocaleString()} (${d.dropPacing})`;
  }
  const dayLabel = d.freqInterval === "DAILY" ? "" : d.freqDay ? ` · day ${d.freqDay}` : "";
  return `Happy Hour · ${d.freqInterval}${dayLabel} · ${d.contribStartTime}–${d.contribEndTime}`;
}

function probabilityFromDraft(d: ChildDraft): number {
  if (d.tierType === "classic") {
    const n = Math.max(1, Math.trunc(Number(d.spinsInterval) || 1));
    return 1 / n;
  }
  return 0; // must_drop / happy_hour are time-gated, not fixed-odds
}

// Shared 3-way weight allocator — used in the Tier Card. Updates the edited
// weight and caps so the trio never exceeds 100.
function clampedSingleWeight(
  current: { pool: number; seed: number; house: number },
  changed: "pool" | "seed" | "house",
  nextRaw: number,
): { pool: number; seed: number; house: number } {
  const others = (["pool", "seed", "house"] as const).filter((k) => k !== changed);
  const otherSum = current[others[0]] + current[others[1]];
  const max = Math.max(0, 100 - otherSum);
  const next = Math.max(0, Math.min(max, Number(nextRaw) || 0));
  return { ...current, [changed]: next };
}

/* ────────────────────────────────────────────────────────────────── */
export function MultiJackpotWizard() {
  const { brandId } = React.useContext(BrandContext);
  const navigate = useNavigate();
  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = React.useState(false);

  // Step 1 — Master Strategy
  const [name, setName] = React.useState("");
  // Contribution card (mirrors the Single Jackpot "Jackpot Contribution" block)
  const [contributionSource, setContributionSource] =
    React.useState<ContributionSource>("player");
  const [contributionType, setContributionType] =
    React.useState<ContributionType>("fixed");
  const [totalContributionAmount, setTotalContributionAmount] =
    React.useState<number>(0.1);
  const [minWagerAmount, setMinWagerAmount] = React.useState<number>(0);
  const [maxWagerAmount, setMaxWagerAmount] = React.useState<number>(0);
  const [assignment, setAssignment] = React.useState<GameAssignmentValue>({
    assignedCategories: [],
    assignedGameIds: [],
  });
  // UI-only master config (Eligibility / Targeting / Community).
  const [eligibility, setEligibility] = React.useState<EligibilityValue>(defaultEligibility);
  const [playerTargeting, setPlayerTargeting] = React.useState<PlayerTargetingValue>(defaultPlayerTargeting);
  const [community, setCommunity] = React.useState<CommunityValue>(defaultCommunity);
  const [group, setGroup] = React.useState<GroupDTO | null>(null);

  // Step 2 — Tier Allocation
  const [draft, setDraft] = React.useState<ChildDraft | null>(null);
  const [savedChildren, setSavedChildren] = React.useState<SavedChild[]>([]);

  const sharesTotal = React.useMemo(
    () => savedChildren.reduce((acc, c) => acc + c.splitShare, 0),
    [savedChildren],
  );
  // Compare as integer hundredths to avoid float drift.
  const sharesValid =
    savedChildren.length > 0 && Math.round(sharesTotal * 100) === 10000;

  function nextRank() {
    return Math.max(0, ...savedChildren.map((c) => c.tierRank)) + 1;
  }

  function openDraft() {
    setDraft(newChildDraft(nextRank()));
  }
  function patchDraft(patch: Partial<ChildDraft>) {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  // "Master value" persisted to the API mirrors the Single form's logic:
  // store fraction for percent (1% → 0.01), absolute amount for fixed.
  function masterValueAsStored(): number {
    const raw = Number(totalContributionAmount) || 0;
    return contributionType === "percentage" ? raw / 100 : raw;
  }

  /* ───────────────── Step 1 ───────────────── */
  async function handleCreateGroup() {
    if (!name.trim()) return toast.error("MultiJackpot name is required");
    if (brandId == null) return toast.error("No brand selected");
    const masterValue = masterValueAsStored();
    if (!(masterValue > 0))
      return toast.error("Contribution amount must be greater than zero");
    setSubmitting(true);
    try {
      const res = await axios.post<GroupDTO>(
        "/api/v1/jackpot-groups",
        {
          name: name.trim(),
          overlappingRule: "split",
          // Master-level Player vs Operator funding source.
          contributionSource,
          contributionType,
          masterContributionValue: masterValue,
          assignedCategories: assignment.assignedCategories,
          assignedGameIds: assignment.assignedGameIds,
        },
        {
          headers: {
            brandId: String(brandId),
            "Content-Type": "application/json",
          },
        },
      );
      setGroup({
        ...res.data,
        minWagerAmount,
        maxWagerAmount,
        assignedCategories: assignment.assignedCategories,
        assignedGameIds: assignment.assignedGameIds,
        eligibility,
        playerTargeting,
        community,
      });
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
    if (savedChildren.some((c) => c.tierRank === tierRank)) {
      return toast.error(`Tier rank ${tierRank} is already in use`);
    }
    const splitShare = Number.parseFloat(draft.splitShare) || 0;
    if (splitShare <= 0 || splitShare > 100) {
      return toast.error("Split share must be between 0 and 100");
    }
    const weightSum = draft.poolWeight + draft.seedWeight + draft.houseWeight;
    if (Math.abs(weightSum - 100) > 0.05) {
      return toast.error(
        `Contribution Weight must sum to 100% (currently ${weightSum.toFixed(2)}%)`,
      );
    }
    const initialPoolAmount = Number.parseFloat(draft.initialPoolAmount) || 0;
    const seedAmount = Number.parseFloat(draft.seedAmount) || 0;
    const reseedingAmount = Number.parseFloat(draft.reseedingAmount) || 0;
    const probability = probabilityFromDraft(draft);
    const triggerProbability = Number(probability.toFixed(8));

    const projected = sharesTotal + splitShare;
    if (Math.round(projected * 100) > 10000) {
      return toast.error(
        `Adding ${splitShare.toFixed(2)}% would push the total to ${projected.toFixed(2)}%. Max is 100.00%.`,
      );
    }

    const maxWins = draft.maxNumberOfWins.trim()
      ? Math.max(0, Math.trunc(Number(draft.maxNumberOfWins)))
      : undefined;
    const maxPayout = draft.maxTotalPayout.trim()
      ? Math.max(0, Number(draft.maxTotalPayout))
      : undefined;
    const maxPool = draft.maxPoolAmount.trim()
      ? Math.max(0, Number(draft.maxPoolAmount))
      : undefined;
    const maxWin = draft.maxWinAmount.trim()
      ? Math.max(0, Number(draft.maxWinAmount))
      : undefined;
    const fixedWin = draft.fixedWinAmount.trim()
      ? Math.max(0, Number(draft.fixedWinAmount))
      : undefined;

    setSubmitting(true);
    try {
      // 1) Create child jackpot. Trigger config + safeguards + reseed + tier
      //    extras travel via `config` → server merges into `trigger_condition`.
      const createRes = await axios.post<JackpotDTO>(
        "/api/v1/jackpots",
        {
          name: tierName,
          enabled: true,
          seedAmount,
          poolBalance: seedAmount,
          triggerThreshold: seedAmount * 2,
          assignedCategories: [],
          assignedGameIds: [],
          config: {
            ...buildTriggerCondition(draft),
            tierType: draft.tierType,
            reseedingAmount,
            // Per-tier contribution weights (Pool / Seed / House).
            contributionMode: "split",
            poolWeight: draft.poolWeight,
            seedWeight: draft.seedWeight,
            houseWeight: draft.houseWeight,
            // Per-tier extras
            volatility: draft.volatility,
            ...(maxWin !== undefined ? { maxWinAmount: maxWin } : {}),
            ...(fixedWin !== undefined ? { fixedWinAmount: fixedWin } : {}),
            ...(maxWins !== undefined ? { maxNumberOfWins: maxWins } : {}),
            ...(maxPayout !== undefined ? { maxTotalPayout: maxPayout } : {}),
          },
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

      // 2) Attach to the parent group with split share.
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
          tierType: draft.tierType,
          splitShare,
          seedAmount,
          reseedingAmount,
          poolWeight: draft.poolWeight,
          seedWeight: draft.seedWeight,
          houseWeight: draft.houseWeight,
          triggerSummary: triggerSummary(draft),
          probability,
          volatility: draft.volatility,
          maxWinAmount: maxWin,
          fixedWinAmount: fixedWin,
          maxNumberOfWins: maxWins,
          maxTotalPayout: maxPayout,
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
            All children inherit funding from this MultiJackpot. Configure the
            Jackpot Contribution once — each tier will declare only its
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

            <JackpotContributionCard
              contributionSource={contributionSource}
              setContributionSource={setContributionSource}
              contributionType={contributionType}
              setContributionType={setContributionType}
              totalContributionAmount={totalContributionAmount}
              setTotalContributionAmount={setTotalContributionAmount}
              minWagerAmount={minWagerAmount}
              maxWagerAmount={maxWagerAmount}
              setMinWagerAmount={setMinWagerAmount}
              setMaxWagerAmount={setMaxWagerAmount}
            />


            <div className="pt-2 border-t border-neutral-800">
              <GameAssignmentStep
                value={assignment}
                onChange={setAssignment}
                disabled={submitting}
              />
            </div>

            <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4 flex gap-3">
              <Coins className="w-5 h-5 text-blue-300 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-100">
                <div className="font-medium mb-0.5">Parent-governed split</div>
                Children inherit this master value and game assignment. Their
                absolute contribution is derived from{" "}
                <span className="font-mono">master × share%</span> and saved to
                the transaction engine automatically.
              </div>
            </div>
          </div>

          <div className="mt-10 flex justify-end">
            <Button
              onClick={handleCreateGroup}
              disabled={submitting || !name.trim()}
              className="bg-blue-500 hover:bg-blue-600 h-11 px-6"
            >
              Continue to tier allocation <ChevronRight className="ml-1 w-4 h-4" />
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

            <TierLadder savedChildren={savedChildren} group={group} />

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
                Continue to launch gate <ChevronRight className="ml-1 w-4 h-4" />
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
              <span className="w-4 self-center h-px bg-neutral-700" aria-hidden />
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
    <div
      className={`sticky top-2 z-10 rounded-lg border ${c.border} bg-neutral-950/80 backdrop-blur p-4 mb-4`}
    >
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
  const gameCount = group.assignedGameIds?.length ?? 0;
  const catCount = group.assignedCategories?.length ?? 0;
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-4 mb-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
      <div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-0.5">
          Type
        </div>
        <div className="text-white capitalize">
          {group.contributionType === "percentage" ? "Percentage" : "Fixed"}
        </div>
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-0.5">
          Amount
        </div>
        <div className="text-white font-mono">
          {formatMasterValue(group.contributionType, group.masterContributionValue)}
        </div>
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-0.5">
          Wager Limits
        </div>
        <div className="text-white font-mono">
          {group.minWagerAmount || 0} – {group.maxWagerAmount || "∞"}
        </div>
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-0.5">
          Game scope
        </div>
        <div className="text-white">
          {catCount} cats · {gameCount} games
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
  savedChildren: SavedChild[];
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
              <div className="text-white font-medium mt-1 truncate">{c.tierName}</div>
              <div className="text-xs text-neutral-500 mt-0.5 truncate">
                {c.triggerSummary}
              </div>
            </div>
            <div className="hidden md:grid grid-cols-3 gap-6 text-right text-xs">
              <div>
                <div className="text-neutral-500 uppercase tracking-wider">Seed</div>
                <div className="text-white font-mono">
                  {c.seedAmount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>
              <div>
                <div className="text-neutral-500 uppercase tracking-wider">Share</div>
                <div className="text-white font-mono">{c.splitShare.toFixed(2)}%</div>
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

      {/* ── Group A — Identity ─────────────────────────────────────── */}
      <section className="space-y-3">
        <SectionHeading>Tier identity</SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-2">
            <Label className="text-neutral-300">Tier name</Label>
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
        </div>
      </section>

      {/* ── Group B — Allocation & Fuel ────────────────────────────── */}
      <section className="space-y-3">
        <SectionHeading>Allocation & fuel</SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-neutral-300">Initial pool amount</Label>
            <Input
              type="text"
              inputMode="decimal"
              value={draft.initialPoolAmount}
              onChange={(e) => onChange({ initialPoolAmount: e.target.value })}
              placeholder="100.00"
              className="bg-neutral-800 border-neutral-700 text-white font-mono h-10"
            />
            <div className="text-xs text-neutral-500">Starting pool value at launch.</div>
          </div>
          <div className="space-y-2">
            <Label className="text-neutral-300">Initial seed amount</Label>
            <Input
              type="text"
              inputMode="decimal"
              value={draft.seedAmount}
              onChange={(e) => onChange({ seedAmount: e.target.value })}
              placeholder="100.00"
              className="bg-neutral-800 border-neutral-700 text-white font-mono h-10"
            />
            <div className="text-xs text-neutral-500">Operator-funded floor the pool can never fall below.</div>
          </div>
          <div className="space-y-2">
            <Label className="text-neutral-300">Re-seeding amount</Label>
            <Input
              type="text"
              inputMode="decimal"
              value={draft.reseedingAmount}
              onChange={(e) => onChange({ reseedingAmount: e.target.value })}
              placeholder="100.00"
              className="bg-neutral-800 border-neutral-700 text-white font-mono h-10"
            />
            <div className="text-xs text-neutral-500">Applied after each reset.</div>
          </div>
          <div className="space-y-2">
            <Label className="text-neutral-300">Tier split share (%)</Label>
            <div className="relative">
              <Input
                type="text"
                inputMode="decimal"
                value={draft.splitShare}
                onChange={(e) => onChange({ splitShare: e.target.value })}
                placeholder="25.00"
                className={`bg-neutral-800 border-neutral-700 text-white font-mono h-10 pr-8 ${
                  shareInvalid && draft.splitShare !== "" ? "border-red-500/60" : ""
                }`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
                %
              </span>
            </div>
            <div className="text-xs text-neutral-500">
              Derived rate:{" "}
              <span className="text-neutral-300 font-mono">{derivedText}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Group C — Drop Style ───────────────────────────────────── */}
      <section className="space-y-3">
        <SectionHeading>Drop style</SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <ModeCard
            active={draft.tierType === "classic"}
            onClick={() => onChange({ tierType: "classic" })}
            Icon={Dice5}
            title="Classic"
            blurb="Static 1-in-N odds for uniform, predictable drops."
          />
          <ModeCard
            active={draft.tierType === "must_drop"}
            onClick={() => onChange({ tierType: "must_drop" })}
            Icon={TrendingUp}
            title="Must Drop"
            blurb="Dynamic must-drop between win boundaries."
          />
          <ModeCard
            active={draft.tierType === "happy_hour"}
            onClick={() => onChange({ tierType: "happy_hour" })}
            Icon={Clock}
            title="Happy Hour"
            blurb="Calendar-gated contribution + win windows."
          />
        </div>

        {draft.tierType === "classic" && (
          <PureChancePanel draft={draft} onChange={onChange} />
        )}
        {draft.tierType === "must_drop" && (
          <HypeCurvePanel draft={draft} onChange={onChange} />
        )}
        {draft.tierType === "happy_hour" && (
          <HappyHourPanel draft={draft} onChange={onChange} />
        )}
      </section>

      {/* ── Group D — Tier Safeguards ──────────────────────────────── */}
      <section className="space-y-3">
        <SectionHeading>Tier safeguards (optional)</SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-neutral-300">Max number of wins</Label>
            <Input
              type="number"
              min={0}
              value={draft.maxNumberOfWins}
              onChange={(e) => onChange({ maxNumberOfWins: e.target.value })}
              placeholder="Unlimited"
              className="bg-neutral-800 border-neutral-700 text-white font-mono h-10"
            />
            <div className="text-xs text-neutral-500">
              Engine halts the tier after this many drops.
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-neutral-300">Max total payout</Label>
            <Input
              type="text"
              inputMode="decimal"
              value={draft.maxTotalPayout}
              onChange={(e) => onChange({ maxTotalPayout: e.target.value })}
              placeholder="Unlimited"
              className="bg-neutral-800 border-neutral-700 text-white font-mono h-10"
            />
            <div className="text-xs text-neutral-500">
              Engine halts once cumulative payout passes this.
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-neutral-300">Max pool amount</Label>
            <Input
              type="text"
              inputMode="decimal"
              value={draft.maxPoolAmount}
              onChange={(e) => onChange({ maxPoolAmount: e.target.value })}
              placeholder="Unlimited"
              className="bg-neutral-800 border-neutral-700 text-white font-mono h-10"
            />
            <div className="text-xs text-neutral-500">
              Hard cap on the pool — overflow stops accruing.
            </div>
          </div>
        </div>
      </section>

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
          disabled={submitting || !draft.tierName.trim() || shareInvalid}
          className="bg-blue-500 hover:bg-blue-600"
        >
          Save tier
        </Button>
      </div>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 border-b border-neutral-800 pb-1.5">
      {children}
    </div>
  );
}

function ModeCard({
  active,
  onClick,
  Icon,
  title,
  blurb,
}: {
  active: boolean;
  onClick: () => void;
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  blurb: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-xl border-2 p-4 transition-all ${
        active
          ? "border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/30"
          : "border-neutral-700 bg-neutral-900 hover:border-neutral-500"
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${active ? "text-blue-300" : "text-neutral-400"}`} />
        <div className={`font-medium text-sm ${active ? "text-white" : "text-neutral-200"}`}>
          {title}
        </div>
      </div>
      <div className="text-xs text-neutral-500 leading-relaxed">{blurb}</div>
    </button>
  );
}

/* ── Drop-style panels ──────────────────────────────────────────────── */
function PureChancePanel({
  draft,
  onChange,
}: {
  draft: ChildDraft;
  onChange: (patch: Partial<ChildDraft>) => void;
}) {
  const spins = Math.max(1, Math.trunc(Number(draft.spinsInterval) || 1));
  const vibe = pickPureChanceVibe(spins);
  const sliderPct = spinsToSlider(spins);
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-950/50 p-5 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-end">
        <div className="space-y-2">
          <Label className="text-neutral-400 text-xs uppercase tracking-wider">
            Interval (logarithmic — 1k to 10M spins)
          </Label>
          <Slider
            value={[sliderPct]}
            min={0}
            max={100}
            step={0.1}
            onValueChange={(v) =>
              onChange({ spinsInterval: String(sliderToSpins(v[0] ?? 0)) })
            }
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-neutral-300 text-sm">1 in</span>
          <Input
            type="number"
            inputMode="numeric"
            min={MIN_SPINS}
            max={MAX_SPINS}
            step={100}
            value={draft.spinsInterval}
            onChange={(e) => onChange({ spinsInterval: e.target.value })}
            className="bg-neutral-800 border-neutral-700 text-white font-mono h-10 w-32"
          />
          <span className="text-neutral-300 text-sm">spins</span>
        </div>
      </div>
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs ${vibe.chip}`}
      >
        <vibe.Icon className="w-3.5 h-3.5" />
        {vibe.label}
      </div>
      <div className="text-sm text-neutral-300">{vibe.copy}</div>
    </div>
  );
}

function HypeCurvePanel({
  draft,
  onChange,
}: {
  draft: ChildDraft;
  onChange: (patch: Partial<ChildDraft>) => void;
}) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-950/50 p-5 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-neutral-300">Min win boundary</Label>
          <Input
            type="text"
            inputMode="decimal"
            value={draft.minBoundary}
            onChange={(e) => onChange({ minBoundary: e.target.value })}
            className="bg-neutral-800 border-neutral-700 text-white font-mono h-10"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-neutral-300">Max win boundary</Label>
          <Input
            type="text"
            inputMode="decimal"
            value={draft.maxBoundary}
            onChange={(e) => onChange({ maxBoundary: e.target.value })}
            className="bg-neutral-800 border-neutral-700 text-white font-mono h-10"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-neutral-300">Drop pacing</Label>
          <select
            value={draft.dropPacing}
            onChange={(e) =>
              onChange({ dropPacing: e.target.value as ChildDraft["dropPacing"] })
            }
            className="w-full h-10 rounded-md bg-neutral-800 border border-neutral-700 px-3 text-sm text-white"
          >
            <option value="fast">Fast — front-loaded drops</option>
            <option value="balanced">Balanced — even distribution</option>
            <option value="slow">Slow — back-loaded drops</option>
          </select>
        </div>
      </div>
      <div className="text-xs text-neutral-500">
        Dynamic must-drop engine forces a win between the boundaries; pacing
        controls how aggressively probability rises as the pool grows.
      </div>
    </div>
  );
}

function HappyHourPanel({
  draft,
  onChange,
}: {
  draft: ChildDraft;
  onChange: (patch: Partial<ChildDraft>) => void;
}) {
  const isDaily = draft.freqInterval === "DAILY";
  const dayLabel =
    draft.freqInterval === "WEEKLY"
      ? "Day of week (0=Sun … 6=Sat)"
      : "Day of month (1–31)";
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-950/50 p-5 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-neutral-300">Recurrence</Label>
          <select
            value={draft.freqInterval}
            onChange={(e) =>
              onChange({ freqInterval: e.target.value as FreqInterval, freqDay: "" })
            }
            className="w-full h-10 rounded-md bg-neutral-800 border border-neutral-700 px-3 text-sm text-white"
          >
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
          </select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label className="text-neutral-300">{isDaily ? "—" : dayLabel}</Label>
          <Input
            type="text"
            disabled={isDaily}
            value={draft.freqDay}
            onChange={(e) => onChange({ freqDay: e.target.value })}
            placeholder={isDaily ? "Not used for daily" : ""}
            className="bg-neutral-800 border-neutral-700 text-white font-mono h-10 disabled:opacity-50"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-neutral-300">Contribution window start (UTC)</Label>
          <Input
            type="time"
            value={draft.contribStartTime}
            onChange={(e) => onChange({ contribStartTime: e.target.value })}
            className="bg-neutral-800 border-neutral-700 text-white font-mono h-10"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-neutral-300">Contribution window end (UTC)</Label>
          <Input
            type="time"
            value={draft.contribEndTime}
            onChange={(e) => onChange({ contribEndTime: e.target.value })}
            className="bg-neutral-800 border-neutral-700 text-white font-mono h-10"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-neutral-300">
        <input
          type="checkbox"
          checked={draft.cloneContribToWin}
          onChange={(e) => onChange({ cloneContribToWin: e.target.checked })}
          className="accent-blue-500"
        />
        Use the same window for win eligibility
      </label>

      {!draft.cloneContribToWin && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-neutral-300">Win window start (UTC)</Label>
            <Input
              type="time"
              value={draft.winStartTime}
              onChange={(e) => onChange({ winStartTime: e.target.value })}
              className="bg-neutral-800 border-neutral-700 text-white font-mono h-10"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-neutral-300">Win window end (UTC)</Label>
            <Input
              type="time"
              value={draft.winEndTime}
              onChange={(e) => onChange({ winEndTime: e.target.value })}
              className="bg-neutral-800 border-neutral-700 text-white font-mono h-10"
            />
          </div>
        </div>
      )}
      <div className="text-xs text-neutral-500">
        Spins outside the contribution window accrue zero; spins outside the win
        window cannot trigger drops. Curated subset — full Frequency
        recurrenceType validation is skipped here.
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
  savedChildren: SavedChild[];
  sharesTotal: number;
  sharesValid: boolean;
  submitting: boolean;
  onBack: () => void;
  onActivate: () => void;
}) {
  const sorted = [...savedChildren].sort((a, b) => b.tierRank - a.tierRank);
  const totalSeedExposure = savedChildren.reduce((sum, c) => sum + c.seedAmount, 0);
  const gameCount = group.assignedGameIds?.length ?? 0;
  const catCount = group.assignedCategories?.length ?? 0;

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
          label="Type"
          value={group.contributionType === "percentage" ? "Percentage" : "Fixed"}
        />
        <SummaryStat
          label="Source"
          value={group.contributionSource === "operator" ? "Operator-funded" : "Player-funded"}
        />
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <SummaryStat
          label="Master value"
          value={formatMasterValue(
            group.contributionType,
            group.masterContributionValue,
          )}
          accent="emerald"
        />
        <SummaryStat
          label="Assigned games"
          value={`${catCount} cats · ${gameCount} games`}
        />
        <SummaryStat
          label="Combined seed exposure"
          value={totalSeedExposure.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        />
        <SummaryStat
          label="Allocated shares"
          value={`${sharesTotal.toFixed(2)}% / 100.00%`}
          accent={sharesValid ? "emerald" : "red"}
        />
      </div>

      {sharesValid && (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 mb-6 flex items-center gap-3">
          <Check className="w-5 h-5 text-emerald-300" />
          <div className="text-sm text-emerald-100">
            <span className="font-semibold">Splits aligned — 100.00%.</span>{" "}
            Ready to activate.
          </div>
        </div>
      )}

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
                    <div className="text-[11px] text-neutral-500 font-mono truncate">
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
                <div className="col-span-2 text-xs">
                  <div className="text-neutral-500 uppercase tracking-wider">
                    Seed / Reseed
                  </div>
                  <div className="text-white font-mono truncate">
                    {c.seedAmount.toFixed(2)} / {c.reseedingAmount.toFixed(2)}
                  </div>
                </div>
                <div className="col-span-2 text-xs">
                  <div className="text-neutral-500 uppercase tracking-wider">
                    Derived
                  </div>
                  <div className="text-white font-mono truncate">
                    {formatDerivedRate(
                      group.contributionType,
                      group.masterContributionValue,
                      c.splitShare,
                    )}
                  </div>
                </div>
                <div className="col-span-2 text-xs">
                  <div className="text-neutral-500 uppercase tracking-wider">
                    Trigger
                  </div>
                  <div className="text-white truncate" title={c.triggerSummary}>
                    {c.triggerSummary}
                  </div>
                  {(c.maxNumberOfWins !== undefined ||
                    c.maxTotalPayout !== undefined) && (
                    <div className="text-[10px] text-amber-300 mt-0.5 truncate">
                      {c.maxNumberOfWins !== undefined &&
                        `≤ ${c.maxNumberOfWins} wins`}
                      {c.maxNumberOfWins !== undefined &&
                        c.maxTotalPayout !== undefined &&
                        " · "}
                      {c.maxTotalPayout !== undefined &&
                        `≤ ${c.maxTotalPayout.toLocaleString()} payout`}
                    </div>
                  )}
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

// Re-export parseFrequencyJSON helpers so future edit flows can hydrate a
// saved tier card from a child jackpot's stored trigger_condition.
export { parseFrequencyJSON, pickFrequencyInterval, pickTime };

/* ────────────────────────────────────────────────────────────────── */
/* Jackpot Contribution Card — mirrors Single Jackpot pattern         */
/* (Fixed/Percent · Amount · Pool/Seed/House weights · wager limits)  */
/* ────────────────────────────────────────────────────────────────── */

const BrightLabel = ({
  htmlFor,
  children,
  className = "",
}: {
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <Label htmlFor={htmlFor} className={`text-neutral-100 ${className}`}>
    {children}
  </Label>
);

const CurrencyInput = ({
  id,
  ...props
}: React.ComponentProps<typeof Input> & { id: string }) => (
  <div className="relative">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
      €
    </span>
    <Input id={id} {...props} className={`pl-8 ${props.className || ""}`} />
  </div>
);

const formatDraft = (value: number) =>
  Number.isFinite(value) && value !== 0 ? `${value}` : "";

function DraftNumberInput({
  id,
  value,
  onCommit,
  className = "",
  placeholder,
}: {
  id?: string;
  value: number;
  onCommit: (next: number) => void;
  className?: string;
  placeholder?: string;
}) {
  const [draft, setDraft] = React.useState(formatDraft(value));
  const [editing, setEditing] = React.useState(false);
  React.useEffect(() => {
    if (!editing) setDraft(formatDraft(value));
  }, [value, editing]);
  const commit = () => {
    setEditing(false);
    const raw = draft.trim().replace(",", ".");
    if (raw === "" || raw === ".") {
      onCommit(0);
      setDraft("");
      return;
    }
    const next = Number(raw);
    if (!Number.isFinite(next)) {
      setDraft(formatDraft(value));
      return;
    }
    onCommit(next);
  };
  return (
    <Input
      id={id}
      type="text"
      inputMode="decimal"
      value={draft}
      placeholder={placeholder}
      onFocus={() => setEditing(true)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
      onChange={(e) => {
        const raw = e.target.value.replace(",", ".");
        if (!/^\d*\.?\d*$/.test(raw)) return;
        setDraft(raw);
      }}
      className={className}
    />
  );
}

function JackpotContributionCard({
  contributionSource,
  setContributionSource,
  contributionType,
  setContributionType,
  totalContributionAmount,
  setTotalContributionAmount,
  minWagerAmount,
  maxWagerAmount,
  setMinWagerAmount,
  setMaxWagerAmount,
}: {
  contributionSource: ContributionSource;
  setContributionSource: (s: ContributionSource) => void;
  contributionType: ContributionType;
  setContributionType: (t: ContributionType) => void;
  totalContributionAmount: number;
  setTotalContributionAmount: (n: number) => void;
  minWagerAmount: number;
  maxWagerAmount: number;
  setMinWagerAmount: (n: number) => void;
  setMaxWagerAmount: (n: number) => void;
}) {
  return (
    <section className="scroll-mt-20">
      <h2 className="text-xl font-semibold mb-6 text-white">Jackpot Contribution</h2>
      <Card className="p-6 bg-neutral-900/50 border-neutral-800 mb-2">
        {/* Player vs Operator funded — master-level decision */}
        <div className="mb-6">
          <div className="text-sm font-semibold text-neutral-100 mb-2">
            Contribution Source
          </div>
          <div className="inline-flex gap-2">
            <button
              type="button"
              onClick={() => setContributionSource("player")}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                contributionSource === "player"
                  ? "bg-blue-500 text-white"
                  : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
              }`}
            >
              Player-funded
            </button>
            <button
              type="button"
              onClick={() => setContributionSource("operator")}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                contributionSource === "operator"
                  ? "bg-blue-500 text-white"
                  : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
              }`}
            >
              Operator-funded
            </button>
          </div>
          <p className="text-[11px] text-neutral-500 mt-2">
            {contributionSource === "player"
              ? "Contribution is deducted from each qualifying player wager."
              : "Contribution is funded entirely by the operator on every spin."}
          </p>
        </div>

        <div className="inline-flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setContributionType("fixed")}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
              contributionType === "fixed"
                ? "bg-blue-500 text-white"
                : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
            }`}
          >
            Fixed
          </button>
          <button
            type="button"
            onClick={() => setContributionType("percentage")}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
              contributionType === "percentage"
                ? "bg-blue-500 text-white"
                : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
            }`}
          >
            Percent
          </button>
        </div>

        {contributionType === "percentage" && (
          <div className="mb-8 p-4 rounded-lg border border-neutral-800 bg-neutral-900/60">
            <div className="text-sm font-semibold text-neutral-100 mb-1">
              Wager Eligibility Limits
            </div>
            <p className="text-[11px] text-neutral-500 mb-4">
              Bets outside this range do not contribute.
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <BrightLabel htmlFor="mj-min-wager">
                  Minimum Qualifying Wager
                </BrightLabel>
                <CurrencyInput
                  id="mj-min-wager"
                  placeholder="0"
                  value={minWagerAmount || ""}
                  onChange={(e) =>
                    setMinWagerAmount(parseFloat(e.target.value) || 0)
                  }
                  className="bg-neutral-800 border-neutral-700"
                />
              </div>
              <div className="space-y-2">
                <BrightLabel htmlFor="mj-max-wager">
                  Maximum Qualifying Wager
                </BrightLabel>
                <CurrencyInput
                  id="mj-max-wager"
                  placeholder="0"
                  value={maxWagerAmount || ""}
                  onChange={(e) =>
                    setMaxWagerAmount(parseFloat(e.target.value) || 0)
                  }
                  className="bg-neutral-800 border-neutral-700"
                />
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2" style={{ width: 193 }}>
          <BrightLabel
            htmlFor="mj-total"
            className="text-sm font-semibold text-neutral-100"
          >
            {contributionType === "fixed"
              ? "Fixed Contribution Amount"
              : "Percent of Wager"}
          </BrightLabel>
          <div className="relative">
            <DraftNumberInput
              id="mj-total"
              value={totalContributionAmount}
              onCommit={setTotalContributionAmount}
              className="bg-neutral-900 border-neutral-700 pr-8 tabular-nums h-10"
            />
            <span className="absolute inset-y-0 right-3 flex items-center text-neutral-400 pointer-events-none text-sm">
              {contributionType === "fixed" ? "€" : "%"}
            </span>
          </div>
          <p className="text-[11px] text-neutral-500">
            Per-tier Pool / Seed / House weight split is configured inside each tier card.
          </p>
        </div>
      </Card>
    </section>
  );
}
