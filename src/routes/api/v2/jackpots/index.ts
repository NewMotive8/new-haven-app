import { createFileRoute } from "@tanstack/react-router";
import { json, preflight, requireBrandId } from "@/lib/jackpot/http";
import { listJackpotsPaged } from "@/lib/jackpot/store.server";

function parseSort(sort: string): { field: string; dir: "asc" | "desc" } {
  const [rawField = "id", rawDir = "asc"] = sort.split(",").map((s) => s.trim());
  const dir = rawDir.toLowerCase() === "desc" ? "desc" : "asc";
  return { field: rawField, dir };
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
        const { field, dir } = parseSort(url.searchParams.get("sort") ?? "id,asc");

        const { content, totalElements } = await listJackpotsPaged({
          brandId: brand,
          filterExp,
          page,
          size,
          sortField: field,
          sortDir: dir,
        });

        const totalPages = totalElements === 0 ? 0 : Math.ceil(totalElements / size);
        const numberOfElements = content.length;

        return json({
          content,
          pageable: { pageNumber: page, pageSize: size },
          totalElements,
          totalPages,
          last: page >= totalPages - 1,
          size,
          number: page,
          first: page === 0,
          numberOfElements,
          empty: numberOfElements === 0,
        });
      },
    },
  },
});
