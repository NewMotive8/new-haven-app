import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Zap, Flame, TrendingUp, Trophy, Gem } from "lucide-react";

/* Logarithmic interval slider helpers (Pure Chance) — 1k–10M spins. */
export const MIN_SPINS = 1000;
export const MAX_SPINS = 10_000_000;
const LOG_MIN = Math.log10(MIN_SPINS);
const LOG_MAX = Math.log10(MAX_SPINS);

export function sliderToSpins(pct: number): number {
  const t = Math.min(1, Math.max(0, pct / 100));
  const v = Math.pow(10, LOG_MIN + (LOG_MAX - LOG_MIN) * t);
  return Math.round(v / 100) * 100;
}
export function spinsToSlider(n: number): number {
  const clamped = Math.min(MAX_SPINS, Math.max(MIN_SPINS, n || MIN_SPINS));
  const t = (Math.log10(clamped) - LOG_MIN) / (LOG_MAX - LOG_MIN);
  return Math.round(t * 1000) / 10;
}

export function pickPureChanceVibe(spins: number) {
  const n = spins.toLocaleString();
  if (spins < 10_000)
    return {
      Icon: Zap,
      label: "⚡ Rapid-Fire Mode",
      chip: "bg-yellow-400/15 text-yellow-200 border-yellow-400/40",
      copy: `Expect a hit roughly every ${n} spins network-wide. Ideal for ultra-high engagement or promotional happy hours.`,
    };
  if (spins < 100_000)
    return {
      Icon: Flame,
      label: "🔥 Action-Packed",
      chip: "bg-orange-400/15 text-orange-200 border-orange-400/40",
      copy: `Expect a hit roughly every ${n} spins network-wide. Perfect for keeping players glued during peak weekend traffic windows.`,
    };
  if (spins < 500_000)
    return {
      Icon: TrendingUp,
      label: "📈 Daily Driver",
      chip: "bg-blue-400/15 text-blue-200 border-blue-400/40",
      copy: `Expect a hit roughly every ${n} spins network-wide. This provides a classic, steady promotional heartbeat across your games.`,
    };
  if (spins < 2_500_000)
    return {
      Icon: Trophy,
      label: "🏆 Major Milestone",
      chip: "bg-amber-400/15 text-amber-200 border-amber-400/40",
      copy: `Expect a rare, high-anticipation drop roughly every ${n} spins network-wide. Builds significant community buzz.`,
    };
  return {
    Icon: Gem,
    label: "💎 The Mega Event",
    chip: "bg-fuchsia-400/15 text-fuchsia-200 border-fuchsia-400/40",
    copy: `An ultra-rare, legendary network event. Expect a drop roughly once every ${n} spins network-wide. This is your headline-grabbing marketing campaign.`,
  };
}

/**
 * Shared Pure-Chance Trigger Probability panel.
 * Used by both single-jackpot creation and Multi-Jackpot tier creation
 * so the two flows stay visually + behaviorally identical.
 */
export function TriggerProbabilityPanel({
  value,
  onChange,
}: {
  value: number;
  onChange: (next: number) => void;
}) {
  const spins = Math.max(1, Math.trunc(Number(value) || 1));
  const vibe = pickPureChanceVibe(spins);
  const sliderPct = spinsToSlider(spins);
  const VibeIcon = vibe.Icon;
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-950/50 p-5 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-end">
        <div className="space-y-2">
          <Label className="text-neutral-400 text-xs uppercase tracking-wider">
            Drop Pace
          </Label>
          <p className="text-sm text-neutral-300">
            How often do you want players to win? Move the slider to set the target number of total spins needed to trigger a drop.
          </p>
          <Slider
            value={[sliderPct]}
            min={0}
            max={100}
            step={0.1}
            onValueChange={(v) => onChange(sliderToSpins(v[0] ?? 0))}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-neutral-300 text-sm">1 in</span>
          <Input
            type="number"
            inputMode="numeric"
            min={MIN_SPINS}
            max={MAX_SPINS}
            step={100}
            value={value || ""}
            onChange={(e) => {
              const raw = parseInt(e.target.value.slice(0, 8)) || 0;
              onChange(Math.max(0, Math.min(MAX_SPINS, raw)));
            }}
            className="bg-neutral-800 border-neutral-700 text-white font-mono h-10 w-32"
          />
          <span className="text-neutral-300 text-sm">spins</span>
        </div>
      </div>
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs ${vibe.chip}`}
      >
        <VibeIcon className="w-3.5 h-3.5" />
        {vibe.label}
      </div>
      <div className="text-sm text-neutral-300">{vibe.copy}</div>
      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300">
        <span className="font-semibold">RNG Boundary Limit:</span> Max 10,000,000
      </div>
    </div>
  );
}
