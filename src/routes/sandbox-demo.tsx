import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { applyCommunityPayout, type CommunityPayoutBreakdown } from "@/lib/jackpot/ledger";

export const Route = createFileRoute("/sandbox-demo")({
  component: SandboxDemoPage,
});

// ── Native widget text dictionary ───────────────────────────────────────────
const texts = {
  optInButton: "Opt in Jackpot",
  optOutButton: "Opt Out Jackpot",
  loading: "Loading...",
  userInLabel: "You are in, good luck!",
  userOutLabel: "You have opted out for this jackpot.",
  winMessage: "CONGRATS!<br/> YOU WON THE JACKPOT!",
};

type Jackpot = {
  id: number;
  name: string;
  enabled: boolean;
  poolBalance: number;
  seedAmount: number;
  triggerThreshold: number;
  contributionRate: number;
  volatility?: number;
  brandId: string;
  config?: Record<string, unknown>;
  groupId?: number | null;
  tierRank?: number | null;
};

type JackpotGroup = {
  id: number;
  name: string;
  status: string;
  overlappingRule?: string;
};

type DisplayPool =
  | { kind: "single"; id: string; name: string; balance: number; jackpot: Jackpot }
  | { kind: "group"; id: string; name: string; balance: number; group: JackpotGroup; tiers: Jackpot[] };

type OverlappingRule = "split" | "additive";

type LedgerSplit = {
  pool: number;
  seed: number;
  house: number;
  totalContribution: number;
  processedAt: string;
};

type PerJackpotEntry = {
  jackpotId: number;
  jackpotName: string;
  routing: OverlappingRule;
  splitDenominator: number;
  contribution: { pool: number; seed: number; house: number };
  house: number;
  totalContribution: number;
};

const BRAND_KEY = "jackpot-brand-id";

type AuditSlice = { pool: number; seed: number; house: number };

type AuditEntry = {
  loggedAt: string;
  transactionId: string;
  brandId: string;
  gameId: string;
  playerSegments: string[];
  playerId: string | null;
  wager: number;
  rngSource: "external" | "local";
  contribution: AuditSlice;
  totalContribution: number;
  perJackpot:
    | Array<{
        jackpotId: number;
        jackpotName: string;
        routing: "split" | "additive";
        contribution: AuditSlice;
        totalContribution: number;
      }>
    | null;
  win: Record<string, unknown> | null;
};

type PerJackpotStats = {
  jackpotId: number;
  jackpotName: string;
  poolTotal: number;
  seedTotal: number;
  houseTotal: number;
  totalContribution: number;
  hits: number;
  spins: number;
};

type BatchStats = {
  size: number;
  completed: number;
  ok: number;
  blocked: number;
  idempotentReplays: number;
  turnover: number;
  poolTotal: number;
  seedTotal: number;
  houseTotal: number;
  totalContribution: number;
  hits: number;
  communityHits: number;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number;
  authMode: "authorized" | "rogue" | "omitted";
  perJackpot: Record<number, PerJackpotStats>;
};

function emptyBatchStats(size: number, authMode: BatchStats["authMode"]): BatchStats {
  return {
    size,
    completed: 0,
    ok: 0,
    blocked: 0,
    idempotentReplays: 0,
    turnover: 0,
    poolTotal: 0,
    seedTotal: 0,
    houseTotal: 0,
    totalContribution: 0,
    hits: 0,
    communityHits: 0,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    durationMs: 0,
    authMode,
    perJackpot: {},
  };
}


function fmt(n: number, currency = "EUR") {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n);
  } catch {
    return `€${n.toFixed(2)}`;
  }
}

// High-precision currency formatter for the compliance ledger so a 0.0245
// slice renders as €0.0245 (not €0.02). Used only in the audit grid.
function fmtPrecise(n: number, currency = "EUR") {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(n);
  } catch {
    return `€${n.toFixed(6)}`;
  }
}

function fmtAuditTime(iso: string) {
  try {
    const d = new Date(iso);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    const ms = String(d.getMilliseconds()).padStart(3, "0");
    return `${hh}:${mm}:${ss}.${ms}`;
  } catch {
    return iso;
  }
}

function truncMiddle(s: string, head = 6, tail = 4) {
  if (!s || s.length <= head + tail + 1) return s;
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
}

function readOverlappingRule(jp: Jackpot): OverlappingRule {
  const cfg = (jp.config ?? {}) as Record<string, unknown>;
  const v2 = (cfg.engineV2 ?? {}) as Record<string, unknown>;
  const rule = v2.overlappingRule;
  return rule === "additive" ? "additive" : "split";
}

type QaTestCase = { id: number; title: string; input: string; result: string };

const QA_TEST_CASES: QaTestCase[] = [
  {
    id: 1,
    title: "Zero-Trust Security Perimeter",
    input:
      "Locate 'VPC Handshake' subsection. Toggle between 'Omitted', 'Rogue', or 'Authorized' with secret passphrase. Click 'Fire Single Bet'.",
    result:
      "Inspect the telemetry badges. Look for the pulsing red '⚠️ ACCESS BLOCKED (403)' or the green '🔒 SECURE VPC PASSTHROUGH (200)' status along with matching toast messages.",
  },
  {
    id: 2,
    title: "Cryptographically Secure Internal RNG",
    input:
      "In the single-bet form, completely clear out the 'External RNG Value (systemRngValue)' field. Click 'Fire Single Bet'.",
    result:
      "Read the response payload or audit table row attributes. Look for 'rngSource' to output exactly \"local\", driven by native hardware-backed Web Crypto entropy blocks.",
  },
  {
    id: 3,
    title: "High-Precision Financial Audit Ledger",
    input: "Adjust the wager value to '€0.10' and click 'Fire Single Bet'.",
    result:
      "Look down at the 'Compliance Audit Ledger (GLI-12 Log)' grid. Verify the top row flashes emerald on real-time polling updates and displays Pool, Seed, and House deltas precisely out to 6 decimal digits (e.g., €0.002500) without rounding clipping.",
  },
  {
    id: 4,
    title: "High-Velocity Monte Carlo Stress Loop",
    input:
      "Locate the 'Batch Velocity Runner' section. Toggle the control to 100, 500, or 1000 wagers and click 'Execute Batch'.",
    result:
      "Look at the sequential progress bar filling smoothly. Once completed, look directly at the new 'Statistical Analysis (GLI Audit View)' card displaying macro-turnover calculations, hit frequency ratios (1 in N), and zeroed error margins.",
  },
  {
    id: 5,
    title: "Idempotency Replay Attack Mitigation",
    input:
      "Copy a 'transactionId' from a successful log row, paste it back into the Transaction ID input field manually, and click 'Fire Single Bet'.",
    result:
      "Verify the engine issues a cache bypass shortcut. Look for the replay alert banner and verify that the progressive balances do not alter and no duplicate rows append to the ledger table.",
  },
  {
    id: 6,
    title: "Mathematical Models & Payout Logic Validation",
    input:
      "Navigate to the Jackpot Creator Form. Configure a test campaign choosing a specific Jackpot Type (Classic, Must-Drop, Multi-Level, or Frequency) and a Win Payout Model (Fixed, Average, or Maximum). Next, go to the Batch Velocity Runner, select 1000 spins, and click 'Execute Batch'.",
    result:
      "Look directly at the 'Statistical Analysis (GLI Audit View)' card. Verify that the 'Pool+Seed Return %' and 'House Edge %' align perfectly with the theoretical configurations. For Must-Drop setups, observe the hit checklist to confirm the threshold distribution adjusts dynamically as the batch approaches bounds.",
  },
];

function SandboxDemoPage() {
  const [brandId, setBrandId] = useState<string>("1");
  const [pools, setPools] = useState<Jackpot[]>([]);
  const [groups, setGroups] = useState<JackpotGroup[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [poolDisplays, setPoolDisplays] = useState<Record<number, number>>({});
  const [optIns, setOptIns] = useState<Record<number, boolean>>({});
  const [pendingOptIn, setPendingOptIn] = useState<Jackpot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [forceWin, setForceWin] = useState(false);
  const [wager, setWager] = useState<number>(1);
  const [lastSplit, setLastSplit] = useState<LedgerSplit | null>(null);
  const [tracker, setTracker] = useState<{
    spins: number;
    totalWager: number;
    cumPool: number;
    cumSeed: number;
    cumHouse: number;
  }>({ spins: 0, totalWager: 0, cumPool: 0, cumSeed: 0, cumHouse: 0 });
  const [celebrating, setCelebrating] = useState(false);
  const [lastWinInfo, setLastWinInfo] = useState<{ amount?: number; jackpotName?: string } | null>(null);
  const celebrationLockedRef = useRef(false);
  const [lastCommunity, setLastCommunity] = useState<CommunityPayoutBreakdown | null>(null);
  const [spinning, setSpinning] = useState(false);
  // ── S2S tester inputs (Phase 1 microservice contract) ────────────────────
  const [txnId, setTxnId] = useState<string>("");
  const [gameId, setGameId] = useState<string>("sandbox-game");
  const [playerSegmentsInput, setPlayerSegmentsInput] = useState<string>("");
  const [systemRngInput, setSystemRngInput] = useState<string>("");
  const [lastReplay, setLastReplay] = useState<boolean>(false);
  const [lastRngSource, setLastRngSource] = useState<"external" | "local" | null>(null);
  // ── Phase 2: Internal VPC handshake controls ─────────────────────────────
  const [authMode, setAuthMode] = useState<"authorized" | "rogue" | "omitted">("authorized");
  const [internalSecret, setInternalSecret] = useState<string>("");
  const [lastHandshake, setLastHandshake] = useState<
    | { status: "ok" }
    | { status: "blocked"; code?: string; message?: string; httpStatus: number }
    | null
  >(null);
  const [probingHandshake, setProbingHandshake] = useState(false);
  // ── Phase 3: Compliance audit ledger (polled, newest-first) ──────────────
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [auditCap, setAuditCap] = useState<number>(200);
  const newestAuditIdRef = useRef<string | null>(null);
  const [flashTxnId, setFlashTxnId] = useState<string | null>(null);
  // ── Phase 4: Batch velocity runner state ─────────────────────────────────
  const [batchSize, setBatchSize] = useState<100 | 500 | 1000>(100);
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const cancelRef = useRef(false);
  const batchRunningRef = useRef(false);

  const [batchStats, setBatchStats] = useState<BatchStats | null>(null);
  const [showQaSuite, setShowQaSuite] = useState(false);
  const widgetHostRef = useRef<HTMLDivElement | null>(null);

  // ── Brand id bootstrap ───────────────────────────────────────────────────
  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(BRAND_KEY) : null;
    if (stored) setBrandId(stored);
  }, []);

  const saveBrand = (v: string) => {
    setBrandId(v);
    if (typeof window !== "undefined") localStorage.setItem(BRAND_KEY, v);
  };

  const headers = useCallback(
    (): HeadersInit => ({
      "Content-Type": "application/json",
      ...(brandId ? { "x-brand-id": brandId } : {}),
    }),
    [brandId],
  );

  // ── VPC handshake ergonomics ────────────────────────────────────────────
  // Surface a non-revealing fingerprint so operators can eyeball-compare what
  // is in component state against what Lovable Cloud shows, without ever
  // exposing the secret in the DOM.
  const secretFingerprint = useMemo(() => {
    const s = internalSecret;
    if (!s) return null;
    const last4 = s.length >= 4 ? s.slice(-4) : s;
    return { length: s.length, last4, hasWhitespace: /\s/.test(s) };
  }, [internalSecret]);

  // Fires a payload-less POST against /api/v1/event/bet purely to exercise the
  // handshake gate. The route validates the secret BEFORE the Zod body schema,
  // so:
  //   403 INTERNAL_HANDSHAKE_MISSING  → no Authorization header (mode = omitted)
  //   403 INTERNAL_HANDSHAKE_INVALID  → secret present but wrong
  //   any non-403                     → secret accepted (downstream may 400 on body, that's fine)
  const probeHandshake = useCallback(async () => {
    if (probingHandshake) return;
    setProbingHandshake(true);
    try {
      const authHeaders: Record<string, string> = {};
      if (authMode === "authorized") {
        authHeaders["Authorization"] = `Bearer ${internalSecret.trim()}`;
      } else if (authMode === "rogue") {
        authHeaders["Authorization"] = `Bearer rogue-preflight`;
      }
      const res = await fetch("/api/v1/event/bet", {
        method: "POST",
        headers: { ...headers(), ...authHeaders },
        body: JSON.stringify({ __handshakePreflight: true }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        code?: string;
        message?: string;
        error?: string;
      };
      if (res.status === 403) {
        setLastHandshake({
          status: "blocked",
          code: json.code,
          message: json.message ?? json.error,
          httpStatus: 403,
        });
        toast.error(`Handshake blocked · ${json.code ?? "403"}`, {
          description: json.message ?? json.error ?? "VPC gate rejected the request.",
        });
      } else if (res.status === 503 && json.code === "INTERNAL_SECRET_NOT_SET") {
        setLastHandshake({
          status: "blocked",
          code: json.code,
          message: json.message,
          httpStatus: 503,
        });
        toast.error("Server has no INTERNAL_SERVICE_SECRET configured", {
          description: "Set it in Lovable Cloud → Secrets, then retry.",
        });
      } else {
        // Cleared the handshake — any downstream 400/404/200 means the gate accepted us.
        setLastHandshake({ status: "ok" });
        toast.success("Handshake OK", {
          description: `Gate accepted the secret (downstream HTTP ${res.status}).`,
        });
      }
    } catch (e) {
      toast.error("Handshake preflight failed", {
        description: (e as Error).message,
      });
    } finally {
      setProbingHandshake(false);
    }
  }, [authMode, internalSecret, headers, probingHandshake]);


  // ── Poll /api/v1/jackpots every 2s — load ALL enabled pools ──────────────
  useEffect(() => {
    if (!brandId) return;
    let cancelled = false;

    const tick = async () => {
      try {
        const [jpRes, grpRes] = await Promise.all([
          fetch("/api/v1/jackpots", { headers: headers() }),
          fetch("/api/v1/jackpot-groups", { headers: headers() }),
        ]);
        if (!jpRes.ok) throw new Error(`HTTP ${jpRes.status}`);
        const data = (await jpRes.json()) as Jackpot[];
        const grpData: JackpotGroup[] = grpRes.ok ? await grpRes.json() : [];
        if (cancelled) return;
        const enabled = data.filter((j) => j.enabled);
        setPools(enabled);
        setGroups(grpData);
        setPoolDisplays((prev) => {
          const next: Record<number, number> = { ...prev };
          for (const jp of enabled) {
            // While a batch is in flight, keep the locally-driven value to
            // avoid flicker/race with in-flight deltas. Otherwise always
            // sync to the canonical server balance.
            if (batchRunningRef.current && next[jp.id] != null) continue;
            next[jp.id] = jp.poolBalance;
          }
          return next;
        });

        setOptIns((prev) => {
          const next: Record<number, boolean> = { ...prev };
          for (const jp of enabled) {
            if (next[jp.id] == null) {
              // Default: opted-out for all jackpots; user must explicitly opt in.
              next[jp.id] = false;
            }
          }
          return next;
        });
        setError(null);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    };

    tick();
    const id = setInterval(tick, 2000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [brandId, headers]);

  // ── Poll /api/v1/event/bet/ledger every 2s — live compliance grid ────────
  useEffect(() => {
    if (!brandId) return;
    let cancelled = false;

    const tick = async () => {
      try {
        const res = await fetch("/api/v1/event/bet/ledger?limit=200", {
          headers: headers(),
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          entries: AuditEntry[];
          total: number;
          cap: number;
        };
        if (cancelled) return;
        const entries = Array.isArray(data.entries) ? data.entries : [];
        setAuditEntries(entries);
        if (typeof data.cap === "number") setAuditCap(data.cap);
        const newestId = entries[0]?.transactionId ?? null;
        if (newestId && newestId !== newestAuditIdRef.current) {
          newestAuditIdRef.current = newestId;
          setFlashTxnId(newestId);
          window.setTimeout(() => {
            setFlashTxnId((cur) => (cur === newestId ? null : cur));
          }, 1100);
        }
      } catch {
        /* non-fatal — next tick retries */
      }
    };

    tick();
    const id = setInterval(tick, 2000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [brandId, headers]);

  // ── Derive display pools: active MultiJackpot groups appear as a single
  //    grouped tile (showing all tiers stacked), followed by standalone jackpots.
  const displayPools: DisplayPool[] = useMemo(() => {
    const activeGroups = groups.filter((g) => g.status === "active");
    const activeGroupIds = new Set(activeGroups.map((g) => g.id));
    const groupTiles: DisplayPool[] = activeGroups.map((g) => {
      const tiers = pools
        .filter((p) => p.groupId === g.id)
        .sort((a, b) => (a.tierRank ?? 0) - (b.tierRank ?? 0) || a.id - b.id);
      const balance = tiers.reduce(
        (s, t) => s + (poolDisplays[t.id] ?? t.poolBalance),
        0,
      );
      return { kind: "group", id: `g${g.id}`, name: g.name, balance, group: g, tiers };
    });
    const singles: DisplayPool[] = pools
      .filter((p) => !p.groupId || !activeGroupIds.has(p.groupId))
      .map((p) => ({
        kind: "single",
        id: `j${p.id}`,
        name: p.name,
        balance: poolDisplays[p.id] ?? p.poolBalance,
        jackpot: p,
      }));
    return [...groupTiles, ...singles];
  }, [groups, pools, poolDisplays]);

  // Keep activeIndex within bounds of the display list.
  useEffect(() => {
    setActiveIndex((i) => (displayPools.length === 0 ? 0 : Math.min(i, displayPools.length - 1)));
  }, [displayPools.length]);

  const activeDisplay: DisplayPool | null = displayPools[activeIndex] ?? null;
  const activePool: Jackpot | null =
    activeDisplay?.kind === "single" ? activeDisplay.jackpot : null;
  const activeGroupTiers: Jackpot[] =
    activeDisplay?.kind === "group" ? activeDisplay.tiers : [];
  const activeRule: OverlappingRule | null = activePool ? readOverlappingRule(activePool) : null;
  const activeOptedIn = activeDisplay
    ? activeDisplay.kind === "single"
      ? !!optIns[activeDisplay.jackpot.id]
      : activeGroupTiers.some((t) => !!optIns[t.id])
    : false;

  // ── Cumulative fee label ─────────────────────────────────────────────────
  const optedInPools = useMemo(
    () => pools.filter((p) => optIns[p.id]),
    [pools, optIns],
  );
  const feePerSpin = useMemo(
    () => optedInPools.reduce((s, p) => s + (Number(p.contributionRate) || 0) * (Number(wager) || 0), 0),
    [optedInPools, wager],
  );

  // ── Persist pool growth so polling reflects each spin ─────────────────────
  const persistPoolGrowth = async (jackpotId: number, amount: number) => {
    if (amount <= 0) return;
    try {
      await fetch("/api/v1/jackpots/topup", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          jackpotId,
          amount,
          backofficeUser: "sandbox-demo",
          isSeed: false,
        }),
      });
    } catch {
      /* non-fatal — poll will resync */
    }
  };

  const bumpTracker = (wagerAmt: number, pool: number, seed: number, house: number) => {
    setTracker((t) => ({
      spins: t.spins + 1,
      totalWager: t.totalWager + wagerAmt,
      cumPool: t.cumPool + pool,
      cumSeed: t.cumSeed + seed,
      cumHouse: t.cumHouse + house,
    }));
  };

  const resetTracker = () => {
    setTracker({ spins: 0, totalWager: 0, cumPool: 0, cumSeed: 0, cumHouse: 0 });
  };

  // ── Trigger spin ──────────────────────────────────────────────────────────
  const handleSpin = async () => {
    if (pools.length === 0 || spinning) return;
    const w = Number(wager);
    if (!Number.isFinite(w) || w <= 0) {
      setError("Wager must be a positive number");
      return;
    }
    setSpinning(true);
    setError(null);

    try {
      if (forceWin && activePool) {
        // Force-win flow remains single-pool against the currently visible pool.
        const body = buildConfigBody(activePool);
        const res = await fetch(
          `/api/v1/event/simulate-bet?externalRoll=1&wager=${w}&iterations=1`,
          { method: "POST", headers: headers(), body: JSON.stringify(body) },
        );
        if (!res.ok) throw new Error(`Simulate HTTP ${res.status}`);
        const json = (await res.json()) as {
          contribution?: { pool?: number; seed?: number; house?: number };
          totalContribution?: number;
        };
        const poolAdd = json.contribution?.pool ?? 0;
        const seedAdd = json.contribution?.seed ?? 0;
        const houseAdd = json.contribution?.house ?? 0;
        setLastSplit({
          pool: poolAdd,
          seed: seedAdd,
          house: houseAdd,
          totalContribution: json.totalContribution ?? 0,
          processedAt: new Date().toISOString(),
        });
        setPoolDisplays((d) => ({ ...d, [activePool.id]: (d[activePool.id] ?? 0) + poolAdd }));
        bumpTracker(w, poolAdd, seedAdd, houseAdd);
        await persistPoolGrowth(activePool.id, poolAdd);

        // ── Community Win Mechanics — compute split when configured ──────────
        const cfg = (activePool.config ?? {}) as Record<string, unknown>;
        const community = cfg.community as
          | { enabled?: boolean; split?: number; maximumWinAmount?: number; maximumNumberOfPlayers?: number }
          | null
          | undefined;
        if (community && community.enabled && (community.split ?? 0) > 0) {
          const winAmount = poolDisplays[activePool.id] ?? activePool.poolBalance;
          const breakdown = applyCommunityPayout(winAmount, {
            split: Number(community.split) || 0,
            maximumWinAmount: Number(community.maximumWinAmount) || 0,
            maximumNumberOfPlayers: Number(community.maximumNumberOfPlayers) || 1,
          });
          setLastCommunity(breakdown);
        } else {
          setLastCommunity(null);
        }
        triggerCelebration();
      } else {
        // Multi-pool router: structured S2S payload.
        const segments = playerSegmentsInput
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        const sysRng = systemRngInput.trim() === "" ? undefined : Number(systemRngInput);
        const transactionId =
          txnId.trim() ||
          (typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `txn-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);
        if (!txnId.trim()) setTxnId(transactionId);

        const payload: Record<string, unknown> = {
          transactionId,
          wager: w,
          gameId: gameId.trim() || "sandbox-game",
          playerSegments: segments,
        };
        if (typeof sysRng === "number" && Number.isFinite(sysRng)) {
          payload.systemRngValue = Math.min(1, Math.max(0, sysRng));
        }

        const authHeaders: Record<string, string> = {};
        if (authMode === "authorized") {
          authHeaders["Authorization"] = `Bearer ${internalSecret}`;
        } else if (authMode === "rogue") {
          const rogue =
            typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
          authHeaders["Authorization"] = `Bearer rogue-${rogue}`;
        }

        const res = await fetch("/api/v1/event/bet", {
          method: "POST",
          headers: { ...headers(), ...authHeaders },
          body: JSON.stringify(payload),
        });

        const json = (await res.json().catch(() => ({}))) as {
          contribution?: { pool: number; seed: number; house: number };
          totalContribution?: number;
          perJackpot?: PerJackpotEntry[];
          idempotentReplay?: boolean;
          rngSource?: "external" | "local";
          code?: string;
          message?: string;
          error?: string;
          win?: {
            jackpotId: number;
            amount: number;
            isCommunity: boolean;
            communitySize?: number;
            communityMemberPayOut?: number;
            triggeringPayout?: number;
            communityPool?: number;
            cappedDelta?: number;
          } | null;
        };

        if (!res.ok) {
          setLastHandshake({
            status: "blocked",
            code: json.code,
            message: json.message ?? json.error,
            httpStatus: res.status,
          });
          throw new Error(
            `Bet HTTP ${res.status}${json.code ? ` (${json.code})` : ""}${
              json.message || json.error ? `: ${json.message ?? json.error}` : ""
            }`,
          );
        }
        setLastHandshake({ status: "ok" });
        setLastReplay(!!json.idempotentReplay);
        setLastRngSource(json.rngSource ?? null);
        const per = json.perJackpot ?? [];

        // Aggregate only the slices for pools the user is currently opted into.
        let aggPool = 0;
        let aggSeed = 0;
        let aggHouse = 0;
        const poolDeltas: Record<number, number> = {};
        for (const e of per) {
          if (!optIns[e.jackpotId]) continue;
          aggPool += e.contribution.pool;
          aggSeed += e.contribution.seed;
          aggHouse += e.contribution.house;
          poolDeltas[e.jackpotId] = (poolDeltas[e.jackpotId] ?? 0) + e.contribution.pool;
        }

        setLastSplit({
          pool: aggPool,
          seed: aggSeed,
          house: aggHouse,
          totalContribution: aggPool + aggSeed + aggHouse,
          processedAt: new Date().toISOString(),
        });
        setPoolDisplays((d) => {
          const next = { ...d };
          for (const [id, add] of Object.entries(poolDeltas)) {
            next[Number(id)] = (next[Number(id)] ?? 0) + add;
          }
          return next;
        });
        bumpTracker(w, aggPool, aggSeed, aggHouse);
        await Promise.all(
          Object.entries(poolDeltas).map(([id, add]) =>
            persistPoolGrowth(Number(id), add),
          ),
        );

        // Surface server-side win (incl. community breakdown) if returned.
        if (json.win && json.win.isCommunity) {
          setLastCommunity({
            isCommunity: true,
            triggeringPayout: json.win.triggeringPayout ?? 0,
            communityPool: json.win.communityPool ?? 0,
            communitySize: json.win.communitySize ?? 0,
            communityMemberPayOut: json.win.communityMemberPayOut ?? 0,
            cappedDelta: json.win.cappedDelta ?? 0,
          });
          const winJpName = pools.find((p) => p.id === json.win!.jackpotId)?.name;
          triggerCelebration({ amount: json.win.triggeringPayout ?? json.win.amount, jackpotName: winJpName });
        } else if (json.win) {
          setLastCommunity(null);
          const winJpName = pools.find((p) => p.id === json.win!.jackpotId)?.name;
          triggerCelebration({ amount: json.win.amount, jackpotName: winJpName });
        }
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSpinning(false);
    }
  };

  // ── Phase 4: Headless batch runner ───────────────────────────────────────
  const runBatch = async () => {
    if (batchRunning) return;
    const w = Number(wager);
    if (!Number.isFinite(w) || w <= 0) {
      setError("Wager must be a positive number");
      return;
    }
    const size = batchSize;
    const segments = playerSegmentsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const game = gameId.trim() || "sandbox-game";
    const sysRng = systemRngInput.trim() === "" ? undefined : Number(systemRngInput);
    const currentAuthMode = authMode;
    const currentSecret = internalSecret;

    cancelRef.current = false;
    batchRunningRef.current = true;
    setBatchRunning(true);
    setBatchProgress(0);
    setError(null);
    const stats = emptyBatchStats(size, currentAuthMode);
    setBatchStats(stats);
    const start = performance.now();
    const FLUSH = 25;
    const CONCURRENCY = 16;
    let next = 0;
    const pendingDeltas: Record<number, number> = {};

    const flushPoolDeltas = () => {
      const ids = Object.keys(pendingDeltas);
      if (ids.length === 0) return;
      const snap = { ...pendingDeltas };
      for (const k of ids) delete pendingDeltas[Number(k)];
      setPoolDisplays((d) => {
        const n = { ...d };
        for (const [id, add] of Object.entries(snap)) {
          const jid = Number(id);
          n[jid] = (n[jid] ?? 0) + add;
        }
        return n;
      });
    };

    const worker = async () => {
      while (true) {
        if (cancelRef.current) return;
        const i = next++;
        if (i >= size) return;
        const txn =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `txn-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 10)}`;
        const payload: Record<string, unknown> = {
          transactionId: txn,
          wager: w,
          gameId: game,
          playerSegments: segments,
        };
        if (typeof sysRng === "number" && Number.isFinite(sysRng)) {
          payload.systemRngValue = Math.min(1, Math.max(0, sysRng));
        }
        const authHeaders: Record<string, string> = {};
        if (currentAuthMode === "authorized") {
          authHeaders["Authorization"] = `Bearer ${currentSecret}`;
        } else if (currentAuthMode === "rogue") {
          authHeaders["Authorization"] = `Bearer rogue-${txn}`;
        }
        try {
          const res = await fetch("/api/v1/event/bet", {
            method: "POST",
            headers: { ...headers(), ...authHeaders },
            body: JSON.stringify(payload),
          });
          const j = (await res.json().catch(() => ({}))) as {
            contribution?: { pool?: number; seed?: number; house?: number };
            totalContribution?: number;
            idempotentReplay?: boolean;
            perJackpot?: PerJackpotEntry[] | null;
            win?: { jackpotId?: number; isCommunity?: boolean } | null;
          };
          stats.completed++;
          if (res.ok) {
            stats.ok++;
            stats.turnover += w;
            stats.poolTotal += j.contribution?.pool ?? 0;
            stats.seedTotal += j.contribution?.seed ?? 0;
            stats.houseTotal += j.contribution?.house ?? 0;
            stats.totalContribution += j.totalContribution ?? 0;
            if (j.idempotentReplay) stats.idempotentReplays++;

            // Per-tier breakdown + live tile updates from perJackpot slices.
            const per = j.perJackpot ?? [];
            for (const e of per) {
              const jid = e.jackpotId;
              const cur =
                stats.perJackpot[jid] ??
                (stats.perJackpot[jid] = {
                  jackpotId: jid,
                  jackpotName: e.jackpotName,
                  poolTotal: 0,
                  seedTotal: 0,
                  houseTotal: 0,
                  totalContribution: 0,
                  hits: 0,
                  spins: 0,
                });
              cur.jackpotName = e.jackpotName || cur.jackpotName;
              cur.spins++;
              cur.poolTotal += e.contribution.pool ?? 0;
              cur.seedTotal += e.contribution.seed ?? 0;
              cur.houseTotal += e.contribution.house ?? 0;
              cur.totalContribution += e.totalContribution ?? 0;
              const poolDelta = e.contribution.pool ?? 0;
              if (poolDelta) {
                pendingDeltas[jid] = (pendingDeltas[jid] ?? 0) + poolDelta;
              }
            }

            if (j.win) {
              stats.hits++;
              if (j.win.isCommunity) stats.communityHits++;
              const wjid = j.win.jackpotId;
              if (typeof wjid === "number" && stats.perJackpot[wjid]) {
                stats.perJackpot[wjid].hits++;
              }
              if (!celebrationLockedRef.current) {
                const jpName =
                  (typeof wjid === "number" && stats.perJackpot[wjid]?.jackpotName) ||
                  pools.find((p) => p.id === wjid)?.name;
                triggerCelebration({ jackpotName: jpName });
              }
            }
          } else {
            stats.blocked++;
          }
        } catch {
          stats.completed++;
          stats.blocked++;
        }
        if (stats.completed % FLUSH === 0 || stats.completed === size) {
          setBatchProgress(stats.completed);
          setBatchStats({ ...stats, perJackpot: { ...stats.perJackpot } });
          flushPoolDeltas();
        }
      }
    };

    await Promise.all(Array.from({ length: CONCURRENCY }, worker));

    stats.finishedAt = new Date().toISOString();
    stats.durationMs = Math.round(performance.now() - start);
    flushPoolDeltas();
    setBatchStats({ ...stats, perJackpot: { ...stats.perJackpot } });
    batchRunningRef.current = false;
    setBatchRunning(false);
  };


  const cancelBatch = () => {
    cancelRef.current = true;
  };



  const triggerCelebration = (info?: { amount?: number; jackpotName?: string }) => {
    if (celebrationLockedRef.current) return;
    celebrationLockedRef.current = true;
    setLastWinInfo(info ?? null);
    setCelebrating(true);
  };

  const closeCelebration = useCallback(() => {
    setCelebrating(false);
    setLastWinInfo(null);
    setLastCommunity(null);
    celebrationLockedRef.current = false;
  }, []);

  useEffect(() => {
    if (!celebrating) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCelebration();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [celebrating, closeCelebration]);

  // ── Opt-in/out handler with additive compliance interceptor ──────────────
  const handleOptToggle = () => {
    if (!activeDisplay) return;

    // Group opt-in: toggle all tiers atomically (mirrors how MultiJackpot
    // groups are surfaced as a single player-facing campaign).
    if (activeDisplay.kind === "group") {
      const tiers = activeDisplay.tiers;
      if (tiers.length === 0) return;
      const anyIn = tiers.some((t) => !!optIns[t.id]);
      setOptIns((m) => {
        const next = { ...m };
        for (const t of tiers) next[t.id] = !anyIn;
        return next;
      });
      return;
    }

    const jp = activeDisplay.jackpot;
    const id = jp.id;
    const currentlyIn = !!optIns[id];
    if (currentlyIn) {
      setOptIns((m) => ({ ...m, [id]: false }));
      return;
    }
    const rule = readOverlappingRule(jp);
    const othersIn = pools.some((p) => p.id !== id && optIns[p.id]);
    if (rule === "additive" && othersIn) {
      setPendingOptIn(jp);
      return;
    }
    setOptIns((m) => ({ ...m, [id]: true }));
  };

  const confirmPendingOptIn = () => {
    if (!pendingOptIn) return;
    setOptIns((m) => ({ ...m, [pendingOptIn.id]: true }));
    setPendingOptIn(null);
  };

  // ── ESC closes the compliance modal ──────────────────────────────────────
  useEffect(() => {
    if (!pendingOptIn) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPendingOptIn(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pendingOptIn]);

  const projectedFee = useMemo(() => {
    if (!pendingOptIn) return feePerSpin;
    return feePerSpin + (Number(pendingOptIn.contributionRate) || 0) * (Number(wager) || 0);
  }, [pendingOptIn, feePerSpin, wager]);

  // ── /simulate-bet body builder (force-win path) ──────────────────────────
  const buildConfigBody = (jp: Jackpot) => {
    const cfg = (jp.config ?? {}) as Record<string, unknown>;
    const v2 = (cfg.engineV2 ?? {}) as Record<string, unknown>;
    const tiers = (cfg.tiers as unknown[]) ?? undefined;
    return {
      id: jp.id,
      name: jp.name,
      enabled: jp.enabled,
      brandId: jp.brandId,
      type: "AVERAGE",
      structuralType: tiers && tiers.length > 0 ? "MULTI_LEVEL" : "CLASSIC",
      volatility: jp.volatility ?? 1,
      pool: {
        currentAmount: jp.poolBalance,
        minimumAmount: jp.seedAmount,
        maximumAmount: jp.triggerThreshold,
        contributionAmount: jp.contributionRate * 100,
        contributionType: "PERCENTAGE",
      },
      seed: {
        currentAmount: jp.seedAmount,
        targetAmount: jp.seedAmount,
        contributionAmount: 0,
        contributionType: "FIXED",
      },
      tiers,
      contribution:
        v2.contributionMode === "split"
          ? {
              mode: "split",
              totalContributionAmount: Number(v2.totalContributionAmount) || 0,
              totalContributionType: v2.totalContributionType ?? "FIXED",
              poolWeight: Number(v2.poolWeight) || 0,
              seedWeight: Number(v2.seedWeight) || 0,
              houseWeight: Number(v2.houseWeight) || 0,
              overlappingRule: v2.overlappingRule ?? "split",
            }
          : undefined,
    };
  };

  const multi = displayPools.length > 1;
  const optedInCount = optedInPools.length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <style>{confettiCss + widgetCss}</style>

      <header className="max-w-6xl mx-auto mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-emerald-400 mb-1">
            Hidden · Phase C
          </div>
          <h1 className="text-3xl font-bold">Sandbox Demo — Live Widget Proof</h1>
          <p className="text-slate-400 text-sm mt-1">
            Native player widget driven by real <code>/api/v1/jackpots</code> polling and the new
            multi-campaign <code>/api/v1/event/bet</code> router.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowQaSuite(true)}
          className="shrink-0 inline-flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 transition px-4 py-2 text-sm font-semibold text-emerald-200 shadow-[0_0_24px_-12px_rgba(16,185,129,0.8)]"
        >
          📋 View QA Compliance Test Suite
        </button>
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Player widget host ───────────────────────────────── */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 relative overflow-hidden min-h-[420px]">
          <div className="text-xs uppercase tracking-wider text-slate-400 mb-3">
            Player widget host · {displayPools.length} pool{displayPools.length === 1 ? "" : "s"}
          </div>

          <div id="jooba-container-root" ref={widgetHostRef} className="flex justify-center">
            <div id="jooba-widget-wrapper" className="jooba-widget-wrapper">
              <div id="jooba-widget" className="jooba-widget">
                {/* Header with carousel chevrons */}
                <div id="jooba-widget-header" className="jooba-widget-header">
                  {multi && (
                    <button
                      className="jooba-icon-btn jooba-nav-btn"
                      onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
                      disabled={activeIndex === 0}
                      aria-label="Previous pool"
                    >
                      ‹
                    </button>
                  )}
                  <div id="jooba-widget-current-amount" className="jooba-widget-current-amount">
                    {activeDisplay ? fmt(activeDisplay.balance) : texts.loading}
                  </div>
                  {multi ? (
                    <button
                      className="jooba-icon-btn jooba-nav-btn"
                      onClick={() => setActiveIndex((i) => Math.min(displayPools.length - 1, i + 1))}
                      disabled={activeIndex >= displayPools.length - 1}
                      aria-label="Next pool"
                    >
                      ›
                    </button>
                  ) : (
                    <div className="jooba-widget-actions-bar">
                      <button className="jooba-icon-btn" title="Info">?</button>
                    </div>
                  )}
                </div>

                {/* Body: carousel track */}
                <div id="jooba-widget-body" className="jooba-widget-body">
                  {displayPools.length === 0 ? (
                    <div className="jooba-info-label">Awaiting jackpot…</div>
                  ) : (
                    <>
                      <div className="jooba-carousel">
                        <div
                          className="jooba-carousel-track"
                          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
                        >
                          {displayPools.map((dp) => {
                            if (dp.kind === "group") {
                              const anyIn = dp.tiers.some((t) => !!optIns[t.id]);
                              return (
                                <div className="jooba-slide" key={dp.id}>
                                  <div className="jooba-coin" aria-hidden>
                                    <span>€</span>
                                  </div>
                                  <div className="jooba-jackpot-name">{dp.name}</div>
                                  <div className="jooba-badge jooba-badge-split">
                                    MULTI-JACKPOT · {dp.tiers.length} TIERS
                                  </div>
                                  <div className="jooba-tier-list">
                                    {dp.tiers.map((t) => (
                                      <div className="jooba-tier-row" key={t.id}>
                                        <span className="jooba-tier-name">{t.name}</span>
                                        <span className="jooba-tier-amount">
                                          {fmt(poolDisplays[t.id] ?? t.poolBalance)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="jooba-info-label">
                                    {anyIn ? texts.userInLabel : texts.userOutLabel}
                                  </div>
                                </div>
                              );
                            }
                            const p = dp.jackpot;
                            const rule = readOverlappingRule(p);
                            const inIt = !!optIns[p.id];
                            return (
                              <div className="jooba-slide" key={dp.id}>
                                <div className="jooba-coin" aria-hidden>
                                  <span>€</span>
                                </div>
                                <div className="jooba-jackpot-name">{p.name}</div>
                                <div
                                  className={`jooba-badge ${rule === "additive" ? "jooba-badge-additive" : "jooba-badge-split"}`}
                                >
                                  {rule === "additive" ? "ADDITIVE" : "SPLIT"}
                                </div>
                                <div className="jooba-info-label">
                                  {inIt ? texts.userInLabel : texts.userOutLabel}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      {multi && (
                        <div className="jooba-dots">
                          {displayPools.map((dp, i) => (
                            <button
                              key={dp.id}
                              className={`jooba-dot ${i === activeIndex ? "jooba-dot-active" : ""}`}
                              onClick={() => setActiveIndex(i)}
                              aria-label={`Show pool ${dp.name}`}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Footer: opt button + cumulative fee */}
                <div id="jooba-widget-footer" className="jooba-widget-footer">
                  <div id="jooba-widget-buttons-opt-wrapper" className="jooba-widget-buttons-opt-wrapper">
                    {activeDisplay && (
                      activeOptedIn ? (
                        <button
                          id="jooba-widget-opt-out-button"
                          className="jooba-btn jooba-btn-secondary"
                          onClick={handleOptToggle}
                        >
                          {texts.optOutButton}
                        </button>
                      ) : (
                        <button
                          id="jooba-widget-opt-in-button"
                          className="jooba-btn jooba-btn-primary"
                          onClick={handleOptToggle}
                        >
                          {texts.optInButton}
                          {activeRule === "additive" ? " (Additive)" : ""}
                        </button>
                      )
                    )}
                  </div>
                  <div className="jooba-fee-row">
                    <span className="jooba-fee-label-prefix">Jackpot Fee:</span>
                    <span key={feePerSpin.toFixed(4)} className="jooba-fee-value">
                      {fmt(feePerSpin)} / spin
                    </span>
                    {optedInCount > 1 && (
                      <span className="jooba-fee-multi">(Multi-Pool active)</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Casino Simulator Panel ───────────────────────────── */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Casino Simulator Panel</h2>

          <div className="flex flex-col gap-1">
            <label className="text-xs uppercase tracking-wider text-slate-400">
              Brand ID (x-brand-id header)
            </label>
            <input
              type="text"
              value={brandId}
              onChange={(e) => saveBrand(e.target.value)}
              placeholder="paste brand id…"
              className="bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm font-mono"
            />
            <span className="text-[11px] text-slate-500 mt-1">
              Defaults to the admin mock brand (1).
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-slate-950/60 border border-slate-800 rounded p-3">
              <div className="text-xs uppercase text-slate-500">Enabled Pools</div>
              <div className="font-semibold">{pools.length}</div>
              <div className="text-xs text-slate-500">opted in: {optedInCount}</div>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 rounded p-3">
              <div className="text-xs uppercase text-slate-500">Visible Pool</div>
              <div className="font-semibold truncate">{activePool?.name ?? "—"}</div>
              <div className="text-xs text-slate-500 tabular-nums">
                {activePool ? fmt(poolDisplays[activePool.id] ?? activePool.poolBalance) : "—"}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs uppercase tracking-wider text-slate-400">
              Wager Amount (EUR)
            </label>
            <input
              type="number"
              min={0.01}
              step={0.5}
              value={wager}
              onChange={(e) => setWager(parseFloat(e.target.value) || 0)}
              className="bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm font-mono"
            />
          </div>

          {/* ── S2S Tester (Phase 1 microservice contract) ──────────────── */}
          <details className="bg-slate-950/40 border border-slate-800 rounded-lg" open>
            <summary className="cursor-pointer px-3 py-2 text-xs uppercase tracking-wider text-slate-300 flex flex-wrap items-center gap-2">
              <span>S2S Tester</span>
              {lastHandshake?.status === "ok" ? (
                <span className="inline-block px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] normal-case tracking-normal">
                  🔒 SECURE VPC PASSTHROUGH
                </span>
              ) : null}
              {lastHandshake?.status === "blocked" && lastHandshake.httpStatus === 403 ? (
                <span
                  className="inline-block px-2 py-0.5 rounded bg-red-500/30 text-red-200 text-[10px] normal-case tracking-normal animate-pulse"
                  title={lastHandshake.message ?? ""}
                >
                  ⚠️ ACCESS BLOCKED (403)
                  {lastHandshake.code ? ` · ${lastHandshake.code}` : ""}
                </span>
              ) : null}
              {lastHandshake?.status === "blocked" && lastHandshake.httpStatus === 503 ? (
                <span className="inline-block px-2 py-0.5 rounded bg-amber-500/30 text-amber-200 text-[10px] normal-case tracking-normal">
                  VPC SECRET NOT CONFIGURED
                </span>
              ) : null}
              {lastReplay ? (
                <span className="inline-block px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] normal-case tracking-normal">
                  idempotent replay
                </span>
              ) : null}
              {lastRngSource ? (
                <span className="inline-block px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] normal-case tracking-normal">
                  rng: {lastRngSource}
                </span>
              ) : null}
            </summary>
            <div className="px-3 pb-3 pt-1 flex flex-col gap-2 text-sm">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] uppercase tracking-wider text-slate-500">
                  transactionId
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={txnId}
                    onChange={(e) => setTxnId(e.target.value)}
                    placeholder="auto (generated on spin)"
                    className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setTxnId(
                        typeof crypto !== "undefined" && "randomUUID" in crypto
                          ? crypto.randomUUID()
                          : `txn-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
                      )
                    }
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs"
                  >
                    Generate
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] uppercase tracking-wider text-slate-500">
                  gameId
                </label>
                <input
                  type="text"
                  value={gameId}
                  onChange={(e) => setGameId(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs font-mono"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] uppercase tracking-wider text-slate-500">
                  playerSegments (comma-separated)
                </label>
                <input
                  type="text"
                  value={playerSegmentsInput}
                  onChange={(e) => setPlayerSegmentsInput(e.target.value)}
                  placeholder="VIP, HighRoller"
                  className="bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs font-mono"
                />
              <div className="flex flex-col gap-1 pt-2 mt-1 border-t border-slate-800">
                <label className="text-[11px] uppercase tracking-wider text-slate-500">
                  VPC Handshake (Internal Service Secret)
                </label>
                <div className="flex flex-col gap-1 text-xs">
                  {(
                    [
                      ["authorized", "Authorized — send valid internal secret"],
                      ["rogue", "Unauthorized — send rogue / corrupted token"],
                      ["omitted", "Unauthorized — omit token entirely"],
                    ] as const
                  ).map(([val, label]) => (
                    <label key={val} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="authMode"
                        value={val}
                        checked={authMode === val}
                        onChange={() => setAuthMode(val)}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
                <input
                  type="password"
                  value={internalSecret}
                  onChange={(e) => setInternalSecret(e.target.value)}
                  onBlur={(e) => {
                    const trimmed = e.target.value.replace(/^\s+|\s+$/g, "");
                    if (trimmed !== e.target.value) setInternalSecret(trimmed);
                  }}
                  placeholder="paste INTERNAL_SERVICE_SECRET to test the authorized path"
                  className="mt-1 bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs font-mono"
                />
                <div className="flex items-center justify-between gap-2 mt-1">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {secretFingerprint
                      ? <>stored: {secretFingerprint.length} chars · ends &ldquo;…{secretFingerprint.last4}&rdquo;</>
                      : <>stored: (empty)</>}
                    {secretFingerprint?.hasWhitespace ? (
                      <span className="ml-2 text-amber-400">⚠ contains whitespace</span>
                    ) : null}
                  </span>
                  <button
                    type="button"
                    onClick={probeHandshake}
                    disabled={probingHandshake || (authMode === "authorized" && !internalSecret)}
                    className="text-[10px] uppercase tracking-wider px-2 py-1 rounded border border-slate-700 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {probingHandshake ? "probing…" : "Test handshake"}
                  </button>
                </div>
                <span className="text-[10px] text-slate-500">
                  Sent as <code>Authorization: Bearer &lt;secret&gt;</code>. Stored in
                  component state only — never logged.
                </span>
                {lastHandshake?.status === "blocked" &&
                lastHandshake.code === "INTERNAL_HANDSHAKE_INVALID" ? (
                  <div className="mt-2 rounded border border-amber-500/40 bg-amber-500/10 px-2 py-1.5 text-[11px] text-amber-200">
                    <strong className="font-semibold">Stale secret detected.</strong>{" "}
                    The gateway rejected this value. Copy{" "}
                    <code>INTERNAL_SERVICE_SECRET</code> from Lovable Cloud → Secrets and re-paste —
                    watch for trailing whitespace, newlines, or smart-quote substitution.
                  </div>
                ) : null}
              </div>
            </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] uppercase tracking-wider text-slate-500">
                  systemRngValue (0..1, optional — forces external RNG)
                </label>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.000001}
                  value={systemRngInput}
                  onChange={(e) => setSystemRngInput(e.target.value)}
                  placeholder="auto (local PRNG)"
                  className="bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs font-mono"
                />
                <span className="text-[10px] text-slate-500">
                  Try <code>0.000001</code> to force an instant win evaluation.
                </span>
              </div>
            </div>
          </details>

          {/* ── Phase 4 — Batch Velocity Runner ──────────────────────────── */}
          <details className="bg-slate-950/40 border border-slate-800 rounded-lg" open>
            <summary className="cursor-pointer px-3 py-2 text-xs uppercase tracking-wider text-slate-300 flex flex-wrap items-center gap-2">
              <span>Batch Velocity Runner</span>
              <span className="inline-block px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-200 text-[10px] normal-case tracking-normal">
                Monte Carlo · GLI-19
              </span>
              {batchRunning ? (
                <span className="inline-block px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-200 text-[10px] normal-case tracking-normal animate-pulse tabular-nums">
                  Running… {batchProgress} / {batchSize}
                </span>
              ) : null}
            </summary>
            <div className="px-3 pb-3 pt-1 flex flex-col gap-2 text-sm">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] uppercase tracking-wider text-slate-500">
                  Load Size (automated spins)
                </label>
                <div className="flex gap-2">
                  {([100, 500, 1000] as const).map((n) => (
                    <button
                      key={n}
                      type="button"
                      disabled={batchRunning}
                      onClick={() => setBatchSize(n)}
                      className={`flex-1 px-2 py-1.5 rounded border text-xs font-mono tabular-nums transition ${
                        batchSize === n
                          ? "bg-indigo-500/30 border-indigo-400 text-indigo-100"
                          : "bg-slate-950 border-slate-700 text-slate-300 hover:bg-slate-900"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {n.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={runBatch}
                  disabled={batchRunning}
                  className="flex-1 py-2 rounded bg-indigo-500 hover:bg-indigo-400 disabled:bg-slate-700 disabled:cursor-not-allowed text-slate-950 font-semibold text-sm transition"
                >
                  {batchRunning ? `Running… ${batchProgress} / ${batchSize}` : `Execute Batch (${batchSize.toLocaleString()} spins)`}
                </button>
                {batchRunning ? (
                  <button
                    type="button"
                    onClick={cancelBatch}
                    className="px-3 py-2 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
                  >
                    Cancel
                  </button>
                ) : null}
                {!batchRunning && batchStats ? (
                  <button
                    type="button"
                    onClick={() => setBatchStats(null)}
                    className="px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                  >
                    Clear
                  </button>
                ) : null}
              </div>
              {batchRunning || batchStats ? (
                <progress
                  value={batchRunning ? batchProgress : batchStats?.completed ?? 0}
                  max={batchRunning ? batchSize : batchStats?.size ?? 1}
                  className="w-full h-2"
                />
              ) : null}
              <span className="text-[10px] text-slate-500">
                Each spin uses a fresh transactionId, the current VPC auth mode, and the
                same RNG settings as the single-spin tester. Streams into the GLI-12 ledger.
              </span>
            </div>
          </details>



          <button
            onClick={handleSpin}
            disabled={pools.length === 0 || spinning}
            className="w-full py-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:cursor-not-allowed text-slate-950 font-bold text-lg transition"
          >
            {spinning ? "Spinning…" : `Trigger Game Spin (${fmt(wager)})`}
          </button>

          <label className="flex items-center justify-between bg-slate-950/40 border border-slate-800 rounded px-3 py-2 cursor-pointer">
            <span className="text-sm">
              <span className="text-slate-400">⚙ </span>
              Force Jackpot Win (visible pool)
              <span className="text-xs text-slate-500 block">
                Routes spin through <code>/simulate-bet?externalRoll=1</code>
              </span>
            </span>
            <input
              type="checkbox"
              checked={forceWin}
              onChange={(e) => setForceWin(e.target.checked)}
              className="h-5 w-5 accent-emerald-500"
            />
          </label>

          <div className="border-t border-slate-800 pt-4">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="text-xs uppercase tracking-wider text-slate-400">
                Last Aggregated Split (Multi-Campaign)
              </div>
              {lastSplit ? (
                <div className="text-[11px] tabular-nums text-slate-500">
                  {new Date(lastSplit.processedAt).toLocaleTimeString()}
                </div>
              ) : null}
            </div>
            {lastSplit ? (
              <div key={lastSplit.processedAt} className="grid grid-cols-3 gap-2 text-sm">
                <Split label="Pool" value={lastSplit.pool} color="text-emerald-400" />
                <Split label="Seed" value={lastSplit.seed} color="text-sky-400" />
                <Split label="House" value={lastSplit.house} color="text-amber-400" />
              </div>
            ) : (
              <div className="text-sm text-slate-500">No spins yet.</div>
            )}
          </div>

          <div className="border-t border-slate-800 pt-4 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs uppercase tracking-wider text-slate-400">
                Allocation Tracker (Σ opted-in pools)
              </div>
              <button
                onClick={resetTracker}
                className="text-[11px] text-slate-400 hover:text-slate-200 underline underline-offset-2"
              >
                Reset
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Stat label="Spins" value={String(tracker.spins)} />
              <Stat label="Total wagered" value={fmt(tracker.totalWager)} />
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <Split label="Σ Pool" value={tracker.cumPool} color="text-emerald-400" />
              <Split label="Σ Seed" value={tracker.cumSeed} color="text-sky-400" />
              <Split label="Σ House" value={tracker.cumHouse} color="text-amber-400" />
            </div>
          </div>

          {error && (
            <div className="bg-rose-950/60 border border-rose-800 text-rose-200 text-sm rounded p-3">
              {error}
            </div>
          )}
        </section>
      </div>

      {/* ── Phase 4 — Statistical Analysis (GLI Audit View) ──────────────── */}
      {batchStats ? (
        <section className="max-w-6xl mx-auto mt-6 bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <div className="flex flex-wrap items-end justify-between gap-2 mb-4">
            <div>
              <h2 className="text-lg font-semibold tracking-wide">
                Last Batch Run — Statistical Analysis (GLI Audit View)
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Aggregated roll-up of the most recent Monte Carlo batch run.
              </p>
            </div>
            <div className="text-[11px] tabular-nums text-slate-400 text-right">
              <div>
                Run:{" "}
                <span className="text-slate-200 font-semibold">
                  {batchStats.completed.toLocaleString()}
                </span>{" "}
                / {batchStats.size.toLocaleString()} spins ·{" "}
                <span className="text-slate-200">{(batchStats.durationMs / 1000).toFixed(2)}s</span>
              </div>
              <div className="text-slate-500">
                auth={batchStats.authMode} · started{" "}
                {new Date(batchStats.startedAt).toLocaleTimeString()}
                {batchStats.finishedAt
                  ? ` · finished ${new Date(batchStats.finishedAt).toLocaleTimeString()}`
                  : " · running…"}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <StatTile label="Total Simulated Turnover" value={fmtPrecise(batchStats.turnover)} accent="text-slate-100" />
            <StatTile label="Total Pool Captured" value={fmtPrecise(batchStats.poolTotal)} accent="text-emerald-300" />
            <StatTile label="Total Seed Captured" value={fmtPrecise(batchStats.seedTotal)} accent="text-sky-300" />
            <StatTile label="Total House Rake" value={fmtPrecise(batchStats.houseTotal)} accent="text-amber-300" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            <StatTile
              label="Pool + Seed Return %"
              value={
                batchStats.turnover > 0
                  ? `${(((batchStats.poolTotal + batchStats.seedTotal) / batchStats.turnover) * 100).toFixed(4)}%`
                  : "—"
              }
              accent="text-emerald-300"
            />
            <StatTile
              label="House Edge %"
              value={
                batchStats.turnover > 0
                  ? `${((batchStats.houseTotal / batchStats.turnover) * 100).toFixed(4)}%`
                  : "—"
              }
              accent="text-amber-300"
            />
            <StatTile
              label="Σ Total Contribution"
              value={fmtPrecise(batchStats.totalContribution)}
              accent="text-slate-100"
            />
          </div>

          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400 mb-2">
              Hit Frequency Checklist
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <StatTile
                label="Jackpot Drops Triggered"
                value={batchStats.hits.toLocaleString()}
                accent="text-emerald-300"
              />
              <StatTile
                label="Community Drops"
                value={batchStats.communityHits.toLocaleString()}
                accent="text-pink-300"
              />
              <StatTile
                label="Hit Frequency"
                value={
                  batchStats.hits > 0
                    ? `1 in ${Math.round(batchStats.ok / batchStats.hits).toLocaleString()} · ${(
                        (batchStats.hits / Math.max(batchStats.ok, 1)) *
                        100
                      ).toFixed(3)}%`
                    : "—"
                }
                accent="text-slate-100"
              />
              <StatTile
                label="Idempotent Replays"
                value={batchStats.idempotentReplays.toLocaleString()}
                accent={batchStats.idempotentReplays === 0 ? "text-slate-300" : "text-rose-300"}
              />
              <StatTile
                label="Blocked Responses"
                value={batchStats.blocked.toLocaleString()}
                accent={
                  batchStats.authMode === "authorized"
                    ? batchStats.blocked === 0
                      ? "text-slate-300"
                      : "text-rose-300"
                    : "text-amber-300"
                }
              />
            </div>
          </div>

          {Object.keys(batchStats.perJackpot).length > 0 ? (
            <div className="mt-5">
              <div className="text-xs uppercase tracking-wider text-slate-400 mb-2">
                Per-Tier Breakdown
              </div>
              <div className="overflow-x-auto border border-slate-800 rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium">Tier</th>
                      <th className="text-right px-3 py-2 font-medium">Spins</th>
                      <th className="text-right px-3 py-2 font-medium">Σ Pool</th>
                      <th className="text-right px-3 py-2 font-medium">Σ Seed</th>
                      <th className="text-right px-3 py-2 font-medium">Σ House</th>
                      <th className="text-right px-3 py-2 font-medium">Σ Total</th>
                      <th className="text-right px-3 py-2 font-medium">Hits</th>
                      <th className="text-right px-3 py-2 font-medium">Hit Freq</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {Object.values(batchStats.perJackpot)
                      .slice()
                      .sort((a, b) => {
                        const ra = pools.find((p) => p.id === a.jackpotId)?.tierRank ?? 999;
                        const rb = pools.find((p) => p.id === b.jackpotId)?.tierRank ?? 999;
                        if (ra !== rb) return ra - rb;
                        return a.jackpotName.localeCompare(b.jackpotName);
                      })
                      .map((row) => (
                        <tr key={row.jackpotId} className="hover:bg-slate-950/40">
                          <td className="px-3 py-1.5 text-slate-200">{row.jackpotName}</td>
                          <td className="px-3 py-1.5 text-right tabular-nums text-slate-300">
                            {row.spins.toLocaleString()}
                          </td>
                          <td className="px-3 py-1.5 text-right tabular-nums text-emerald-300">
                            {fmtPrecise(row.poolTotal)}
                          </td>
                          <td className="px-3 py-1.5 text-right tabular-nums text-sky-300">
                            {fmtPrecise(row.seedTotal)}
                          </td>
                          <td className="px-3 py-1.5 text-right tabular-nums text-amber-300">
                            {fmtPrecise(row.houseTotal)}
                          </td>
                          <td className="px-3 py-1.5 text-right tabular-nums text-slate-100">
                            {fmtPrecise(row.totalContribution)}
                          </td>
                          <td className="px-3 py-1.5 text-right tabular-nums text-emerald-300">
                            {row.hits.toLocaleString()}
                          </td>
                          <td className="px-3 py-1.5 text-right tabular-nums text-slate-300">
                            {row.hits > 0
                              ? `1 in ${Math.round(row.spins / row.hits).toLocaleString()}`
                              : "—"}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}


      {/* ── Phase 3 — Compliance Audit Ledger (GLI-12 Log) ─────────────── */}
      <section className="max-w-6xl mx-auto mt-6 bg-slate-900/60 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
          <div>
            <h2 className="text-lg font-semibold tracking-wide">
              Compliance Audit Ledger (GLI-12 Log)
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Append-only in-memory ledger. Every successful S2S bet writes one
              immutable slice. Newest pinned to top.
            </p>
          </div>
          <div className="text-[11px] tabular-nums text-slate-400">
            <span className="text-emerald-300 font-semibold">{auditEntries.length}</span>
            <span className="text-slate-500"> / {auditCap} entries · newest first</span>
          </div>
        </div>
        <div className="overflow-x-auto border border-slate-800 rounded-lg">
          <table className="w-full text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="text-left px-2 py-2 font-medium">Time</th>
                <th className="text-left px-2 py-2 font-medium">Txn ID</th>
                <th className="text-left px-2 py-2 font-medium">Game</th>
                <th className="text-left px-2 py-2 font-medium">Segments</th>
                <th className="text-right px-2 py-2 font-medium">Wager</th>
                <th className="text-right px-2 py-2 font-medium">Pool Δ</th>
                <th className="text-right px-2 py-2 font-medium">Seed Δ</th>
                <th className="text-right px-2 py-2 font-medium">House Δ</th>
                <th className="text-right px-2 py-2 font-medium">Total</th>
                <th className="text-left px-2 py-2 font-medium">RNG</th>
                <th className="text-left px-2 py-2 font-medium">Win</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {auditEntries.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-3 py-6 text-center text-slate-500">
                    No audit slices recorded yet. Trigger an authorized S2S spin to populate the ledger.
                  </td>
                </tr>
              ) : (
                auditEntries.map((e) => {
                  const win = e.win as
                    | { amount?: number; isCommunity?: boolean }
                    | null;
                  return (
                    <tr
                      key={`${e.transactionId}-${e.loggedAt}`}
                      className={`transition-colors ${
                        flashTxnId === e.transactionId
                          ? "bg-emerald-500/10"
                          : "hover:bg-slate-950/40"
                      }`}
                    >
                      <td className="px-2 py-1.5 tabular-nums text-slate-300 font-mono">
                        {fmtAuditTime(e.loggedAt)}
                      </td>
                      <td
                        className="px-2 py-1.5 font-mono text-slate-400"
                        title={e.transactionId}
                      >
                        {truncMiddle(e.transactionId, 8, 4)}
                      </td>
                      <td className="px-2 py-1.5 text-slate-300">{e.gameId}</td>
                      <td className="px-2 py-1.5">
                        {e.playerSegments.length === 0 ? (
                          <span className="text-slate-600">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {e.playerSegments.map((s) => (
                              <span
                                key={s}
                                className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-slate-200">
                        {fmtPrecise(e.wager)}
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-emerald-300">
                        {fmtPrecise(e.contribution.pool)}
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-sky-300">
                        {fmtPrecise(e.contribution.seed)}
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-amber-300">
                        {fmtPrecise(e.contribution.house)}
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-slate-200 font-semibold">
                        {fmtPrecise(e.totalContribution)}
                      </td>
                      <td className="px-2 py-1.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] ${
                            e.rngSource === "external"
                              ? "bg-indigo-500/20 text-indigo-200"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {e.rngSource}
                        </span>
                      </td>
                      <td className="px-2 py-1.5">
                        {win && typeof win.amount === "number" ? (
                          <span className="inline-flex items-center gap-1">
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-200 text-[10px] font-semibold tabular-nums">
                              {fmtPrecise(win.amount)}
                            </span>
                            {win.isCommunity ? (
                              <span className="px-1 py-0.5 rounded bg-pink-500/20 text-pink-200 text-[10px]">
                                community
                              </span>
                            ) : null}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>







      {/* ── Double-contribution compliance modal ──────────────── */}
      {pendingOptIn && (
        <div
          className="jooba-modal-backdrop"
          onClick={() => setPendingOptIn(null)}
        >
          <div
            className="jooba-modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="jooba-modal-title">Double-Contribution Notice</div>
            <p className="jooba-modal-body">
              Enrolling in <strong>{pendingOptIn.name}</strong> will add an
              independent contribution fee per bet to fund this secondary prize pool.
              Your new total jackpot cost will be updated to{" "}
              <strong>{fmt(projectedFee)} per spin</strong>.
            </p>
            <div className="jooba-modal-actions">
              <button
                className="jooba-btn jooba-btn-secondary"
                onClick={() => setPendingOptIn(null)}
              >
                Cancel
              </button>
              <button
                className="jooba-btn jooba-btn-primary"
                onClick={confirmPendingOptIn}
              >
                Agree &amp; Join Both
              </button>
            </div>
          </div>
        </div>
      )}

      {showQaSuite && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="QA Compliance Test Suite"
          className="fixed inset-0 z-[1000] bg-slate-950/80 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowQaSuite(false);
          }}
        >
          <div className="my-8 w-full max-w-4xl bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-800 bg-slate-900/95 backdrop-blur rounded-t-2xl">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-emerald-400">
                  GLI-12 / GLI-19 · Operator Guide
                </div>
                <h2 className="text-xl font-bold text-slate-100">
                  📋 QA Compliance Test Suite Overview
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Six certifiable scenarios. Each card shows ➜ where to act and 🔍 where the
                  evidence will land.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowQaSuite(false)}
                className="shrink-0 rounded-md border border-slate-700 hover:border-slate-500 hover:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {QA_TEST_CASES.map((tc) => (
                <article
                  key={tc.id}
                  className="bg-slate-950/60 border border-slate-800 hover:border-emerald-500/40 transition rounded-xl p-4 flex flex-col gap-3"
                >
                  <header className="flex items-start gap-3">
                    <span className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-300 text-sm font-bold border border-emerald-500/30">
                      {tc.id}
                    </span>
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-emerald-400/80">
                        Test Case {tc.id}
                      </div>
                      <h3 className="text-sm font-semibold text-slate-100 leading-snug">
                        {tc.title}
                      </h3>
                    </div>
                  </header>

                  <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 p-3">
                    <div className="text-[10px] uppercase tracking-wider text-sky-300 font-semibold mb-1">
                      ➜ Input Direction
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{tc.input}</p>
                  </div>

                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                    <div className="text-[10px] uppercase tracking-wider text-amber-300 font-semibold mb-1">
                      🔍 Where To Look For Results
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{tc.result}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between gap-3 text-[11px] text-slate-500">
              <span>
                Tip: keep this panel open on a second monitor while running the suite.
              </span>
              <button
                type="button"
                onClick={() => setShowQaSuite(false)}
                className="rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 px-3 py-1.5 text-xs font-semibold text-emerald-200"
              >
                Got it — Close
              </button>
            </div>
          </div>
        </div>
      )}

      {celebrating && (
        <div
          className="jooba-fs-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Jackpot win"
          onClick={closeCelebration}
        >
          <div className="jooba-fs-confetti" aria-hidden>
            {Array.from({ length: 120 }).map((_, i) => (
              <span key={i} style={{ ["--i" as never]: i }} />
            ))}
          </div>
          <div className="jooba-fs-panel" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="jooba-fs-close"
              onClick={closeCelebration}
              aria-label="Close win animation"
            >
              ×
            </button>
            <div className="jooba-fs-coin" aria-hidden>€</div>
            <div
              className="jooba-fs-title"
              dangerouslySetInnerHTML={{ __html: texts.winMessage }}
            />
            {lastWinInfo?.jackpotName && (
              <div className="jooba-fs-sub">{lastWinInfo.jackpotName}</div>
            )}
            {typeof lastWinInfo?.amount === "number" && lastWinInfo.amount > 0 && (
              <div className="jooba-fs-amount">{fmt(lastWinInfo.amount)}</div>
            )}
            {lastCommunity && (
              <div className="jooba-fs-community">
                <div className="jooba-fs-community-badge">Community Payout Triggered</div>
                <div>
                  Triggering Winner Payout: <strong>{fmt(lastCommunity.triggeringPayout)}</strong>
                </div>
                <div>
                  Community Split: <strong>{fmt(lastCommunity.communityPool)}</strong> across{" "}
                  <strong>{lastCommunity.communitySize}</strong> players (
                  <strong>{fmt(lastCommunity.communityMemberPayOut)}</strong> each).
                </div>
                {lastCommunity.cappedDelta > 0 && (
                  <div className="jooba-fs-community-cap">
                    Per-member cap applied — delta {fmt(lastCommunity.cappedDelta)} returned to house.
                  </div>
                )}
              </div>
            )}
            <button type="button" className="jooba-fs-cta" onClick={closeCelebration}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-950/60 border border-slate-800 rounded p-2 flex items-center justify-between">
      <span className="text-slate-500 uppercase text-[10px]">{label}</span>
      <span className="font-semibold tabular-nums text-slate-200">{value}</span>
    </div>
  );
}

function StatTile({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`mt-1 font-semibold tabular-nums text-base ${accent}`}>{value}</div>
    </div>
  );
}

function Split({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-slate-950/60 border border-slate-800 rounded p-2 text-center">
      <div className="text-[10px] uppercase text-slate-500">{label}</div>
      <div className={`font-semibold tabular-nums ${color}`}>{fmt(value)}</div>
    </div>
  );
}

// ── Inline CSS for the widget shell + confetti burst ────────────────────────
const widgetCss = `
.jooba-widget-wrapper { width: 320px; }
.jooba-widget {
  background: linear-gradient(160deg, #0f172a 0%, #1e293b 100%);
  border: 1px solid #334155;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,.4);
}
.jooba-widget-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px; background: rgba(0,0,0,.25);
  border-bottom: 1px solid #1e293b; gap: 8px;
}
.jooba-widget-current-amount {
  flex: 1; text-align: center;
  font-size: 22px; font-weight: 800; color: #facc15;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 0 12px rgba(250,204,21,.35);
}
.jooba-widget-actions-bar { display: flex; gap: 6px; }
.jooba-icon-btn {
  width: 26px; height: 26px; border-radius: 6px; border: 1px solid #334155;
  background: #0f172a; color: #94a3b8; font-size: 12px; cursor: pointer;
}
.jooba-nav-btn {
  width: 30px; height: 30px; font-size: 18px; line-height: 1;
  color: #e2e8f0;
}
.jooba-nav-btn:disabled { opacity: .35; cursor: not-allowed; }
.jooba-widget-body {
  padding: 18px 0 12px; display: flex; flex-direction: column;
  align-items: center; gap: 10px; min-height: 200px; position: relative;
  overflow: hidden;
}
.jooba-carousel { width: 100%; overflow: hidden; }
.jooba-carousel-track {
  display: flex; transition: transform 280ms ease;
}
.jooba-slide {
  flex: 0 0 100%; padding: 0 14px;
  display: flex; flex-direction: column; align-items: center; gap: 8px;
}
.jooba-coin {
  width: 88px; height: 88px; border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #fde047, #b45309);
  display: flex; align-items: center; justify-content: center;
  font-size: 44px; font-weight: 900; color: #422006;
  box-shadow: 0 0 30px rgba(250,204,21,.4), inset 0 -6px 0 rgba(0,0,0,.2);
  animation: jooba-spin 6s linear infinite;
}
@keyframes jooba-spin { to { transform: rotateY(360deg); } }
.jooba-jackpot-name { font-weight: 600; color: #e2e8f0; }
.jooba-badge {
  font-size: 10px; font-weight: 800; letter-spacing: .08em;
  padding: 2px 8px; border-radius: 999px; text-transform: uppercase;
}
.jooba-badge-split { background: rgba(16,185,129,.15); color: #6ee7b7; border: 1px solid rgba(16,185,129,.35); }
.jooba-badge-additive { background: rgba(244,114,182,.15); color: #f9a8d4; border: 1px solid rgba(244,114,182,.4); }
.jooba-info-label { font-size: 12px; color: #94a3b8; text-align: center; }
.jooba-tier-list {
  display: flex; flex-direction: column; gap: 4px;
  width: 100%; max-width: 260px;
  padding: 8px 12px; margin: 4px 0;
  border-radius: 8px;
  background: rgba(15,23,42,.6);
  border: 1px solid rgba(148,163,184,.2);
}
.jooba-tier-row {
  display: flex; justify-content: space-between; align-items: baseline;
  font-size: 12px; gap: 12px;
}
.jooba-tier-name { color: #cbd5e1; font-weight: 500; }
.jooba-tier-amount { color: #facc15; font-weight: 700; font-variant-numeric: tabular-nums; }
.jooba-dots { display: flex; gap: 6px; padding: 4px 0 0; }
.jooba-dot {
  width: 8px; height: 8px; border-radius: 50%; border: none;
  background: #334155; cursor: pointer; padding: 0;
}
.jooba-dot-active { background: #facc15; box-shadow: 0 0 8px rgba(250,204,21,.6); }

.jooba-widget-footer {
  padding: 12px 14px; border-top: 1px solid #1e293b; background: rgba(0,0,0,.15);
  display: flex; flex-direction: column; gap: 10px;
}
.jooba-widget-buttons-opt-wrapper { display: flex; gap: 8px; }
.jooba-btn {
  flex: 1; padding: 10px 14px; border-radius: 8px; border: none;
  font-weight: 700; cursor: pointer; font-size: 14px;
}
.jooba-btn-primary { background: #10b981; color: #022c22; }
.jooba-btn-secondary { background: #334155; color: #e2e8f0; }

.jooba-fee-row {
  display: flex; align-items: baseline; gap: 6px;
  font-size: 12px; color: #cbd5e1;
}
.jooba-fee-label-prefix { color: #94a3b8; }
.jooba-fee-value {
  font-weight: 800; color: #facc15; font-variant-numeric: tabular-nums;
  animation: jooba-fee-pulse 380ms ease;
}
.jooba-fee-multi {
  font-size: 10px; font-weight: 700; letter-spacing: .06em;
  color: #f9a8d4; text-transform: uppercase;
}
@keyframes jooba-fee-pulse {
  0% { transform: scale(.85); color: #fff; }
  60% { transform: scale(1.12); color: #fde047; }
  100% { transform: scale(1); color: #facc15; }
}

.jooba-celebration {
  position: relative; width: 100%; min-height: 180px;
  display: flex; align-items: center; justify-content: center;
}
.jooba-win-message {
  position: relative; z-index: 2; text-align: center;
  font-size: 22px; font-weight: 900; line-height: 1.2;
  color: #fde047; text-shadow: 0 0 20px rgba(250,204,21,.6);
  animation: jooba-pop 0.5s ease-out;
}
@keyframes jooba-pop {
  0% { transform: scale(0.4); opacity: 0; }
  60% { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(1); }
}

.jooba-modal-backdrop {
  position: fixed; inset: 0; background: rgba(2,6,23,.75);
  display: flex; align-items: center; justify-content: center;
  z-index: 100; padding: 20px;
  animation: jooba-fade-in 180ms ease;
}
.jooba-modal {
  background: linear-gradient(160deg, #1e293b 0%, #0f172a 100%);
  border: 1px solid #f472b6; border-radius: 14px;
  padding: 24px; max-width: 440px; width: 100%;
  box-shadow: 0 30px 80px rgba(0,0,0,.6), 0 0 40px rgba(244,114,182,.2);
  animation: jooba-modal-in 220ms cubic-bezier(.2,.9,.3,1.2);
}
.jooba-modal-title {
  font-size: 18px; font-weight: 800; color: #f9a8d4;
  margin-bottom: 10px;
}
.jooba-modal-body {
  font-size: 14px; line-height: 1.5; color: #cbd5e1; margin: 0 0 18px;
}
.jooba-modal-body strong { color: #facc15; }
.jooba-modal-actions { display: flex; gap: 10px; }
@keyframes jooba-fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes jooba-modal-in {
  from { transform: translateY(20px) scale(.95); opacity: 0; }
  to { transform: translateY(0) scale(1); opacity: 1; }
}
`;

const confettiCss = `
.jooba-confetti {
  position: absolute; inset: 0; overflow: hidden; pointer-events: none; z-index: 1;
}
.jooba-confetti span {
  position: absolute; top: 50%; left: 50%;
  width: 8px; height: 14px; border-radius: 2px;
  background: hsl(calc(var(--i) * 60deg), 90%, 60%);
  transform-origin: center;
  animation: jooba-burst 1.6s ease-out forwards;
  animation-delay: calc(var(--i) * 8ms);
}
@keyframes jooba-burst {
  0% { transform: translate(-50%, -50%) rotate(0deg) translateY(0) scale(1); opacity: 1; }
  100% {
    transform:
      translate(-50%, -50%)
      rotate(calc(var(--i) * 23deg))
      translateY(calc(-80px - (var(--i) * 2px)))
      rotate(720deg)
      scale(0.6);
    opacity: 0;
  }
}

/* ── Full-screen jackpot win overlay ─────────────────────────────────── */
.jooba-fs-backdrop {
  position: fixed; inset: 0; z-index: 9999;
  background: radial-gradient(ellipse at center, rgba(76,29,149,.85) 0%, rgba(2,6,23,.94) 70%);
  display: flex; align-items: center; justify-content: center;
  padding: 24px; backdrop-filter: blur(6px);
  animation: jooba-fade-in 220ms ease;
}
.jooba-fs-confetti {
  position: absolute; inset: 0; overflow: hidden; pointer-events: none;
}
.jooba-fs-confetti span {
  position: absolute; top: 50%; left: 50%;
  width: 10px; height: 18px; border-radius: 2px;
  background: hsl(calc(var(--i) * 30deg), 95%, 62%);
  transform-origin: center;
  animation: jooba-fs-burst 2.4s ease-out infinite;
  animation-delay: calc(var(--i) * 18ms);
  box-shadow: 0 0 8px rgba(255,255,255,.4);
}
@keyframes jooba-fs-burst {
  0%   { transform: translate(-50%,-50%) rotate(0) translateY(0) scale(1); opacity: 1; }
  100% {
    transform:
      translate(-50%,-50%)
      rotate(calc(var(--i) * 17deg))
      translateY(calc(-40vh - (var(--i) * 1.5px)))
      rotate(900deg) scale(.5);
    opacity: 0;
  }
}
.jooba-fs-panel {
  position: relative; z-index: 1;
  background: linear-gradient(160deg, #1e1b4b 0%, #0f172a 100%);
  border: 2px solid #facc15;
  border-radius: 20px;
  padding: 40px 36px 28px;
  max-width: 520px; width: 100%;
  text-align: center;
  box-shadow:
    0 40px 100px rgba(0,0,0,.7),
    0 0 80px rgba(250,204,21,.35),
    inset 0 1px 0 rgba(255,255,255,.08);
  animation: jooba-modal-in 320ms cubic-bezier(.2,.9,.3,1.3);
}
.jooba-fs-close {
  position: absolute; top: 12px; right: 14px;
  width: 36px; height: 36px; border-radius: 999px;
  background: rgba(255,255,255,.08); color: #fde047;
  border: 1px solid rgba(250,204,21,.4);
  font-size: 22px; line-height: 1; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background .2s, transform .2s;
}
.jooba-fs-close:hover { background: rgba(250,204,21,.2); transform: scale(1.08); }
.jooba-fs-coin {
  width: 92px; height: 92px; margin: 0 auto 16px;
  border-radius: 999px;
  background: radial-gradient(circle at 30% 30%, #fef3c7, #f59e0b 60%, #b45309);
  color: #78350f; font-size: 52px; font-weight: 900;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 10px 30px rgba(245,158,11,.5), inset 0 -6px 12px rgba(0,0,0,.2);
  animation: jooba-coin-spin 2s ease-in-out infinite;
}
@keyframes jooba-coin-spin {
  0%, 100% { transform: rotateY(0deg) scale(1); }
  50%      { transform: rotateY(180deg) scale(1.06); }
}
.jooba-fs-title {
  font-size: 32px; font-weight: 900; line-height: 1.15;
  color: #fde047; text-shadow: 0 0 24px rgba(250,204,21,.7);
  margin-bottom: 8px;
  animation: jooba-pop .6s ease-out;
}
.jooba-fs-sub {
  font-size: 13px; font-weight: 700; letter-spacing: .12em;
  text-transform: uppercase; color: #f9a8d4; margin-bottom: 14px;
}
.jooba-fs-amount {
  font-size: 44px; font-weight: 900; color: #fff;
  font-variant-numeric: tabular-nums; margin: 8px 0 18px;
  text-shadow: 0 0 30px rgba(255,255,255,.4);
  animation: jooba-pop .8s ease-out;
}
.jooba-fs-community {
  text-align: left; font-size: 12px; color: #d1fae5;
  background: rgba(16,185,129,.12); border: 1px solid rgba(52,211,153,.45);
  border-radius: 12px; padding: 12px 14px; margin: 6px 0 18px;
  display: flex; flex-direction: column; gap: 4px;
}
.jooba-fs-community-badge {
  align-self: flex-start;
  font-size: 10px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase;
  background: #10b981; color: #022c22;
  padding: 3px 8px; border-radius: 999px; margin-bottom: 4px;
}
.jooba-fs-community strong { color: #fde047; }
.jooba-fs-community-cap { color: #fcd34d; }
.jooba-fs-cta {
  margin-top: 6px;
  background: linear-gradient(135deg, #facc15, #f59e0b);
  color: #1e293b; font-weight: 800; letter-spacing: .04em;
  padding: 10px 28px; border: none; border-radius: 999px;
  cursor: pointer; font-size: 14px;
  box-shadow: 0 6px 20px rgba(245,158,11,.5);
  transition: transform .15s, box-shadow .15s;
}
.jooba-fs-cta:hover { transform: translateY(-1px); box-shadow: 0 8px 28px rgba(245,158,11,.7); }
`;
