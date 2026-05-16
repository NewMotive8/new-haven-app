import { createFileRoute, Link } from "@tanstack/react-router";
import * as React from "react";
import axios from "axios";
import { useQuery } from "react-query";
import { BrandContext } from "../backoffice/app";
import type { JackpotDTO } from "@/lib/jackpot/types";

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

const cell: React.CSSProperties = { padding: "10px 14px", borderBottom: "1px solid #1f2a44", fontSize: 14 };
const head: React.CSSProperties = { ...cell, textAlign: "left", color: "#9fb0c8", fontWeight: 600, background: "#0f172a", position: "sticky", top: 0 };

function JackpotsPage() {
  const { brandId, currentBrand } = React.useContext(BrandContext);
  const [page, setPage] = React.useState(0);
  const [size, setSize] = React.useState(20);

  const { data, isLoading, isError, error, isFetching } = useJackpotsPage(brandId, page, size);

  return (
    <div style={{ padding: "28px", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26 }}>Jackpots</h1>
          <p style={{ margin: "4px 0 0", color: "#9fb0c8", fontSize: 13 }}>
            Brand: <code>{currentBrand?.name ?? "—"}</code> (id {String(brandId ?? "—")}) • GET /api/v2/jackpots
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <label style={{ fontSize: 13, color: "#9fb0c8" }}>Page size</label>
          <select
            value={size}
            onChange={(e) => {
              setSize(Number(e.target.value));
              setPage(0);
            }}
            style={{ background: "#0f172a", color: "#e6edf3", border: "1px solid #1f2a44", padding: "6px 10px", borderRadius: 6 }}
          >
            {[5, 10, 20, 50].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ background: "#0f172a", border: "1px solid #1f2a44", borderRadius: 10, overflow: "hidden" }}>
        {isError && (
          <div style={{ padding: 16, color: "#f87171" }}>
            Failed to load jackpots: {(error as Error)?.message}
          </div>
        )}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={head}>ID</th>
                <th style={head}>Name</th>
                <th style={head}>Enabled</th>
                <th style={head}>Pool</th>
                <th style={head}>Seed</th>
                <th style={head}>Contribution</th>
                <th style={head}>Trigger</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={7} style={{ ...cell, textAlign: "center", color: "#9fb0c8" }}>Loading…</td>
                </tr>
              )}
              {!isLoading && data?.empty && (
                <tr>
                  <td colSpan={7} style={{ ...cell, textAlign: "center", color: "#9fb0c8" }}>No jackpots</td>
                </tr>
              )}
              {data?.content.map((j) => (
                <tr key={j.id}>
                  <td style={cell}>{j.id}</td>
                  <td style={cell}>{j.name}</td>
                  <td style={cell}>
                    <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 12, background: j.enabled ? "#14532d" : "#3f1d1d", color: j.enabled ? "#86efac" : "#fca5a5" }}>
                      {j.enabled ? "enabled" : "disabled"}
                    </span>
                  </td>
                  <td style={cell}>{j.poolBalance}</td>
                  <td style={cell}>{j.seedAmount}</td>
                  <td style={cell}>{j.contributionRate}</td>
                  <td style={cell}>{j.triggerThreshold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderTop: "1px solid #1f2a44", fontSize: 13, color: "#9fb0c8" }}>
          <div>
            {data
              ? `Showing ${data.numberOfElements ? page * size + 1 : 0}–${page * size + (data.numberOfElements ?? 0)} of ${data.totalElements}`
              : "—"}
            {isFetching && " · refreshing…"}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={() => setPage(0)}
              disabled={!data || data.first}
              style={btn(!data || data.first)}
            >
              « First
            </button>
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={!data || data.first}
              style={btn(!data || data.first)}
            >
              ‹ Prev
            </button>
            <span style={{ minWidth: 110, textAlign: "center" }}>
              Page {(data?.number ?? page) + 1} of {data?.totalPages || 1}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!data || data.last}
              style={btn(!data || data.last)}
            >
              Next ›
            </button>
            <button
              onClick={() => data && setPage(Math.max(0, data.totalPages - 1))}
              disabled={!data || data.last}
              style={btn(!data || data.last)}
            >
              Last »
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function btn(disabled: boolean): React.CSSProperties {
  return {
    background: disabled ? "#0b1220" : "#1e293b",
    color: disabled ? "#475569" : "#e6edf3",
    border: "1px solid #1f2a44",
    padding: "6px 10px",
    borderRadius: 6,
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: 13,
  };
}

export const Route = createFileRoute("/backoffice/jackpots")({
  ssr: false,
  component: JackpotsPage,
});
