import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import * as React from "react";
import axios from "axios";
import { useQuery, useQueryClient } from "react-query";
import { toast } from "sonner";
import { AlertTriangle, ArrowLeft, Layers, Coins, Copy, Trash2, Pencil } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BrandContext } from "@/backoffice/app";
import {
  denominatorToProbability,
  formatDropFrequency,
  probabilityFixed8,
  probabilityToDenominator,
} from "@/lib/jackpot/tier-forecast";

const DEFAULT_DAILY_VOLUME = 25000;

type GroupStatus = "draft" | "active" | "disabled";
type ContributionSource = "player" | "operator";
type ContributionType = "percentage" | "fixed";

interface ChildDTO {
  id: number;
  name: string;
  tierRank: number;
  triggerProbability: number;
  contributionRate: number;
  splitShare: number;
  enabled: boolean;
  poolBalance: number;
}

interface GroupDetailDTO {
  id: number;
  name: string;
  status: GroupStatus;
  overlappingRule: string;
  contributionSource: ContributionSource;
  contributionType: ContributionType;
  masterContributionValue: number;
  activatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  children: ChildDTO[];
}

function StatusPill({ status }: { status: GroupStatus }) {
  const styles: Record<GroupStatus, string> = {
    draft: "bg-neutral-500/10 text-neutral-300 border-neutral-500/30",
    active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    disabled: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  };
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold border uppercase tracking-wider ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function formatMasterValue(type: ContributionType, value: number): string {
  if (type === "percentage") return `${(value * 100).toFixed(4)}%`;
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function JackpotGroupDetailPage() {
  const { id } = useParams({ from: "/admin/jackpot-groups/$id" });
  const { brandId } = React.useContext(BrandContext);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const nameInputRef = React.useRef<HTMLInputElement | null>(null);

  function focusEditor() {
    requestAnimationFrame(() => {
      nameInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      nameInputRef.current?.focus();
      nameInputRef.current?.select?.();
    });
  }


  const query = useQuery<GroupDetailDTO>({
    queryKey: ["jackpot-group", id, brandId],
    enabled: brandId != null,
    queryFn: async () => {
      const res = await axios.get<GroupDetailDTO>(
        `/api/v1/jackpot-groups/${id}`,
        { headers: { brandId: String(brandId) } },
      );
      return res.data;
    },
  });

  const group = query.data;
  const isActive = group?.status === "active";

  // Local edit state for header card (only used when not active).
  const [draftName, setDraftName] = React.useState("");
  const [draftSource, setDraftSource] = React.useState<ContributionSource>("player");
  const [draftType, setDraftType] = React.useState<ContributionType>("percentage");
  const [draftMasterValue, setDraftMasterValue] = React.useState("0.00");

  React.useEffect(() => {
    if (group) {
      setDraftName(group.name);
      setDraftSource(group.contributionSource);
      setDraftType(group.contributionType);
      // Display percentage as human %, fixed as currency
      setDraftMasterValue(
        group.contributionType === "percentage"
          ? (group.masterContributionValue * 100).toFixed(4)
          : group.masterContributionValue.toFixed(2),
      );
    }
  }, [group?.id, group?.updatedAt]);

  const sharesTotal = (group?.children ?? []).reduce(
    (acc, c) => acc + Number(c.splitShare ?? 0),
    0,
  );
  const sharesValid = Math.abs(sharesTotal - 100) <= 0.01;

  async function saveProfile() {
    if (!group) return;
    const raw = Number.parseFloat(draftMasterValue) || 0;
    const stored = draftType === "percentage" ? raw / 100 : raw;
    try {
      await axios.patch(
        `/api/v1/jackpot-groups/${group.id}`,
        {
          name: draftName,
          contributionSource: draftSource,
          contributionType: draftType,
          masterContributionValue: stored,
        },
        { headers: { brandId: String(brandId), "Content-Type": "application/json" } },
      );
      toast.success("MultiJackpot updated");
      await queryClient.invalidateQueries(["jackpot-group", id]);
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? err?.message ?? "Update failed");
    }
  }

  async function setStatus(next: GroupStatus) {
    if (!group) return;
    try {
      await axios.post(
        `/api/v1/jackpot-groups/${group.id}/status`,
        { status: next },
        { headers: { brandId: String(brandId), "Content-Type": "application/json" } },
      );
      toast.success(`MultiJackpot moved to ${next}`);
      await queryClient.invalidateQueries(["jackpot-group", id]);
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? err?.message ?? "Status change failed");
    }
  }

  async function handleClone() {
    setBusy(true);
    try {
      const res = await axios.post(
        `/api/v1/jackpot-groups/${id}/clone`,
        {},
        { headers: { brandId: String(brandId) } },
      );
      toast.success("MultiJackpot cloned");
      const newId = (res.data as { id: number }).id;
      navigate({ to: "/admin/jackpot-groups/$id", params: { id: String(newId) } });
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? err?.message ?? "Clone failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    try {
      await axios.delete(`/api/v1/jackpot-groups/${id}`, {
        headers: { brandId: String(brandId) },
      });
      toast.success("MultiJackpot deleted");
      await queryClient.invalidateQueries(["jackpot-groups"]);
      navigate({ to: "/admin/jackpot-groups" });
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? err?.message ?? "Delete failed");
      setBusy(false);
      setConfirmDelete(false);
    }
  }

  if (query.isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white p-10">Loading…</div>
    );
  }
  if (query.isError || !group) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white p-10">
        <p className="text-red-400">
          Failed to load MultiJackpot: {(query.error as any)?.message ?? "not found"}
        </p>
        <Link to="/admin/jackpot-groups" className="text-blue-400 underline mt-4 inline-block">
          ← Back to MultiJackpots
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-6">
        <div>
          <Link
            to="/admin/jackpot-groups"
            className="inline-flex items-center text-sm text-neutral-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> All MultiJackpots
          </Link>
        </div>

        {isActive && (
          <div
            role="alert"
            className="rounded-lg border-2 border-amber-500/60 bg-amber-500/10 p-4 flex items-start gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-amber-200 font-medium">
                MultiJackpot is active — disable it before editing configuration.
              </p>
              <p className="text-amber-200/70 text-sm mt-1">
                All master funding rules and child tier configurations are locked
                across the platform while this MultiJackpot is live.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setStatus("disabled")}
              className="border-amber-500/50 text-amber-200 hover:bg-amber-500/20"
            >
              Disable
            </Button>
          </div>
        )}

        <fieldset disabled={isActive} className="space-y-6 group/active">
          <Card className="p-6 bg-neutral-900/50 border-neutral-800">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 text-neutral-400 text-sm mb-1">
                  <Layers className="w-4 h-4" />
                  MultiJackpot
                </div>
                <h1 className="text-3xl font-semibold">{group.name}</h1>
                <div className="text-xs text-neutral-500 font-mono mt-1">#{group.id}</div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusPill status={group.status} />
                {!isActive && (
                  <div className="flex gap-2 flex-wrap justify-end">
                    {group.status === "draft" && (
                      <Button
                        size="sm"
                        onClick={() => setStatus("active")}
                        disabled={!sharesValid || group.children.length === 0}
                        className="bg-emerald-500 hover:bg-emerald-600"
                      >
                        Activate
                      </Button>
                    )}
                    {group.status === "disabled" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setStatus("draft")}
                          className="border-neutral-700"
                        >
                          Move to draft
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setStatus("active")}
                          disabled={!sharesValid || group.children.length === 0}
                          className="bg-emerald-500 hover:bg-emerald-600"
                        >
                          Activate
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleClone}
                      disabled={busy}
                      className="border-neutral-700"
                    >
                      <Copy className="w-3.5 h-3.5 mr-1.5" /> Clone
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setConfirmDelete(true)}
                      disabled={busy}
                      className="border-red-500/50 text-red-300 hover:bg-red-500/10 hover:text-red-200"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mb-6">
              <div className="space-y-2">
                <Label className="text-neutral-300">Name</Label>
                <Input
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  className="bg-neutral-800 border-neutral-700 text-white disabled:opacity-60"
                />
              </div>
            </div>

            {/* Master Funding card */}
            <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-5 mb-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-blue-300 mb-3">
                <Coins className="w-3.5 h-3.5" /> Master funding
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-neutral-300">Contribution Source</Label>
                  <select
                    value={draftSource}
                    onChange={(e) => setDraftSource(e.target.value as ContributionSource)}
                    className="w-full h-10 rounded-md bg-neutral-800 border border-neutral-700 px-3 text-sm text-white disabled:opacity-60"
                  >
                    <option value="player">Player (deducted from wager)</option>
                    <option value="operator">Operator (house-funded)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-neutral-300">Contribution Type</Label>
                  <select
                    value={draftType}
                    onChange={(e) => setDraftType(e.target.value as ContributionType)}
                    className="w-full h-10 rounded-md bg-neutral-800 border border-neutral-700 px-3 text-sm text-white disabled:opacity-60"
                  >
                    <option value="percentage">Percentage of wager</option>
                    <option value="fixed">Fixed amount per spin</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-neutral-300">Master Value</Label>
                  <div className="relative">
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={draftMasterValue}
                      onChange={(e) => setDraftMasterValue(e.target.value)}
                      className="bg-neutral-800 border-neutral-700 text-white font-mono pr-10 disabled:opacity-60"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
                      {draftType === "percentage" ? "%" : "₵"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="text-xs text-neutral-400">
                  Allocated shares:{" "}
                  <span
                    className={`font-mono font-semibold ${sharesValid ? "text-emerald-300" : "text-amber-300"}`}
                  >
                    {sharesTotal.toFixed(2)}% / 100.00%
                  </span>
                </div>
                {!isActive && (
                  <Button onClick={saveProfile} size="sm" className="bg-blue-500 hover:bg-blue-600">
                    Save funding settings
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-neutral-800 text-sm">
              <Stat label="Created" value={new Date(group.createdAt).toLocaleString()} />
              <Stat label="Updated" value={new Date(group.updatedAt).toLocaleString()} />
              <Stat
                label="Activated"
                value={group.activatedAt ? new Date(group.activatedAt).toLocaleString() : "—"}
              />
              <Stat label="Children" value={String(group.children.length)} />
            </div>
          </Card>

          <Card className="bg-neutral-900/50 border-neutral-800 overflow-hidden">
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Child tiers</h2>
              <span className="text-xs text-neutral-500">
                Sorted by tier rank (ascending) · Split shares must total 100.00%
              </span>
            </div>
            {group.children.length === 0 ? (
              <div className="p-8 text-center text-neutral-400">
                No child jackpots attached yet.
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {group.children
                  .slice()
                  .sort((a, b) => a.tierRank - b.tierRank)
                  .map((c) => (
                    <ChildTierEditor
                      key={c.id}
                      child={c}
                      group={group}
                      brandId={brandId}
                      onSaved={() => queryClient.invalidateQueries(["jackpot-group", id])}
                    />
                  ))}
              </div>
            )}
          </Card>
        </fieldset>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(false)}>
        <AlertDialogContent className="bg-neutral-900 border-neutral-700 text-neutral-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete MultiJackpot?</AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-400">
              This permanently removes{" "}
              <span className="font-semibold text-neutral-200">{group.name}</span>{" "}
              and detaches all its child tiers. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={busy}
              className="bg-neutral-800 border-neutral-700 hover:bg-neutral-700"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {busy ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ChildTierEditor({
  child,
  group,
  brandId,
  onSaved,
}: {
  child: ChildDTO;
  group: GroupDetailDTO;
  brandId: string | number | null | undefined;
  onSaved: () => void;
}) {
  const [name, setName] = React.useState(child.name);
  const [denominator, setDenominator] = React.useState<string>(() =>
    probabilityToDenominator(child.triggerProbability) || "0",
  );
  const [splitShare, setSplitShare] = React.useState<string>(() =>
    Number(child.splitShare ?? 0).toFixed(2),
  );
  const [dailyVolume, setDailyVolume] = React.useState<number>(DEFAULT_DAILY_VOLUME);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setName(child.name);
    setDenominator(probabilityToDenominator(child.triggerProbability) || "0");
    setSplitShare(Number(child.splitShare ?? 0).toFixed(2));
  }, [child.id, child.name, child.triggerProbability, child.splitShare]);

  const probability = denominatorToProbability(denominator);
  const dropText = formatDropFrequency(probability, dailyVolume);
  const shareNum = Number.parseFloat(splitShare) || 0;
  const derived =
    (group.masterContributionValue * shareNum) / 100;
  const derivedLabel =
    group.contributionType === "percentage"
      ? `${(derived * 100).toFixed(4)}% of wager`
      : `${derived.toFixed(4)} / spin`;

  async function save() {
    setSaving(true);
    try {
      // 1) Re-attach via children endpoint to re-derive contribution_percentage from master × share
      await axios.post(
        `/api/v1/jackpot-groups/${group.id}/children`,
        {
          jackpotId: child.id,
          tierRank: child.tierRank,
          triggerProbability: Number(probability.toFixed(8)),
          splitShare: shareNum,
          name: name.trim() || child.name,
        },
        {
          headers: {
            brandId: String(brandId ?? ""),
            "Content-Type": "application/json",
          },
        },
      );
      toast.success(`Tier "${name.trim() || child.name}" updated`);
      onSaved();
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? err?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-950/40 p-4 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <Label className="text-neutral-300">
            Tier Name{" "}
            <span className="text-neutral-500 font-normal">
              (operator-facing label)
            </span>
          </Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Mini, Super Drop, Friday Booster"
            className="bg-neutral-800 border-neutral-700 text-white"
          />
        </div>
        <div className="text-right pt-1">
          <div className="text-xs uppercase text-neutral-500 tracking-wider">
            Rank
          </div>
          <div className="text-white font-mono text-lg">{child.tierRank}</div>
          <div className="text-xs text-neutral-500 font-mono">#{child.id}</div>
        </div>
      </div>

      <div className="rounded-md border border-neutral-800 bg-neutral-900/60 p-4 space-y-3">
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
                value={denominator}
                onChange={(e) => setDenominator(e.target.value)}
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
              Group Split Share (%)
            </Label>
            <div className="relative">
              <Input
                type="text"
                inputMode="decimal"
                value={splitShare}
                onChange={(e) => setSplitShare(e.target.value)}
                placeholder="25.00"
                className="bg-neutral-800 border-neutral-700 text-white font-mono pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
                %
              </span>
            </div>
            <div className="text-xs text-neutral-500 pt-1">
              Derived: <span className="text-neutral-300 font-mono">{derivedLabel}</span>{" "}
              · Pool: {Number(child.poolBalance).toFixed(2)} · Enabled:{" "}
              {child.enabled ? "yes" : "no"}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-md border border-neutral-800 bg-neutral-900/60 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-neutral-300">
            Simulated Daily Volume{" "}
            <span className="text-neutral-500 font-normal text-xs">
              (preview only — not saved)
            </span>
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

      <div className="flex justify-end">
        <Button
          type="button"
          size="sm"
          onClick={save}
          disabled={saving}
          className="bg-blue-500 hover:bg-blue-600"
        >
          Save tier
        </Button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase text-neutral-500 tracking-wider mb-1">
        {label}
      </div>
      <div className="text-neutral-200">{value}</div>
    </div>
  );
}

export { formatMasterValue };

export const Route = createFileRoute("/admin/jackpot-groups/$id")({
  ssr: false,
  component: JackpotGroupDetailPage,
});
