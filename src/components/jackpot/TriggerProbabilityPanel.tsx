import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Zap, Flame, TrendingUp, Trophy, Gem, Info } from "lucide-react";
import { BlockMath } from "react-katex";
import "katex/dist/katex.min.css";

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
    <div className="relative rounded-lg border border-neutral-800 bg-neutral-950/50 p-5 space-y-4">
      <div className="absolute top-3 right-3">
        <DropPaceInfoDialog />
      </div>
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

function DropPaceInfoDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="About Drop Pace"
          className="h-8 w-8 text-neutral-400 hover:text-white hover:bg-neutral-800"
        >
          <Info className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-neutral-950 border-neutral-800 text-neutral-200">
        <DialogHeader>
          <DialogTitle className="text-white">Drop Pace — Strategy Guide</DialogTitle>
          <DialogDescription className="text-neutral-400">
            How to estimate daily drops and pick the right vibe for your campaign.
          </DialogDescription>
        </DialogHeader>

        <section className="space-y-3">
          <h3 className="text-base font-semibold text-white">🔢 The Only Formula You Need</h3>
          <p className="text-sm leading-relaxed">
            Before touching the slider, you need a rough estimate of your{" "}
            <strong>Total Daily Network Spins</strong> (the combined number of spins all players
            make across the eligible games in a single day). Once you have that, use this simple
            formula to predict your daily drops:
          </p>
          <div className="rounded-md border border-neutral-800 bg-neutral-900/70 px-4 py-3 overflow-x-auto">
            <BlockMath math={"\\text{Expected Payouts Per Day} = \\frac{\\text{Total Daily Network Spins}}{\\text{Drop Pace (Target Spin Interval)}}"} />
          </div>
          <p className="text-sm leading-relaxed">
            <strong>Example:</strong> If your players generate 100,000 total spins a day on your
            selected games:
          </p>
          <ul className="list-disc list-inside text-sm space-y-1 text-neutral-300">
            <li>Setting the Drop Pace to <strong>25,000</strong> means you will average <strong>4 exciting drops a day</strong>.</li>
            <li>Setting the Drop Pace to <strong>1,000,000</strong> means you will average <strong>1 massive drop every 10 days</strong>.</li>
          </ul>
        </section>

        <section className="space-y-4 pt-2">
          <h3 className="text-base font-semibold text-white">🎯 The Drop Pace Menu: Matching the Vibe to the Goal</h3>

          {[
            {
              title: "⚡ Rapid-Fire Mode (Under 10,000 Spins)",
              goal: "Absolute chaos, high dopamine, and instant gratification.",
              used: "Flash promotional windows, mid-week \"Happy Hours,\" or launching a brand-new game where you want players to feel like wins are raining down.",
              strategy: "Use this when your target prize pool is smaller (or funded by virtual currencies/points) so you can sustain back-to-back triggers without burning your budget.",
            },
            {
              title: "🔥 Action-Packed (10,000 to 99,999 Spins)",
              goal: "High-density engagement during peak hours.",
              used: "Weekend tournament blocks (Friday evening to Sunday night).",
              strategy: "This is the sweet spot for keeping players glued to their screens during prime-time traffic. It guarantees multiple community wins during a single gaming session, creating organic social proof.",
            },
            {
              title: "📈 Daily Driver (100,000 to 499,999 Spins)",
              goal: "The steady, reliable heartbeat of your casino brand.",
              used: "Always-on, 24/7 evergreen jackpots that run in the background of your main slot categories.",
              strategy: "This is your standard baseline. It ensures that every single day, your marketing team has a real, high-value winner to highlight on your leaderboard banners and push notifications.",
            },
            {
              title: "🏆 Major Milestone (500,000 to 2,499,999 Spins)",
              goal: "High anticipation and community suspense.",
              used: "Month-long network campaigns or VIP/High-Roller specific game tiers.",
              strategy: "Because drops are rarer, the prize pool has time to swell to an eye-catching amount. Players will actively track this jackpot, waiting for it to get heavy before flooding your games.",
            },
            {
              title: "💎 The Mega Event (2,500,000 Spins and Above)",
              goal: "Headline-grabbing, viral player acquisition.",
              used: "Massive seasonal events (like a World Cup campaign or New Year's Eve mega-drop).",
              strategy: "This is your \"life-changing win\" category. It requires a massive spin interval because it is designed to build a giant, legendary pool that you can splash across your homepage, affiliate sites, and email acquisition campaigns.",
            },
          ].map((tier) => (
            <div
              key={tier.title}
              className="rounded-md border border-neutral-800 bg-neutral-900/40 p-3 space-y-1.5"
            >
              <h4 className="text-sm font-semibold text-white">{tier.title}</h4>
              <p className="text-sm"><span className="text-neutral-400">The Goal:</span> {tier.goal}</p>
              <p className="text-sm"><span className="text-neutral-400">Best Used For:</span> {tier.used}</p>
              <p className="text-sm"><span className="text-neutral-400">The Strategy:</span> {tier.strategy}</p>
            </div>
          ))}
        </section>
      </DialogContent>
    </Dialog>
  );
}
