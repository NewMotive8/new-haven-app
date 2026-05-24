import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { QaOverlay } from "@/components/demo/QaOverlay";
import { getMockCatalog, type MockGame } from "@/config/mockBrandCatalog";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "QA Demo — Live Operator Harness" },
      { name: "description", content: "Operator-style demo with real /api/v1/event/bet integration." },
    ],
  }),
  component: DemoPage,
});

const BRAND_KEY = "jackpot-brand-id";
const BRANDS = ["1", "2", "3", "4"];

// Deterministic decorative styling derived from category so the grid keeps
// its arcade aesthetic without baking visuals into the mock catalog.
const CATEGORY_STYLES: Record<string, { gradient: string; emoji: string }> = {
  Slots: { gradient: "from-fuchsia-700 to-indigo-900", emoji: "✦" },
  "Table Games": { gradient: "from-emerald-700 to-slate-900", emoji: "♠" },
  "Live Casino": { gradient: "from-violet-700 to-fuchsia-900", emoji: "🎡" },
  "Crash Games": { gradient: "from-orange-600 to-red-900", emoji: "⚡" },
  Sports: { gradient: "from-sky-700 to-indigo-900", emoji: "🏆" },
};
const DEFAULT_STYLE = { gradient: "from-slate-700 to-slate-900", emoji: "🎰" };


function DemoPage() {
  const [brandId, setBrandId] = useState<string>("1");
  const [activeTile, setActiveTile] = useState<MockGame | null>(null);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(BRAND_KEY) : null;
    if (stored) setBrandId(stored);
  }, []);

  const saveBrand = (v: string) => {
    setBrandId(v);
    if (typeof window !== "undefined") localStorage.setItem(BRAND_KEY, v);
    setActiveTile(null);
  };

  const games = useMemo(() => getMockCatalog(brandId), [brandId]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-emerald-400">
              Operator Harness · Brand {brandId}
            </div>
            <h1 className="text-2xl font-black">QA Demo</h1>
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-400">
            Brand
            <select
              value={brandId}
              onChange={(e) => saveBrand(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-slate-100 text-sm"
            >
              {BRANDS.map((b) => (
                <option key={b} value={b}>
                  Brand {b}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <p className="text-slate-400 text-sm mb-6">
          Click any game tile to open the QA configuration overlay. Each spin fires a real
          <code className="mx-1 px-1.5 py-0.5 rounded bg-slate-800 text-emerald-300">POST /api/v1/event/bet</code>
          against the production backend using the selected brand context.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {games.map((g) => {
            const style = CATEGORY_STYLES[g.category] ?? DEFAULT_STYLE;
            return (
              <button
                key={g.gameId}
                type="button"
                onClick={() => setActiveTile(g)}
                className={`group relative aspect-[3/4] rounded-2xl overflow-hidden bg-gradient-to-br ${style.gradient}
                            border border-white/10 shadow-lg hover:shadow-2xl hover:-translate-y-1 hover:border-amber-400/60
                            transition-all`}
              >
                <div className="absolute inset-0 flex items-center justify-center text-7xl opacity-80 group-hover:scale-110 transition-transform">
                  {style.emoji}
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-left">
                  <div className="text-[10px] uppercase tracking-widest text-slate-300/80 flex items-center justify-between gap-2">
                    <span>{g.category}</span>
                    <span className="text-slate-400/80 normal-case tracking-normal">{g.provider}</span>
                  </div>
                  <div className="font-bold text-slate-50">{g.name}</div>
                </div>
                <div className="absolute top-2 right-2 text-[10px] font-mono bg-black/40 text-slate-300 rounded px-1.5 py-0.5">
                  {g.gameId}
                </div>
              </button>
            );
          })}
        </div>
      </main>

      <QaOverlay
        open={!!activeTile}
        brandId={brandId}
        initialGameId={activeTile?.gameId ?? ""}
        initialCategory={activeTile?.category ?? ""}
        initialProvider={activeTile?.provider ?? ""}
        initialName={activeTile?.name ?? ""}
        onClose={() => setActiveTile(null)}
      />
    </div>
  );
}
