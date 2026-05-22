import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Search, X, Layers3, Gamepad2, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  MASTER_CATEGORIES,
  type MasterCategory,
} from "@/lib/jackpot/master-categories";
import { searchGames, listGamesByIds, type GameDTO } from "@/lib/games.functions";

export interface GameAssignmentValue {
  assignedCategories: MasterCategory[];
  assignedGameIds: number[];
}

export interface GameAssignmentStepProps {
  value: GameAssignmentValue;
  onChange: (next: GameAssignmentValue) => void;
  disabled?: boolean;
}

function useDebounced<T>(value: T, ms = 250): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export function GameAssignmentStep({
  value,
  onChange,
  disabled = false,
}: GameAssignmentStepProps) {
  const callSearch = useServerFn(searchGames);
  const callListByIds = useServerFn(listGamesByIds);

  const [q, setQ] = React.useState("");
  const debouncedQ = useDebounced(q, 250);
  const [open, setOpen] = React.useState(false);

  // Hydrate already-selected chips
  const idsKey = React.useMemo(
    () => [...value.assignedGameIds].sort((a, b) => a - b).join(","),
    [value.assignedGameIds],
  );
  const selectedQuery = useQuery({
    queryKey: ["games-by-ids", idsKey],
    queryFn: () => callListByIds({ data: { ids: value.assignedGameIds } }),
    enabled: value.assignedGameIds.length > 0,
    staleTime: 60_000,
  });
  const selectedGames: GameDTO[] = selectedQuery.data ?? [];
  const selectedById = React.useMemo(() => {
    const m = new Map<number, GameDTO>();
    for (const g of selectedGames) m.set(g.id, g);
    return m;
  }, [selectedGames]);

  // Search query
  const searchQuery = useQuery({
    queryKey: ["games-search", debouncedQ, value.assignedCategories.join("|")],
    queryFn: () =>
      callSearch({
        data: {
          q: debouncedQ,
          categories: value.assignedCategories.length
            ? value.assignedCategories
            : undefined,
          limit: 15,
        },
      }),
    enabled: open && debouncedQ.trim().length >= 1,
    staleTime: 15_000,
  });

  function toggleCategory(cat: MasterCategory) {
    if (disabled) return;
    const has = value.assignedCategories.includes(cat);
    onChange({
      ...value,
      assignedCategories: has
        ? value.assignedCategories.filter((c) => c !== cat)
        : [...value.assignedCategories, cat],
    });
  }

  function addGame(g: GameDTO) {
    if (disabled) return;
    if (value.assignedGameIds.includes(g.id)) return;
    onChange({ ...value, assignedGameIds: [...value.assignedGameIds, g.id] });
  }

  function removeGame(id: number) {
    if (disabled) return;
    onChange({
      ...value,
      assignedGameIds: value.assignedGameIds.filter((x) => x !== id),
    });
  }

  return (
    <Card className="p-6 bg-neutral-900/60 border-neutral-800 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-emerald-300/80 mb-1">
            <Layers3 className="w-3.5 h-3.5" /> Game Assignment
          </div>
          <h3 className="text-lg font-semibold text-white">
            Where does this jackpot apply?
          </h3>
          <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
            Target whole master categories, or pick specific games from the
            internal catalog. Both can be combined.
          </p>
        </div>
        {disabled && (
          <Badge variant="outline" className="border-amber-400/40 text-amber-200 bg-amber-400/10 gap-1">
            <Lock className="w-3 h-3" /> Read-only
          </Badge>
        )}
      </div>

      {/* Master Categories */}
      <section className="space-y-3">
        <div className="text-xs font-medium uppercase tracking-wider text-neutral-400">
          Master Categories
        </div>
        <div className="flex flex-wrap gap-2">
          {MASTER_CATEGORIES.map((cat) => {
            const active = value.assignedCategories.includes(cat);
            return (
              <button
                key={cat}
                type="button"
                disabled={disabled}
                aria-pressed={active}
                onClick={() => toggleCategory(cat)}
                className={[
                  "px-3.5 py-2 rounded-full text-sm border transition-colors select-none",
                  disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
                  active
                    ? "bg-emerald-500/15 border-emerald-400/60 text-emerald-100"
                    : "bg-neutral-800/60 border-neutral-700 text-neutral-300 hover:bg-neutral-800",
                ].join(" ")}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </section>

      {/* Specific Game Search */}
      <section className="space-y-3">
        <div className="text-xs font-medium uppercase tracking-wider text-neutral-400 flex items-center gap-2">
          <Gamepad2 className="w-3.5 h-3.5" /> Specific Games (optional)
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
          <Input
            value={q}
            disabled={disabled}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => {
              // Delay so result clicks register before close.
              setTimeout(() => setOpen(false), 150);
            }}
            placeholder="Search games by name…"
            className="pl-9 bg-neutral-800 border-neutral-700 text-white h-11"
          />

          {open && !disabled && debouncedQ.trim().length >= 1 && (
            <div className="absolute z-30 mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 shadow-xl max-h-72 overflow-auto">
              {searchQuery.isLoading && (
                <div className="px-3 py-3 text-sm text-neutral-400">Searching…</div>
              )}
              {!searchQuery.isLoading &&
                (searchQuery.data?.length ?? 0) === 0 && (
                  <div className="px-3 py-3 text-sm text-neutral-500">
                    No matches.
                  </div>
                )}
              {searchQuery.data?.map((g) => {
                const already = value.assignedGameIds.includes(g.id);
                return (
                  <button
                    key={g.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => addGame(g)}
                    disabled={already}
                    className={[
                      "w-full text-left px-3 py-2 flex items-center justify-between gap-3 text-sm border-b border-neutral-800/60 last:border-b-0",
                      already
                        ? "opacity-50 cursor-default"
                        : "hover:bg-neutral-800/70 text-neutral-100",
                    ].join(" ")}
                  >
                    <div className="min-w-0">
                      <div className="truncate">{g.name}</div>
                      <div className="text-xs text-neutral-500 truncate">
                        {g.masterCategory} · {g.provider}
                      </div>
                    </div>
                    {already && (
                      <span className="text-xs text-emerald-300">Added</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 min-h-[2rem]">
          {value.assignedGameIds.length === 0 && (
            <span className="text-xs text-neutral-500">
              No specific games selected.
            </span>
          )}
          {value.assignedGameIds.map((id) => {
            const g = selectedById.get(id);
            const label = g
              ? g.name
              : selectedQuery.isLoading
                ? "Loading…"
                : `Game #${id}`;
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-md border border-emerald-400/30 bg-emerald-500/10 text-emerald-100 text-xs"
              >
                {label}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => removeGame(id)}
                    className="rounded hover:bg-emerald-500/20 p-0.5"
                    aria-label={`Remove ${label}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            );
          })}
        </div>
      </section>
    </Card>
  );
}

export default GameAssignmentStep;
