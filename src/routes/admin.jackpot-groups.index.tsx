import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import axios from "axios";
import { useQuery, useQueryClient } from "react-query";
import { toast } from "sonner";
import {
  Plus,
  Layers,
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
  Power,
  PowerOff,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

interface GroupListDTO {
  id: number;
  name: string;
  status: "draft" | "active" | "disabled";
  overlappingRule: string;
  activatedAt: string | null;
  createdAt: string;
}

interface ChildSummary {
  id: number;
  tierRank: number;
}

function useGroupsList(brandId: number | undefined) {
  return useQuery<GroupListDTO[]>({
    queryKey: ["jackpot-groups", brandId],
    enabled: brandId != null,
    queryFn: async () => {
      const res = await axios.get<GroupListDTO[]>("/api/v1/jackpot-groups", {
        headers: { brandId: String(brandId) },
      });
      return res.data;
    },
  });
}

function useGroupChildren(brandId: number | undefined, groupId: number) {
  return useQuery<ChildSummary[]>({
    queryKey: ["jackpot-group-children", groupId, brandId],
    enabled: brandId != null,
    queryFn: async () => {
      const res = await axios.get<ChildSummary[]>(
        `/api/v1/jackpot-groups/${groupId}/children`,
        { headers: { brandId: String(brandId) } },
      );
      return res.data;
    },
  });
}

function StatusBadge({ status }: { status: GroupListDTO["status"] }) {
  const styles: Record<GroupListDTO["status"], string> = {
    draft: "bg-neutral-500/10 text-neutral-300 border-neutral-500/30",
    active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    disabled: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  };
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status]}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function ChildCountCell({
  brandId,
  groupId,
}: {
  brandId: number | undefined;
  groupId: number;
}) {
  const q = useGroupChildren(brandId, groupId);
  if (q.isLoading) return <span className="text-neutral-500">…</span>;
  if (q.isError) return <span className="text-red-400">err</span>;
  return <span className="text-white">{q.data?.length ?? 0}</span>;
}

type ConfirmKind =
  | { kind: "delete"; group: GroupListDTO }
  | { kind: "disable"; group: GroupListDTO }
  | { kind: "enable"; group: GroupListDTO };

function GroupRowActions({
  group,
  brandId,
  onAskConfirm,
}: {
  group: GroupListDTO;
  brandId: number | undefined;
  onAskConfirm: (c: ConfirmKind) => void;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [busy, setBusy] = React.useState(false);

  async function handleClone() {
    setBusy(true);
    try {
      const res = await axios.post(
        `/api/v1/jackpot-groups/${group.id}/clone`,
        {},
        { headers: { brandId: String(brandId) } },
      );
      toast.success(`Cloned "${group.name}"`);
      await queryClient.invalidateQueries(["jackpot-groups"]);
      const newId = (res.data as { id: number }).id;
      navigate({
        to: "/admin/jackpot-groups/$id",
        params: { id: String(newId) },
      });
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? err?.message ?? "Clone failed");
    } finally {
      setBusy(false);
    }
  }

  // Active: a single inline Disable button — no menu noise.
  if (group.status === "active") {
    return (
      <div className="flex items-center justify-end gap-2">
        <Link
          to="/admin/jackpot-groups/$id"
          params={{ id: String(group.id) }}
        >
          <Button variant="outline" size="sm" className="border-neutral-700">
            View
          </Button>
        </Link>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAskConfirm({ kind: "disable", group })}
          className="border-amber-500/50 text-amber-300 hover:bg-amber-500/10 hover:text-amber-200"
        >
          <PowerOff className="w-3.5 h-3.5 mr-1.5" />
          Disable
        </Button>
      </div>
    );
  }

  // Draft / Disabled: full action menu.
  return (
    <div className="flex items-center justify-end gap-2">
      <Link to="/admin/jackpot-groups/$id" params={{ id: String(group.id) }}>
        <Button variant="outline" size="sm" className="border-neutral-700">
          <Pencil className="w-3.5 h-3.5 mr-1.5" />
          Edit
        </Button>
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="border-neutral-700 px-2"
            disabled={busy}
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="bg-neutral-900 border-neutral-800 text-neutral-100"
        >
          <DropdownMenuItem
            onClick={() => onAskConfirm({ kind: "enable", group })}
            className="focus:bg-emerald-500/10 focus:text-emerald-300"
          >
            <Power className="w-4 h-4 mr-2" /> Enable
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleClone}>
            <Copy className="w-4 h-4 mr-2" /> Clone
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-neutral-800" />
          <DropdownMenuItem
            onClick={() => onAskConfirm({ kind: "delete", group })}
            className="text-red-400 focus:bg-red-500/10 focus:text-red-300"
          >
            <Trash2 className="w-4 h-4 mr-2" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function JackpotGroupsIndexPage() {
  const { brandId } = React.useContext(BrandContext);
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useGroupsList(brandId);
  const groups = data ?? [];

  const [confirm, setConfirm] = React.useState<ConfirmKind | null>(null);
  const [running, setRunning] = React.useState(false);

  async function runConfirmed() {
    if (!confirm) return;
    setRunning(true);
    try {
      if (confirm.kind === "delete") {
        await axios.delete(`/api/v1/jackpot-groups/${confirm.group.id}`, {
          headers: { brandId: String(brandId) },
        });
        toast.success(`Deleted "${confirm.group.name}"`);
      } else {
        const next = confirm.kind === "enable" ? "active" : "disabled";
        await axios.post(
          `/api/v1/jackpot-groups/${confirm.group.id}/status`,
          { status: next },
          {
            headers: {
              brandId: String(brandId),
              "Content-Type": "application/json",
            },
          },
        );
        toast.success(
          confirm.kind === "enable"
            ? `Activated "${confirm.group.name}"`
            : `Disabled "${confirm.group.name}"`,
        );
      }
      await queryClient.invalidateQueries(["jackpot-groups"]);
      setConfirm(null);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.error ?? err?.message ?? "Action failed",
      );
    } finally {
      setRunning(false);
    }
  }

  const confirmCopy: Record<
    ConfirmKind["kind"],
    { title: string; body: string; cta: string; tone: "danger" | "warn" | "ok" }
  > = {
    delete: {
      title: "Delete MultiJackpot?",
      body:
        "This permanently removes the group. Its child jackpots will be detached and become standalone drafts — they will NOT be deleted.",
      cta: "Yes, delete",
      tone: "danger",
    },
    disable: {
      title: "Disable MultiJackpot?",
      body:
        "Players will stop contributing immediately. You can re-enable it later from this screen.",
      cta: "Yes, disable",
      tone: "warn",
    },
    enable: {
      title: "Enable MultiJackpot?",
      body:
        "The group will go live across all assigned games. Configuration becomes locked while active.",
      cta: "Yes, enable",
      tone: "ok",
    },
  };
  const meta = confirm ? confirmCopy[confirm.kind] : null;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-neutral-400 text-sm mb-1">
              <Layers className="w-4 h-4" />
              MultiJackpot management
            </div>
            <h1 className="text-3xl font-semibold">MultiJackpots</h1>
            <p className="text-sm text-neutral-400 mt-1">
              Group ledger across this brand. Active MultiJackpots are
              read-only — disable to edit.
            </p>
          </div>
          <Link to="/admin/jackpots/new">
            <Button className="bg-blue-500 hover:bg-blue-600">
              <Plus className="w-4 h-4 mr-1" /> New MultiJackpot
            </Button>
          </Link>
        </div>

        <Card className="bg-neutral-900/50 border-neutral-800 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-neutral-400">
              Loading MultiJackpots…
            </div>
          ) : isError ? (
            <div className="p-8 text-center text-red-400">
              Failed to load:{" "}
              {(error as any)?.message ?? "unknown error"}
            </div>
          ) : groups.length === 0 ? (
            <div className="p-12 text-center">
              <Layers className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
              <p className="text-neutral-400">No MultiJackpots yet.</p>
              <Link to="/admin/jackpots/new" className="inline-block mt-4">
                <Button variant="outline" className="border-neutral-700">
                  <Plus className="w-4 h-4 mr-1" /> Create your first
                  MultiJackpot
                </Button>
              </Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-neutral-900 text-neutral-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-6 py-3">Name</th>
                  <th className="text-left px-6 py-3">Status</th>
                  <th className="text-left px-6 py-3">Overlapping rule</th>
                  <th className="text-left px-6 py-3">Children</th>
                  <th className="text-left px-6 py-3">Activated</th>
                  <th className="text-right px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((g) => (
                  <tr
                    key={g.id}
                    className="border-t border-neutral-800 hover:bg-neutral-900/40"
                  >
                    <td className="px-6 py-4">
                      <Link
                        to="/admin/jackpot-groups/$id"
                        params={{ id: String(g.id) }}
                        className="text-white font-medium hover:text-blue-400"
                      >
                        {g.name}
                      </Link>
                      <div className="text-xs text-neutral-500 font-mono">
                        #{g.id}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={g.status} />
                    </td>
                    <td className="px-6 py-4 capitalize text-neutral-300">
                      {g.overlappingRule}
                    </td>
                    <td className="px-6 py-4">
                      <ChildCountCell brandId={brandId} groupId={g.id} />
                    </td>
                    <td className="px-6 py-4 text-neutral-400 text-xs">
                      {g.activatedAt
                        ? new Date(g.activatedAt).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <GroupRowActions
                        group={g}
                        brandId={brandId}
                        onAskConfirm={setConfirm}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      <AlertDialog
        open={confirm != null}
        onOpenChange={(open) => !open && !running && setConfirm(null)}
      >
        <AlertDialogContent className="bg-neutral-900 border-neutral-800 text-neutral-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              {meta?.title}
              {confirm && (
                <span className="block text-sm font-normal text-neutral-400 mt-1">
                  “{confirm.group.name}”{" "}
                  <span className="font-mono text-xs">#{confirm.group.id}</span>
                </span>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-300">
              {meta?.body}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={running}
              className="bg-neutral-800 border-neutral-700 text-neutral-200 hover:bg-neutral-700"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={running}
              onClick={(e) => {
                e.preventDefault();
                void runConfirmed();
              }}
              className={
                meta?.tone === "danger"
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : meta?.tone === "warn"
                    ? "bg-amber-500 hover:bg-amber-600 text-black"
                    : "bg-emerald-500 hover:bg-emerald-600 text-black"
              }
            >
              {running ? "Working…" : meta?.cta}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export const Route = createFileRoute("/admin/jackpot-groups/")({
  ssr: false,
  component: JackpotGroupsIndexPage,
});
