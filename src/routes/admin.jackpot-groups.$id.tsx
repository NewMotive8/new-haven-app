import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import * as React from "react";
import axios from "axios";
import { useQuery, useQueryClient } from "react-query";
import { toast } from "sonner";
import { AlertTriangle, ArrowLeft, Layers, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { MultiJackpotWizard } from "@/components/jackpot/MultiJackpotWizard";
import type { JackpotDTO } from "@/lib/jackpot/types";

type GroupStatus = "draft" | "active" | "disabled";
type ContributionSource = "player" | "operator";
type ContributionType = "percentage" | "fixed";

interface GroupDetailDTO {
  id: number;
  name: string;
  status: GroupStatus;
  overlappingRule: string;
  contributionSource: ContributionSource;
  contributionType: ContributionType;
  masterContributionValue: number;
  assignedCategories?: string[];
  assignedGameIds?: number[];
  activatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  children: Array<
    JackpotDTO & { tierRank: number; triggerProbability: number; splitShare: number }
  >;
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
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

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
      navigate({ to: "/admin/jackpots" });
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

  const sharesTotal = group.children.reduce(
    (acc, c) => acc + Number(c.splitShare ?? 0),
    0,
  );
  const sharesValid = Math.abs(sharesTotal - 100) <= 0.01;

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

        {/* Group header — status + lifecycle actions */}
        <div className="flex items-start justify-between gap-4">
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

        {/* Reuse the full MultiJackpot wizard, hydrated with the saved group.
            Locks the whole surface while active — same fields, same UX as create. */}
        <fieldset disabled={isActive} className="disabled:opacity-70 disabled:pointer-events-none">
          <MultiJackpotWizard
            key={`group-${group.id}-${group.updatedAt}`}
            initialGroup={group}
            startAtStep={2}
          />
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

export const Route = createFileRoute("/admin/jackpot-groups/$id")({
  ssr: false,
  component: JackpotGroupDetailPage,
});
