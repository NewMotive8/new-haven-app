import { createFileRoute } from "@tanstack/react-router";
import { json, preflight, requireBrandId } from "@/lib/jackpot/http";
import { listJackpots } from "@/lib/jackpot/store.server";
import type { JackpotDTO } from "@/lib/jackpot/types";

type SortDir = "asc" | "desc";

function parseSort(sort: string): { field: keyof JackpotDTO; dir: SortDir } {
  const [rawField = "id", rawDir = "asc"] = sort.split(",").map((s) => s.trim());
  const dir: SortDir = rawDir.toLowerCase() === "desc" ? "desc" : "asc";
  return { field: rawField as keyof JackpotDTO, dir };
}

function compare(a: any, b: any): number {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b));
}

export const Route = createFileRoute("/api/v2/jackpots/")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async ({ request }) => {
        const brand = requireBrandId(request);
        if (brand instanceof Response) return brand;

        const url = new URL(request.url);
        const filterExp = url.searchParams.get("filterExp");
        const page = Math.max(0, parseInt(url.searchParams.get("page") ?? "0", 10) || 0);
        const sizeRaw = parseInt(url.searchParams.get("size") ?? "20", 10);
        const size = Math.max(1, Number.isFinite(sizeRaw) ? sizeRaw : 20);
        const sortParam = url.searchParams.get("sort") ?? "id,asc";

        const all = listJackpots(brand, filterExp);

        const { field, dir } = parseSort(sortParam);
        const sorted = [...all].sort((a, b) => {
          const c = compare((a as any)[field], (b as any)[field]);
          return dir === "asc" ? c : -c;
        });

        const totalElements = sorted.length;
        const totalPages = totalElements === 0 ? 0 : Math.ceil(totalElements / size);
        const start = page * size;
        const content = sorted.slice(start, start + size);
        const numberOfElements = content.length;
        const last = page >= totalPages - 1;
        const first = page === 0;

        return json({
          content,
          pageable: {
            pageNumber: page,
            pageSize: size,
          },
          totalElements,
          totalPages,
          last,
          size,
          number: page,
          first,
          numberOfElements,
          empty: numberOfElements === 0,
        });
      },
    },
  },
});
