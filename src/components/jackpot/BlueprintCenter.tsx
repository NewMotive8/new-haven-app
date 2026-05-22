import * as React from "react";
import axios from "axios";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import {
  Sparkles, Copy, Zap, Save, Library, Crown, Layers, Flame, X,
} from "lucide-react";
import {
  Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,
} from "@/components/ui/accordion";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { BrandContext } from "@/backoffice/app";
import { buildCreateBody } from "@/lib/jackpot/build-create-body";
import { mapPayloadToConfig } from "@/lib/jackpot/payload-to-config";
import type { JackpotConfigDTO } from "@/lib/jackpot/types";
import {
  BLUEPRINTS,
  type Blueprint,
  type SingleBlueprint,
  type MultiBlueprint,
  type TrafficTier,
} from "@/lib/jackpot/blueprints";

export type BlueprintHost = "simulator" | "wizard";

interface Props {
  host: BlueprintHost;
  /** Called when a single-kind blueprint is "Played in Sandbox". */
  onInjectSingle?: (config: JackpotConfigDTO) => void;
}

const TIER_LABEL: Record<TrafficTier, string> = {
  high: "High Traffic",
  medium: "Medium Traffic",
  small: "Small Traffic",
};

const VIBE_STYLES: Record<string, string> = {
  "Rapid-Fire": "bg-rose-500/15 text-rose-300 border-rose-500/40",
  "Action-Packed": "bg-orange-500/15 text-orange-300 border-orange-500/40",
  "Daily Driver": "bg-sky-500/15 text-sky-300 border-sky-500/40",
  "Marathon": "bg-indigo-500/15 text-indigo-300 border-indigo-500/40",
  "Cap Hunter": "bg-amber-500/15 text-amber-300 border-amber-500/40",
  "Time-Boxed": "bg-violet-500/15 text-violet-300 border-violet-500/40",
  "Network Mega": "bg-cyan-500/15 text-cyan-200 border-cyan-500/40",
  "Community Spark": "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
  "Loyalty Booster": "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/40",
  "Power Hour": "bg-yellow-500/15 text-yellow-300 border-yellow-500/40",
  "Weekend Rush": "bg-pink-500/15 text-pink-300 border-pink-500/40",
  "Coin Escape": "bg-lime-500/15 text-lime-300 border-lime-500/40",
};

function dropPacingLabel(n?: number): "fast" | "balanced" | "slow" {
  if (n == null) return "balanced";
  if (n <= 5) return "fast";
  if (n <= 7) return "balanced";
  return "slow";
}

function rawJsonFor(bp: Blueprint): string {
  if (bp.kind === "single") return JSON.stringify(bp.payload, null, 2);
  return JSON.stringify({ group: bp.group, tiers: bp.tiers }, null, 2);
}

export function BlueprintCenter({ host, onInjectSingle }: Props) {
  const [open, setOpen] = React.useState(false);
  const [activeTier, setActiveTier] = React.useState<TrafficTier>("high");
  const [cloneTarget, setCloneTarget] = React.useState<Blueprint | null>(null);
  const navigate = useNavigate();
  const { brandId } = React.useContext(BrandContext);

  function handleSandbox(bp: Blueprint) {
    if (bp.kind === "single") {
      try {
        const cfg = mapPayloadToConfig(bp.payload);
        if (host === "simulator" && onInjectSingle) {
          onInjectSingle(cfg);
          toast.success(`Injected "${bp.name}" into sandbox`);
          setOpen(false);
        } else {
          // wizard host — round-trip via /admin/jackpots/new with state
          try {
            sessionStorage.setItem(
              "jackpot:pendingPayload",
              JSON.stringify(bp.payload),
            );
          } catch { /* noop */ }
          navigate({ to: "/admin/jackpots/new" });
          setOpen(false);
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to inject blueprint");
      }
      return;
    }
    // Multi blueprint → must run in MultiJackpot wizard.
    try {
      sessionStorage.setItem(
        "jackpot:pendingMultiBlueprint",
        JSON.stringify(bp),
      );
    } catch { /* noop */ }
    toast.info("Multi blueprints open in the MultiJackpot wizard.");
    navigate({ to: "/admin/jackpots/new", search: { tab: "multi" } as never });
    setOpen(false);
  }

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="gap-2 bg-blue-600 text-white border-blue-600 hover:!bg-blue-600 hover:!text-white"
          >
            <Library className="h-4 w-4" />
            Optimization Blueprints
          </Button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl bg-neutral-950 border-l border-neutral-800 text-white overflow-y-auto"
        >
          <SheetHeader className="space-y-1 pr-12">
            <SheetTitle className="text-white text-xl flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-300" />
              Optimization Blueprints
            </SheetTitle>
            <SheetDescription className="text-neutral-400">
              12 pre-configured, house-profitable templates. Pick by operator scale,
              play in the sandbox, or clone straight into a draft campaign.
            </SheetDescription>
          </SheetHeader>

          <SheetClose
            aria-label="Close"
            className="absolute top-4 right-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-md bg-neutral-800 text-white border border-neutral-700 hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <X className="h-4 w-4" />
          </SheetClose>

          <Tabs
            value={activeTier}
            onValueChange={(v) => setActiveTier(v as TrafficTier)}
            className="mt-6"
          >
            <TabsList className="bg-neutral-900 border border-neutral-800 w-full grid grid-cols-3 h-10">
              <TabsTrigger value="high" className="text-xs bg-blue-600 text-white hover:!bg-blue-600 hover:!text-white data-[state=active]:!bg-white data-[state=active]:!text-neutral-900 data-[state=active]:font-semibold data-[state=active]:shadow-md data-[state=active]:ring-2 data-[state=active]:ring-indigo-400">High Traffic</TabsTrigger>
              <TabsTrigger value="medium" className="text-xs bg-blue-600 text-white hover:!bg-blue-600 hover:!text-white data-[state=active]:!bg-white data-[state=active]:!text-neutral-900 data-[state=active]:font-semibold data-[state=active]:shadow-md data-[state=active]:ring-2 data-[state=active]:ring-indigo-400">Medium Traffic</TabsTrigger>
              <TabsTrigger value="small" className="text-xs bg-blue-600 text-white hover:!bg-blue-600 hover:!text-white data-[state=active]:!bg-white data-[state=active]:!text-neutral-900 data-[state=active]:font-semibold data-[state=active]:shadow-md data-[state=active]:ring-2 data-[state=active]:ring-indigo-400">Small Traffic</TabsTrigger>
            </TabsList>

            {(["high", "medium", "small"] as TrafficTier[]).map((tier) => (
              <TabsContent key={tier} value={tier} className="mt-4 space-y-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                  {TIER_LABEL[tier]} · {BLUEPRINTS.filter((b) => b.tier === tier).length} blueprints
                </p>
                {BLUEPRINTS.filter((b) => b.tier === tier).map((bp) => (
                  <BlueprintCardView
                    key={bp.id}
                    bp={bp}
                    onSandbox={() => handleSandbox(bp)}
                    onClone={() => setCloneTarget(bp)}
                  />
                ))}
              </TabsContent>
            ))}
          </Tabs>
        </SheetContent>
      </Sheet>

      <CloneDraftDialog
        target={cloneTarget}
        onClose={() => setCloneTarget(null)}
        onDone={() => {
          setCloneTarget(null);
          setOpen(false);
        }}
        brandId={brandId}
      />
    </>
  );
}

function BlueprintCardView({
  bp,
  onSandbox,
  onClone,
}: {
  bp: Blueprint;
  onSandbox: () => void;
  onClone: () => void;
}) {
  const vibeClass = VIBE_STYLES[bp.vibe] ?? "bg-neutral-700/30 text-neutral-200";
  const KindIcon = bp.kind === "multi" ? Layers : Flame;
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-neutral-500">
            <KindIcon className="h-3 w-3" />
            {bp.kind === "multi" ? "MultiJackpot" : bp.payload.type.replace("_", " ")}
          </div>
          <h3 className="text-base font-semibold text-white truncate">{bp.name}</h3>
          <p className="text-xs text-neutral-400 leading-relaxed">{bp.objective}</p>
        </div>
        <Badge className={`shrink-0 border ${vibeClass}`}>{bp.vibe}</Badge>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {bp.targetGameTypes.map((g) => (
          <span
            key={g}
            className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700"
          >
            {g}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <Button
          size="sm"
          onClick={onSandbox}
          className="bg-indigo-500 hover:bg-indigo-400 text-white gap-1.5"
        >
          <Zap className="h-3.5 w-3.5" />
          Play in Sandbox
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onClone}
          className="border-emerald-500/40 text-emerald-200 hover:bg-emerald-500/10 gap-1.5"
        >
          <Save className="h-3.5 w-3.5" />
          Clone as Campaign Draft
        </Button>
      </div>

      <Accordion type="single" collapsible className="border-t border-neutral-800 pt-1">
        <AccordionItem value="json" className="border-none">
          <AccordionTrigger className="text-xs text-neutral-400 hover:text-white py-2">
            View Raw JSON Code
          </AccordionTrigger>
          <AccordionContent>
            <div className="relative">
              <pre className="max-h-72 overflow-auto text-[11px] font-mono leading-relaxed bg-neutral-950 border border-neutral-800 rounded-md p-3 text-emerald-200">
                {rawJsonFor(bp)}
              </pre>
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2 h-7 px-2 text-[11px] text-neutral-300 hover:text-white"
                onClick={() => {
                  void navigator.clipboard
                    .writeText(rawJsonFor(bp))
                    .then(() => toast.success("Copied to clipboard"))
                    .catch(() => toast.error("Copy failed"));
                }}
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy JSON
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

function CloneDraftDialog({
  target,
  onClose,
  onDone,
  brandId,
}: {
  target: Blueprint | null;
  onClose: () => void;
  onDone: () => void;
  brandId: number | null | undefined;
}) {
  const navigate = useNavigate();
  const [name, setName] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const open = target != null;

  React.useEffect(() => {
    if (target) {
      const suffix = ` (Draft ${new Date().toISOString().slice(11, 16)})`;
      setName(`${target.name}${suffix}`);
    }
  }, [target]);

  async function handleConfirm() {
    if (!target) return;
    if (brandId == null) {
      toast.error("No brand selected");
      return;
    }
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Name is required");
      return;
    }
    setSubmitting(true);
    try {
      if (target.kind === "single") {
        await cloneSingleDraft(target, trimmed, brandId, navigate);
      } else {
        await cloneMultiDraft(target, trimmed, brandId, navigate);
      }
      toast.success(`Draft "${trimmed}" created`);
      onDone();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string };
      toast.error(e?.response?.data?.error ?? e?.message ?? "Failed to create draft");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-neutral-950 border border-neutral-800 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-amber-300" />
            Clone as Campaign Draft
          </DialogTitle>
          <DialogDescription className="text-neutral-400">
            Saves an unactivated draft you can keep editing in the wizard.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="clone-name" className="text-white">Draft name</Label>
          <Input
            id="clone-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={submitting}
            className="bg-neutral-900 border-neutral-700 text-white"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={submitting}
            className="bg-emerald-500 hover:bg-emerald-400 text-white"
          >
            {submitting ? "Saving…" : "Create draft"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

async function cloneSingleDraft(
  bp: SingleBlueprint,
  name: string,
  brandId: number,
  navigate: ReturnType<typeof useNavigate>,
) {
  const payload = { ...bp.payload, name };
  const body = { ...buildCreateBody(payload), enabled: false };
  const res = await axios.post<{ id: number }>("/api/v1/jackpots", body, {
    headers: { brandId: String(brandId), "Content-Type": "application/json" },
  });
  const newId = res.data.id;
  navigate({
    to: "/admin/jackpots/new",
    search: { draftId: newId } as never,
  });
}

async function cloneMultiDraft(
  bp: MultiBlueprint,
  name: string,
  brandId: number,
  navigate: ReturnType<typeof useNavigate>,
) {
  // 1) Create the group — status defaults to "draft" server-side.
  const groupRes = await axios.post<{ id: number }>(
    "/api/v1/jackpot-groups",
    {
      name,
      overlappingRule: "split",
      contributionSource: "player",
      contributionType: bp.group.contributionType,
      masterContributionValue: bp.group.masterPlayerPercent / 100,
    },
    { headers: { brandId: String(brandId), "Content-Type": "application/json" } },
  );
  const groupId = groupRes.data.id;

  // 2) For each tier: create child jackpot + attach to group.
  for (const tier of bp.tiers) {
    const isClassic = tier.tierType === "classic";
    const triggerCondition: Record<string, unknown> = isClassic
      ? {
          triggerModel: "pure_chance",
          tierType: "classic",
          spinsInterval: tier.triggerOdds,
          triggerOdds: tier.triggerOdds,
        }
      : {
          triggerModel: "hype_curve",
          tierType: "must_drop",
          mustDrop: {
            minBoundary: tier.minBoundary ?? tier.seedAmount,
            maxBoundary: tier.maxWinAmount ?? tier.seedAmount * 4,
            dropPacing: dropPacingLabel(tier.dropPacing),
          },
        };

    const childRes = await axios.post<{ id: number }>(
      "/api/v1/jackpots",
      {
        name: `${name} · ${tier.tierName}`,
        enabled: false,
        seedAmount: tier.seedAmount,
        poolBalance: tier.seedAmount,
        triggerThreshold: tier.seedAmount * 2,
        config: {
          ...triggerCondition,
          tierType: tier.tierType,
          initialPoolAmount: tier.seedAmount,
          reseedingAmount: tier.reseedingAmount,
          contributionMode: "split",
          poolWeight: 60,
          seedWeight: 30,
          houseWeight: 10,
          ...(tier.maxWinAmount ? { maxWinAmount: tier.maxWinAmount } : {}),
        },
      },
      { headers: { brandId: String(brandId), "Content-Type": "application/json" } },
    );

    const probability = isClassic && tier.triggerOdds > 0 ? 1 / tier.triggerOdds : 0;
    await axios.post(
      `/api/v1/jackpot-groups/${groupId}/children`,
      {
        jackpotId: childRes.data.id,
        tierRank: tier.tierRank,
        triggerProbability: Number(probability.toFixed(8)),
        splitShare: tier.splitSharePct,
        name: tier.tierName,
      },
      { headers: { brandId: String(brandId), "Content-Type": "application/json" } },
    );
  }

  navigate({ to: "/admin/jackpot-groups/$id", params: { id: String(groupId) } });
}
