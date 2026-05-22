import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import * as React from "react";
import axios from "axios";
import { useQuery, useQueryClient } from "react-query";
import { toast } from "react-toastify";
import { AlertTriangle, ArrowLeft, Layers } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandContext } from "@/backoffice/app";

type GroupStatus = "draft" | "active" | "disabled";

interface ChildDTO {
  id: number;
  name: string;
  tierRank: number;
  triggerProbability: number;
  contributionRate: number;
  enabled: boolean;
  poolBalance: number;
}

interface GroupDetailDTO {
  id: number;
  name: string;
  status: GroupStatus;
  overlappingRule: string;
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

function JackpotGroupDetailPage() {
  const { id } = useParams({ from: "/admin/jackpot-groups/$id" });
  const { brandId } = React.useContext(BrandContext);
  const queryClient = useQueryClient();

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
  const [draftRule, setDraftRule] = React.useState<"split" | "additive">("split");
  React.useEffect(() => {
    if (group) {
      setDraftName(group.name);
      setDraftRule((group.overlappingRule as any) === "additive" ? "additive" : "split");
    }
  }, [group?.id, group?.updatedAt]);

  async function saveProfile() {
    if (!group) return;
    try {
      await axios.patch(
        `/api/v1/jackpot-groups/${group.id}`,
        { name: draftName, overlappingRule: draftRule },
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
                All child jackpot configuration is locked across the platform while
                this MultiJackpot is live.
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

        {/* fieldset disabled → entire profile + children rows are read-only when active */}
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
                  <div className="flex gap-2">
                    {group.status === "draft" && (
                      <Button
                        size="sm"
                        onClick={() => setStatus("active")}
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
                          className="bg-emerald-500 hover:bg-emerald-600"
                        >
                          Activate
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-3xl">
              <div className="space-y-2">
                <Label className="text-neutral-300">Name</Label>
                <Input
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  className="bg-neutral-800 border-neutral-700 text-white disabled:opacity-60"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-neutral-300">Overlapping rule</Label>
                <select
                  value={draftRule}
                  onChange={(e) => setDraftRule(e.target.value as any)}
                  className="w-full h-10 rounded-md bg-neutral-800 border border-neutral-700 px-3 text-sm text-white disabled:opacity-60"
                >
                  <option value="split">Split</option>
                  <option value="additive">Additive</option>
                </select>
              </div>
            </div>

            {!isActive && (
              <div className="mt-6">
                <Button onClick={saveProfile} className="bg-blue-500 hover:bg-blue-600">
                  Save
                </Button>
              </div>
            )}

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
                Sorted by tier rank (ascending)
              </span>
            </div>
            {group.children.length === 0 ? (
              <div className="p-8 text-center text-neutral-400">
                No child jackpots attached yet.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-neutral-900 text-neutral-400 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-6 py-3">Rank</th>
                    <th className="text-left px-6 py-3">Jackpot</th>
                    <th className="text-left px-6 py-3">Trigger probability</th>
                    <th className="text-left px-6 py-3">Contribution rate</th>
                    <th className="text-left px-6 py-3">Pool balance</th>
                    <th className="text-left px-6 py-3">Enabled</th>
                  </tr>
                </thead>
                <tbody>
                  {group.children
                    .slice()
                    .sort((a, b) => a.tierRank - b.tierRank)
                    .map((c) => (
                      <tr key={c.id} className="border-t border-neutral-800">
                        <td className="px-6 py-4 text-white font-mono">{c.tierRank}</td>
                        <td className="px-6 py-4">
                          <div className="text-white">{c.name}</div>
                          <div className="text-xs text-neutral-500 font-mono">#{c.id}</div>
                        </td>
                        <td className="px-6 py-4 font-mono text-neutral-200">
                          {Number(c.triggerProbability).toFixed(8)}
                        </td>
                        <td className="px-6 py-4 font-mono text-neutral-200">
                          {Number(c.contributionRate).toFixed(8)}
                        </td>
                        <td className="px-6 py-4 font-mono text-neutral-200">
                          {Number(c.poolBalance).toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-xs px-2 py-0.5 rounded ${
                              c.enabled
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-neutral-700/40 text-neutral-400"
                            }`}
                          >
                            {c.enabled ? "yes" : "no"}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </Card>
        </fieldset>
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

export const Route = createFileRoute("/admin/jackpot-groups/$id")({
  ssr: false,
  component: JackpotGroupDetailPage,
});
