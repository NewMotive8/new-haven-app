import { createFileRoute, Link } from "@tanstack/react-router";
import * as React from "react";
import axios from "axios";
import { useQuery, useQueryClient } from "react-query";
import { Search, Plus, Edit, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
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

type StatusFilter = "all" | "active" | "template" | "disabled";

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

function rowStatus(j: JackpotDTO): "active" | "disabled" {
  return j.enabled ? "active" : "disabled";
}

function StatusBadge({ status }: { status: "active" | "template" | "disabled" }) {
  const styles = {
    active: "bg-green-500/10 text-green-400 border-green-500/30",
    template: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    disabled: "bg-neutral-500/10 text-neutral-400 border-neutral-500/30",
  } as const;
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function JackpotsPage() {
  const { brandId } = React.useContext(BrandContext);
  const queryClient = useQueryClient();
  const [page, setPage] = React.useState(0);
  const [size, setSize] = React.useState(50);
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [disablingId, setDisablingId] = React.useState<number | null>(null);

  const { data, isLoading, isError, error, isFetching } = useJackpotsPage(brandId, page, size);

  const jackpots = data?.content ?? [];

  const counts = React.useMemo(() => {
    const c = { all: jackpots.length, active: 0, template: 0, disabled: 0 };
    for (const j of jackpots) {
      if (j.enabled) c.active += 1;
      else c.disabled += 1;
    }
    return c;
  }, [jackpots]);

  const totalCurrentValue = React.useMemo(
    () => jackpots.filter((j) => j.enabled).reduce((sum, j) => sum + (j.poolBalance ?? 0), 0),
    [jackpots],
  );

  const filtered = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return jackpots.filter((j) => {
      const status = rowStatus(j);
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "template" ? false : status === statusFilter);
      if (!matchStatus) return false;
      if (!q) return true;
      const typeLabel = j.jackpotType ? KIND_LABEL[j.jackpotType] : "Classic";
      return (
        j.name.toLowerCase().includes(q) ||
        typeLabel.toLowerCase().includes(q)
      );
    });
  }, [jackpots, statusFilter, searchQuery]);

  const handleDisable = async (jackpotId: number) => {
    setDisablingId(jackpotId);
    try {
      await axios.get(`/api/v1/jackpots/disable/${jackpotId}`, {
        headers: { brandId: String(brandId) },
      });
      await queryClient.invalidateQueries(["v2-jackpots"]);
    } catch (err) {
      console.error("Failed to disable jackpot", err);
    } finally {
      setDisablingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <main className="max-w-[1200px] mx-auto px-6 py-8 space-y-8">
        {/* Page Header */}
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

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-6">
          <Card className="p-6 bg-neutral-900/50 border-neutral-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-400">Total Jackpots</p>
                <p className="text-3xl font-semibold mt-2 text-white">
                  {data?.totalElements ?? "—"}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center text-2xl">
                🎰
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-neutral-900/50 border-neutral-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-400">Current Pool Value</p>
                <p className="text-3xl font-semibold mt-2 text-white">
                  {formatCurrency(totalCurrentValue)}
                </p>
                <p className="text-[10px] text-neutral-500 mt-1">page total</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center text-2xl">
                💰
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-neutral-900/50 border-neutral-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-400">Total Payouts</p>
                <p className="text-3xl font-semibold mt-2 text-white">—</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center text-2xl">
                💎
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-neutral-900/50 border-neutral-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-400">Total Wins</p>
                <p className="text-3xl font-semibold mt-2 text-white">—</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center text-2xl">
                🏆
              </div>
            </div>
          </Card>
        </div>

        {/* Filters + Search */}
        <div className="flex items-center justify-between gap-6 flex-wrap">
          <div className="flex items-center gap-3">
            {([
              ["all", `All (${counts.all})`],
              ["active", `Active (${counts.active})`],
              ["template", `Template (${counts.template})`],
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

        {/* Table */}
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
                  <th className="text-right px-6 py-4 text-sm font-medium text-neutral-400">Total Wins</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-neutral-400">Total Payout</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-neutral-400">Last Win</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-neutral-400">Created</th>
                  <th className="text-center px-6 py-4 text-sm font-medium text-neutral-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-neutral-500">
                      Loading…
                    </td>
                  </tr>
                )}
                {!isLoading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center">
                      <div className="text-neutral-500">
                        <p className="text-lg">No jackpots found</p>
                        <p className="text-sm mt-1">Try adjusting your filters or search query</p>
                      </div>
                    </td>
                  </tr>
                )}
                {filtered.map((j) => {
                  const status = rowStatus(j);
                  const typeLabel = j.jackpotType ? KIND_LABEL[j.jackpotType] : "Classic";
                  const created = j.createdAt ? j.createdAt.slice(0, 10) : "—";
                  return (
                    <tr
                      key={j.id}
                      className="border-b border-neutral-700/50 hover:bg-neutral-800/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="font-medium text-neutral-100">{j.name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-neutral-400">{typeLabel}</span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-medium text-neutral-100">
                          {formatCurrency(j.poolBalance ?? 0)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-neutral-500">—</td>
                      <td className="px-6 py-4 text-right text-neutral-500">—</td>
                      <td className="px-6 py-4 text-sm text-neutral-500">—</td>
                      <td className="px-6 py-4 text-sm text-neutral-400">{created}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {status === "active" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={disablingId === j.id}
                              className="h-8 px-3 bg-black text-orange-500 border-orange-600 hover:bg-orange-950 hover:text-orange-400"
                              onClick={() => handleDisable(j.id)}
                            >
                              {disablingId === j.id ? "…" : "Disable"}
                            </Button>
                          ) : (
                            <>
                              {/* TODO: wire Edit / Copy / Delete actions when detail route exists */}
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-white hover:text-blue-400">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-white hover:text-blue-400">
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-white hover:text-red-400">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
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

        {/* Footer: results + pagination */}
        <div className="flex items-center justify-between gap-4 text-sm text-neutral-500">
          <div>
            {data
              ? `Showing ${filtered.length} of ${data.totalElements} jackpots${isFetching ? " · refreshing…" : ""}`
              : "—"}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-neutral-500">Page size</label>
            <select
              value={size}
              onChange={(e) => {
                setSize(Number(e.target.value));
                setPage(0);
              }}
              className="bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-md px-2 py-1 text-xs"
            >
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <button
              onClick={() => setPage(0)}
              disabled={!data || data.first}
              className="px-2 py-1 rounded-md border border-neutral-700 bg-neutral-800 text-neutral-300 disabled:opacity-40 text-xs"
            >
              « First
            </button>
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={!data || data.first}
              className="px-2 py-1 rounded-md border border-neutral-700 bg-neutral-800 text-neutral-300 disabled:opacity-40 text-xs"
            >
              ‹ Prev
            </button>
            <span className="min-w-[90px] text-center text-xs">
              Page {(data?.number ?? page) + 1} of {data?.totalPages || 1}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!data || data.last}
              className="px-2 py-1 rounded-md border border-neutral-700 bg-neutral-800 text-neutral-300 disabled:opacity-40 text-xs"
            >
              Next ›
            </button>
            <button
              onClick={() => data && setPage(Math.max(0, data.totalPages - 1))}
              disabled={!data || data.last}
              className="px-2 py-1 rounded-md border border-neutral-700 bg-neutral-800 text-neutral-300 disabled:opacity-40 text-xs"
            >
              Last »
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export const Route = createFileRoute("/admin/jackpots")({
  ssr: false,
  component: JackpotsPage,
});
