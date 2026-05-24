import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { QaOverlay } from "@/components/demo/QaOverlay";

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

type Tile = {
  id: string;
  name: string;
  category: string;
  gradient: string;
  emoji: string;
};

const GAMES: Tile[] = [
  { id: "stellar-rush", name: "Stellar Rush", category: "slots", gradient: "from-fuchsia-700 to-indigo-900", emoji: "✦" },
  { id: "gold-rush-7", name: "Gold Rush 7s", category: "slots", gradient: "from-amber-500 to-orange-800", emoji: "7" },
  { id: "neon-tigers", name: "Neon Tigers", category: "slots", gradient: "from-pink-600 to-purple-900", emoji: "🐅" },
  { id: "fortune-dragon", name: "Fortune Dragon", category: "slots", gradient: "from-red-700 to-amber-900", emoji: "🐉" },
  { id: "vegas-blackjack", name: "Vegas Blackjack", category: "table", gradient: "from-emerald-700 to-slate-900", emoji: "♠" },
  { id: "european-roulette", name: "European Roulette", category: "table", gradient: "from-rose-700 to-slate-900", emoji: "⭕" },
  { id: "baccarat-pro", name: "Baccarat Pro", category: "table", gradient: "from-cyan-700 to-slate-900", emoji: "♣" },
  { id: "lightning-poker", name: "Lightning Poker", category: "table", gradient: "from-yellow-600 to-slate-900", emoji: "♦" },
  { id: "live-mega-wheel", name: "Live Mega Wheel", category: "live", gradient: "from-violet-700 to-fuchsia-900", emoji: "🎡" },
  { id: "live-monopoly", name: "Live Monopoly", category: "live", gradient: "from-lime-600 to-emerald-900", emoji: "🎲" },
  { id: "crazy-time", name: "Crazy Time", category: "live", gradient: "from-orange-600 to-red-900", emoji: "⚡" },
  { id: "dream-catcher", name: "Dream Catcher", category: "live", gradient: "from-sky-700 to-indigo-900", emoji: "🌙" },
  { id: "buffalo-king", name: "Buffalo King", category: "slots", gradient: "from-amber-700 to-stone-900", emoji: "🦬" },
  { id: "pirate-bounty", name: "Pirate Bounty", category: "slots", gradient: "from-teal-700 to-slate-900", emoji: "🏴" },
  { id: "lucky-clover", name: "Lucky Clover", category: "slots", gradient: "from-green-600 to-emerald-900", emoji: "🍀" },
  { id: "starlight-spin", name: "Starlight Spin", category: "slots", gradient: "from-indigo-700 to-purple-950", emoji: "★" },
];

function DemoPage() {
  const [brandId, setBrandId] = useState<string>("1");
  const [activeTile, setActiveTile] = useState<Tile | null>(null);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(BRAND_KEY) : null;
    if (stored) setBrandId(stored);
  }, []);

  const saveBrand = (v: string) => {
    setBrandId(v);
    if (typeof window !== "undefined") localStorage.setItem(BRAND_KEY, v);
    setActiveTile(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-emerald-400">
              Operator Harness
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
          {GAMES.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setActiveTile(g)}
              className={`group relative aspect-[3/4] rounded-2xl overflow-hidden bg-gradient-to-br ${g.gradient}
                          border border-white/10 shadow-lg hover:shadow-2xl hover:-translate-y-1 hover:border-amber-400/60
                          transition-all`}
            >
              <div className="absolute inset-0 flex items-center justify-center text-7xl opacity-80 group-hover:scale-110 transition-transform">
                {g.emoji}
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-left">
                <div className="text-[10px] uppercase tracking-widest text-slate-300/80">
                  {g.category}
                </div>
                <div className="font-bold text-slate-50">{g.name}</div>
              </div>
              <div className="absolute top-2 right-2 text-[10px] font-mono bg-black/40 text-slate-300 rounded px-1.5 py-0.5">
                {g.id}
              </div>
            </button>
          ))}
        </div>
      </main>

      <QaOverlay
        open={!!activeTile}
        brandId={brandId}
        initialGameId={activeTile?.id ?? ""}
        initialCategory={activeTile?.category ?? ""}
        onClose={() => setActiveTile(null)}
      />
    </div>
  );
}
