import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import axios from "axios";
import { useQuery, useQueryClient } from "react-query";
import { toast } from "react-toastify";
import {
  Search,
  Plus,
  Edit,
  Copy,
  Trash2,
  MoreHorizontal,
  Power,
  Eye,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
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
import { BrandContext } from "../backoffice/app";
import type { JackpotDTO, JackpotKind } from "@/lib/jackpot/types";

interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}

type GroupStatus = "draft" | "active" | "disabled";
interface JackpotGroupRow {
  id: number;
  name: string;
  status: GroupStatus;
  createdAt: string;
}

type RowStatus = "active" | "draft" | "disabled";
type RowKind = "single" | "group";

interface UnifiedRow {
  key: string;
  id: number;
  name: string;
  typeLabel: string;
  status: RowStatus;
  poolBalance: number;
  createdAt: string;
  kind: RowKind;
}

function useJackpotsPage(brandId: number | undefined, page: number, size: number) {
  return useQuery<SpringPage<JackpotDTO>>({
    queryKey: ["v2-jackpots", brandId, page, size],
    enabled: brandId != null,
    keepPreviousData: true,
    queryFn: async () => {
      const res = await axios.get<SpringPage<JackpotDTO>>("/api/v2/jackpots", {
        params: { page, size, sort: "id,asc" },
        headers: { brandId: String(brandId) },
      });
      return res.data;
    },
  });
}

function useGroups(brandId: number | undefined) {
  return useQuery<JackpotGroupRow[]>({
    queryKey: ["jackpot-groups", brandId],
    enabled: brandId != null,
    queryFn: async () => {
      const res = await axios.get<JackpotGroupRow[]>("/api/v1/jackpot-groups", {
        headers: { brandId: String(brandId) },
      });
      return res.data;
    },
  });
}

type StatusFilter = "all" | "active" | "draft" | "disabled";

const KIND_LABEL: Record<JackpotKind, string> = {
  classic: "Classic",
  must_drop: "Must Drop",
  frequency: "Frequency",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function StatusBadge({ status }: { status: RowStatus }) {
  const styles: Record<RowStatus, string> = {
    active: "bg-green-500/10 text-green-400 border-green-500/30",
    draft: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    disabled: "bg-neutral-500/10 text-neutral-400 border-neutral-500/30",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function JackpotsPage() {
  const { brandId } = React.useContext(BrandContext);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = React.useState(0);
  const [size, setSize] = React.useState(50);
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [confirm, setConfirm] = React.useState<UnifiedRow | null>(null);

  const { data, isLoading, isError, error, isFetching } = useJackpotsPage(brandId, page, size);
  const groupsQuery = useGroups(brandId);

  const refreshAll = React.useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries(["v2-jackpots"]),
      queryClient.invalidateQueries(["jackpot-groups"]),
    ]);
  }, [queryClient]);

  const rows: UnifiedRow[] = React.useMemo(() => {
    const out: UnifiedRow[] = [];
    for (const j of data?.content ?? []) {
      if (j.groupId != null) continue; // hide tier children (shown under their MultiJackpot)
      out.push({
        key: `j-${j.id}`,
        id: j.id,
        name: j.name,
        typeLabel: j.jackpotType ? KIND_LABEL[j.jackpotType] : "Classic",
        status: j.enabled ? "active" : "disabled",
        poolBalance: j.poolBalance ?? 0,
        createdAt: j.createdAt,
        kind: "single",
      });
    }
    for (const g of groupsQuery.data ?? []) {
      out.push({
        key: `g-${g.id}`,
        id: g.id,
        name: g.name,
        typeLabel: "Multi-Level",
        status: g.status,
        poolBalance: 0,
        createdAt: g.createdAt,
        kind: "group",
      });
    }
    return out;
  }, [data, groupsQuery.data]);

  const counts = React.useMemo(() => {
    const c = { all: rows.length, active: 0, draft: 0, disabled: 0 };
    for (const r of rows) c[r.status] += 1;
    return c;
  }, [rows]);

  const totalCurrentValue = React.useMemo(
    () => rows.filter((r) => r.status === "active").reduce((s, r) => s + r.poolBalance, 0),
    [rows],
  );

  const filtered = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!q) return true;
      return r.name.toLowerCase().includes(q) || r.typeLabel.toLowerCase().includes(q);
    });
  }, [rows, statusFilter, searchQuery]);

  async function actSingle(row: UnifiedRow, op: "enable" | "disable" | "clone" | "delete") {
    setBusyId(row.key);
    try {
      if (op === "enable" || op === "disable") {
        await axios.get(`/api/v1/jackpots/${op}/${row.id}`, {
          headers: { brandId: String(brandId) },
        });
        toast.success(`Jackpot ${op}d`);
      } else if (op === "clone") {
        await axios.post(`/api/v1/jackpots/clone/${row.id}`, {}, {
          headers: { brandId: String(brandId) },
        });
        toast.success("Jackpot cloned");
      } else if (op === "delete") {
        await axios.delete(`/api/v1/jackpots/${row.id}`, {
          headers: { brandId: String(brandId) },
        });
        toast.success("Jackpot deleted");
      }
      await refreshAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? err?.message ?? "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  async function actGroup(row: UnifiedRow, op: "enable" | "disable" | "clone" | "delete") {
    setBusyId(row.key);
    try {
      if (op === "enable" || op === "disable") {
        await axios.post(
          `/api/v1/jackpot-groups/${row.id}/status`,
          { status: op === "enable" ? "active" : "disabled" },
          { headers: { brandId: String(brandId), "Content-Type": "application/json" } },
        );
        toast.success(`MultiJackpot ${op}d`);
      } else if (op === "clone") {
        await axios.post(`/api/v1/jackpot-groups/${row.id}/clone`, {}, {
          headers: { brandId: String(brandId) },
        });
        toast.success("MultiJackpot cloned");
      } else if (op === "delete") {
        await axios.delete(`/api/v1/jackpot-groups/${row.id}`, {
          headers: { brandId: String(brandId) },
        });
        toast.success("MultiJackpot deleted");
      }
      await refreshAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? err?.message ?? "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  const runAction = (row: UnifiedRow, op: "enable" | "disable" | "clone" | "delete") =>
    row.kind === "group" ? actGroup(row, op) : actSingle(row, op);

  const goView = (row: UnifiedRow) => {
    if (row.kind === "group") {
      navigate({ to: "/admin/jackpot-groups/$id", params: { id: String(row.id) } });
    } else {
      // single jackpot detail not implemented — open editor via wizard if applicable
      navigate({ to: "/admin/jackpots/new", search: { editId: row.id } as any });
    }
  };

  const goEdit = (row: UnifiedRow) => {
    if (row.kind === "group") {
      navigate({ to: "/admin/jackpot-groups/$id", params: { id: String(row.id) } });
    } else {
      navigate({ to: "/admin/jackpots/new", search: { editId: row.id } as any });
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <main className="max-w-[1200px] mx-auto px-6 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Jackpot Dashboard</h1>
            <p className="text-neutral-400 mt-1 text-sm">Manage and monitor all your jackpots</p>
          </div>
          <Link to="/admin/jackpots/new">
            <Button size="lg" className="gap-2 bg-blue-500 hover:bg-blue-600 text-white">
              <Plus className="w-5 h-5" />
              Create New Jackpot
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-4 gap-6">
          <Card className="p-6 bg-neutral-900/50 border-neutral-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-400">Total Jackpots</p>
                <p className="text-3xl font-semibold mt-2 text-white">{rows.length}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center text-2xl">🎰</div>
            </div>
          </Card>
          <Card className="p-6 bg-neutral-900/50 border-neutral-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-400">Current Pool Value</p>
                <p className="text-3xl font-semibold mt-2 text-white">{formatCurrency(totalCurrentValue)}</p>
                <p className="text-[10px] text-neutral-500 mt-1">page total · single jackpots</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center text-2xl">💰</div>
            </div>
          </Card>
          <Card className="p-6 bg-neutral-900/50 border-neutral-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-400">Total Payouts</p>
                <p className="text-3xl font-semibold mt-2 text-white">—</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center text-2xl">💎</div>
            </div>
          </Card>
          <Card className="p-6 bg-neutral-900/50 border-neutral-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-400">Total Wins</p>
                <p className="text-3xl font-semibold mt-2 text-white">—</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center text-2xl">🏆</div>
            </div>
          </Card>
        </div>

        <div className="flex items-center justify-between gap-6 flex-wrap">
          <div className="flex items-center gap-3">
            {([
              ["all", `All (${counts.all})`],
              ["active", `Active (${counts.active})`],
              ["draft", `Draft (${counts.draft})`],
              ["disabled", `Disabled (${counts.disabled})`],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === key
                    ? "bg-blue-500 text-white"
                    : "bg-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <Input
              placeholder="Search jackpots..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-neutral-800 border-neutral-700 text-neutral-100 placeholder:text-neutral-500"
            />
          </div>
        </div>

        <Card className="bg-neutral-900/50 border-neutral-800 overflow-hidden">
          {isError && (
            <div className="p-4 text-red-400 text-sm">
              Failed to load jackpots: {(error as Error)?.message}
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-700">
                  <th className="text-left px-6 py-4 text-sm font-medium text-neutral-400">Name</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-neutral-400">Type</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-neutral-400">Status</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-neutral-400">Current Value</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-neutral-400">Created</th>
                  <th className="text-center px-6 py-4 text-sm font-medium text-neutral-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(isLoading || groupsQuery.isLoading) && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-neutral-500">Loading…</td>
                  </tr>
                )}
                {!isLoading && !groupsQuery.isLoading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="text-neutral-500">
                        <p className="text-lg">No jackpots found</p>
                        <p className="text-sm mt-1">Try adjusting your filters or search query</p>
                      </div>
                    </td>
                  </tr>
                )}
                {filtered.map((r) => {
                  const created = r.createdAt ? r.createdAt.slice(0, 10) : "—";
                  const isActive = r.status === "active";
                  const isBusy = busyId === r.key;
                  return (
                    <tr key={r.key} className="border-b border-neutral-700/50 hover:bg-neutral-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {r.kind === "group" && <Layers className="w-4 h-4 text-blue-400" />}
                          <span className="font-medium text-neutral-100">{r.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-neutral-400">{r.typeLabel}</span>
                      </td>
                      <td className="px-6 py-4"><StatusBadge status={r.status} /></td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-medium text-neutral-100">
                          {r.kind === "group" ? "—" : formatCurrency(r.poolBalance)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-400">{created}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => goView(r)}
                            className="h-8 px-3 text-neutral-200 hover:text-blue-400"
                          >
                            <Eye className="w-4 h-4 mr-1.5" /> View
                          </Button>
                          {isActive ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isBusy}
                              className="h-8 px-3 bg-black text-orange-400 border-orange-600/60 hover:bg-orange-950 hover:text-orange-300"
                              onClick={() => runAction(r, "disable")}
                            >
                              <Power className="w-3.5 h-3.5 mr-1.5" />
                              {isBusy ? "…" : "Disable"}
                            </Button>
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  disabled={isBusy}
                                  className="h-8 w-8 p-0 text-neutral-200 hover:text-blue-400"
                                  aria-label="More actions"
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="bg-neutral-900 border-neutral-700 text-neutral-100"
                              >
                                <DropdownMenuItem onClick={() => goEdit(r)}>
                                  <Edit className="w-4 h-4 mr-2" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => runAction(r, "enable")}>
                                  <Power className="w-4 h-4 mr-2" /> Enable
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => runAction(r, "clone")}>
                                  <Copy className="w-4 h-4 mr-2" /> Clone
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-neutral-700" />
                                <DropdownMenuItem
                                  onClick={() => setConfirm(r)}
                                  className="text-red-400 focus:text-red-300 focus:bg-red-500/10"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="flex items-center justify-between gap-4 text-sm text-neutral-500">
          <div>
            {data
              ? `Showing ${filtered.length} of ${rows.length} jackpots${isFetching ? " · refreshing…" : ""}`
              : "—"}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-neutral-500">Page size</label>
            <select
              value={size}
              onChange={(e) => { setSize(Number(e.target.value)); setPage(0); }}
              className="bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-md px-2 py-1 text-xs"
            >
              {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <button onClick={() => setPage(0)} disabled={!data || data.first}
              className="px-2 py-1 rounded-md border border-neutral-700 bg-neutral-800 text-neutral-300 disabled:opacity-40 text-xs">« First</button>
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={!data || data.first}
              className="px-2 py-1 rounded-md border border-neutral-700 bg-neutral-800 text-neutral-300 disabled:opacity-40 text-xs">‹ Prev</button>
            <span className="min-w-[90px] text-center text-xs">
              Page {(data?.number ?? page) + 1} of {data?.totalPages || 1}
            </span>
            <button onClick={() => setPage((p) => p + 1)} disabled={!data || data.last}
              className="px-2 py-1 rounded-md border border-neutral-700 bg-neutral-800 text-neutral-300 disabled:opacity-40 text-xs">Next ›</button>
            <button onClick={() => data && setPage(Math.max(0, data.totalPages - 1))} disabled={!data || data.last}
              className="px-2 py-1 rounded-md border border-neutral-700 bg-neutral-800 text-neutral-300 disabled:opacity-40 text-xs">Last »</button>
          </div>
        </div>
      </main>

      <AlertDialog open={confirm != null} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent className="bg-neutral-900 border-neutral-700 text-neutral-100">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {confirm?.kind === "group" ? "MultiJackpot" : "Jackpot"}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-400">
              This permanently removes <span className="font-semibold text-neutral-200">{confirm?.name}</span>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-neutral-800 border-neutral-700 hover:bg-neutral-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={async () => {
                if (!confirm) return;
                const row = confirm;
                setConfirm(null);
                await runAction(row, "delete");
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export const Route = createFileRoute("/admin/jackpots/")({
  ssr: false,
  component: JackpotsPage,
});
