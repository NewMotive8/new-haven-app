import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';



import { useNavigate, useRouterState } from '@tanstack/react-router';
import { Clock, LogOut, Plus, X, Zap, Flame, TrendingUp, Trophy, Gem, Dice5, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import widgetMegaJewels from '@/assets/jackpot/49be07c2aa32ea34e1f195b6465caaaa19fbba64.png';
import widgetSuperMega from '@/assets/jackpot/244780cbffaf9d0b9bf83126f279bedf5609642e.png';
import widgetGoldenHarvest from '@/assets/jackpot/f033c6caa6105be44a8d53aa1abee2e5d474a512.png';
import widgetCyberNeon from '@/assets/jackpot/575536f44a49439391db5b61fc21c21dc03d8e65.png';
import { sanitizeIncomingDraft } from '@/lib/jackpot/hydrate-draft';
import { TriggerProbabilityPanel } from '@/components/jackpot/TriggerProbabilityPanel';
import {
  PrizeEconomySelector,
  normalizePrizeEconomy,
  DEFAULT_PRIZE_ECONOMY,
  type PrizeEconomyValue,
} from '@/components/jackpot/PrizeEconomySelector';

// Helpers hoisted to module scope so their identity is stable across renders
// (declaring them inside the component unmounts inputs on every keystroke and
// steals focus, making fields un-typeable).
const BrightLabel = ({ htmlFor, children, className = '' }: { htmlFor?: string; children: React.ReactNode; className?: string }) => (
  <Label htmlFor={htmlFor} className={`text-neutral-100 ${className}`}>{children}</Label>
);

const CurrencyInput = ({ id, ...props }: React.ComponentProps<typeof Input> & { id: string }) => (
  <div className="relative">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">€</span>
    <Input id={id} {...props} className={`pl-8 ${props.className || ''}`} />
  </div>
);

const PercentageInput = ({ id, ...props }: React.ComponentProps<typeof Input> & { id: string }) => (
  <div className="relative">
    <Input id={id} {...props} className={props.className || ''} />
    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">%</span>
  </div>
);

const formatWeightDraft = (value: number) => (Number.isFinite(value) ? `${value}` : '0');

const WeightDraftInput = ({
  value,
  onCommit,
  className = '',
}: {
  value: number;
  onCommit: (next: number) => void;
  className?: string;
}) => {
  const [draft, setDraft] = useState(formatWeightDraft(value));
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setDraft(formatWeightDraft(value));
    }
  }, [value, isEditing]);

  const commit = () => {
    setIsEditing(false);
    const raw = draft.trim();

    if (raw === '' || raw === '.') {
      setDraft('0');
      onCommit(0);
      return;
    }

    const next = Number(raw);
    if (!Number.isFinite(next)) {
      setDraft(formatWeightDraft(value));
      return;
    }

    onCommit(next);
  };

  return (
    <Input
      type="text"
      inputMode="decimal"
      value={draft}
      onFocus={() => setIsEditing(true)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.currentTarget.blur();
        }
      }}
      onChange={(e) => {
        const raw = e.target.value;
        if (!/^\d*\.?\d*$/.test(raw)) return;
        setDraft(raw);
      }}
      className={className}
    />
  );
};

const formatAmountDraft = (value: number) => (Number.isFinite(value) && value !== 0 ? `${value}` : '');

const AmountDraftInput = ({
  id,
  value,
  onCommit,
  className = '',
  ...rest
}: {
  id?: string;
  value: number;
  onCommit: (next: number) => void;
  className?: string;
} & Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange' | 'onBlur' | 'onFocus' | 'onKeyDown' | 'type'>) => {
  const [draft, setDraft] = useState(formatAmountDraft(value));
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isEditing) setDraft(formatAmountDraft(value));
  }, [value, isEditing]);

  const commit = () => {
    setIsEditing(false);
    const raw = draft.trim().replace(',', '.');
    if (raw === '' || raw === '.') {
      onCommit(0);
      setDraft('');
      return;
    }
    const next = Number(raw);
    if (!Number.isFinite(next)) {
      setDraft(formatAmountDraft(value));
      return;
    }
    onCommit(next);
  };

  return (
    <Input
      id={id}
      type="text"
      inputMode="decimal"
      value={draft}
      onFocus={() => setIsEditing(true)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
      onChange={(e) => {
        const raw = e.target.value.replace(',', '.');
        if (!/^\d*\.?\d*$/.test(raw)) return;
        setDraft(raw);
      }}
      className={className}
      {...rest}
    />
  );
};

export type PayoutModel = 'fixed' | 'average' | 'maximum';
export type ContributionType = 'fixed' | 'percentage';
export type JackpotType = 'classic' | 'must_drop' | 'multi_level' | 'frequency';
export type RecurrenceType = 'single' | 'daily' | 'weekly' | 'monthly';
export type DisplayFrequency = 'daily' | 'weekly' | 'monthly';

export type WalletType = 'internal' | 'external';

export type JackpotSavePayload = {
  name: string;
  description: string;
  // Prize Economy & Wallet Type — backend contract primitives.
  walletType: WalletType;
  currencyId: string | null;
  amountScale: number;
  type: JackpotType;
  payoutModel: PayoutModel;
  contributionType: ContributionType;
  seedContributionType: ContributionType;
  volatility: number;
  playerContribution: number;
  operatorContribution: number;
  seedPlayerContribution: number;
  seedOperatorContribution: number;
  poolPercentageValue: number;
  seedPercentageValue: number;
  recurrenceType: RecurrenceType;
  weeklyDay: string;
  monthlyDay: string;
  displayFrequency: DisplayFrequency;
  weeklyFrequencyDay: string;
  monthlyFrequencyDay: string;
  separateContributionFrequency: boolean;
  payoutInterval: string;
  isSegmented: boolean;
  segments: string[];
  isCommunity: boolean;
  communitySplit: number;
  // Community Win Mechanics — mirrors Java Community.java
  communityPayoutIntervalSeconds?: number;
  communityMaxWinAmount?: number;
  communityMaxPlayers?: number;
  community?: {
    enabled: boolean;
    split: number;
    payoutInterval: string;
    payoutIntervalSeconds?: number;
    maximumWinAmount: number;
    maximumNumberOfPlayers: number;
  };
  isTemplate: boolean;
  selectedWidget: string;
  fixedWinAmount: number;
  averageWinAmount: number;
  minWinAmount: number;
  maxWinAmount: number;
  minWagerAmount: number;
  maxWagerAmount: number;
  reseedingAmount: number;
  maximumSeedAmount: number;
  initialPoolAmount?: number;
  // --- Optional: MUST_DROP / FREQUENCY virtual lifespan (minutes).
  lifespanMinutes?: number;
  mustDropPeriod?: 1 | 2 | 3 | 4;
  // --- Optional: MULTI_LEVEL tier rows (2–4 entries). When present, the
  //     payload→config mapper produces a tiered JackpotConfigDTO.
  tiers?: Array<{
    label?: string;
    multiLevelTier: number;        // 1..4
    multiLevelWeight: number;      // 0..1
    reseedingAmount: number;       // pool minimum / reseed amount
    maximumPoolAmount?: number;    // pool cap (0 = uncapped)
    minWinAmount: number;
    maxWinAmount: number;
    averageWinAmount: number;
    poolContributionType?: "fixed" | "percentage";
    poolContributionAmount?: number;
    seedContributionType?: "fixed" | "percentage";
    seedContributionAmount?: number;
    seedInitialAmount?: number;    // seed starting balance
    seedTargetAmount?: number;     // seed target (cap)
    operatorShare?: number;        // pool, 0..100
    seedOperatorShare?: number;    // seed, 0..100
    // ── v2: per-tier 3-way contribution split + fixed-odds trigger.
    contributionMode?: 'legacy' | 'split';
    totalContributionAmount?: number;
    totalContributionType?: 'fixed' | 'percentage';
    poolWeight?: number;           // 0..100
    seedWeight?: number;           // 0..100
    houseWeight?: number;          // 0..100, sum===100
    triggerOdds?: number;          // denominator N (0/undef = disabled)
  }>;
  // ── v2: jackpot-level 3-way contribution split + fixed-odds trigger.
  contributionMode?: 'legacy' | 'split';
  totalContributionAmount?: number;
  totalContributionType?: 'fixed' | 'percentage';
  poolWeight?: number;
  seedWeight?: number;
  houseWeight?: number;
  triggerOdds?: number;

  // ── Frequency Happy Hour (calendar-gated). Serialised as JSON strings on save.
  freqInterval?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  freqDay?: string;
  contribStartTime?: string;
  contribEndTime?: string;
  winStartTime?: string;
  winEndTime?: string;
  cloneContribToWin?: boolean;
  contributionFrequency?: string;
  winFrequency?: string;

  // ── Operation Safeguards — global per-jackpot caps (Must-Drop & Frequency).
  maxNumberOfWins?: number;
  maxTotalPayout?: number;

  /**
   * Direct House skim, 0..100. Percentage of every player contribution that
   * is routed to casino House Revenue before funding pool/seed. The engine
   * maps this to a 3-way contribution split with houseWeight = operatorShare.
   */
  operatorShare?: number;

  previewWager?: number;
  /** When true, persist with enabled=false and tag config.isDraft=true. */
  isDraft?: boolean;
  // ── Eligibility & Rules Engine — game/event targeting metadata.
  eligibility?: {
    vertical: 'casino' | 'sportsbook';
    casino?: {
      categories: string[];
      providers: string[];
      gameIds: string[];
    };
    sportsbook?: {
      betType: 'live' | 'prematch' | 'all';
      sportType: string;
      leagues: string[];
      matchIds: string[];
    };
    players?: {
      audienceMode: 'all' | 'custom';
      vipTiers: string[];
      crmSegmentsInclude: string[];
      crmSegmentsExclude: string[];
      restrictedCountries: string[];
      blacklistedPlayerIds: string[];
      includedPlayerIds: string[];
    };
  };

};


export interface JackpotCreationFormProps {
  onSave: (payload: JackpotSavePayload) => void | Promise<void>;
  submitting?: boolean;
  onCancel?: () => void;
  /** Pre-populate the form when editing/cloning an existing jackpot. Takes
   *  precedence over router-state-based hydration. */
  initialDraft?: JackpotSavePayload;
  /** Customize the primary submit button label (e.g. "Save changes"). */
  saveLabel?: string;
  /** When editing an existing jackpot, the DB id is forwarded through the
   *  simulator hand-off so Save issues a PUT instead of a POST. */
  editId?: number;
}

// Draft hydration / sanitization lives in @/lib/jackpot/hydrate-draft and is
// shared with the MultiJackpot wizard so both forms enforce identical rules.



export function JackpotCreationForm({ onSave, submitting = false, onCancel, initialDraft, saveLabel: _saveLabel, editId }: JackpotCreationFormProps) {
  const navigate = useNavigate();
  const incoming = useRouterState({
    select: (s) => s.location.state as { jackpotConfig?: JackpotSavePayload } | undefined,
  });
  // Capture once on mount so re-renders don't clobber user edits.
  // initialDraft prop wins over router state; both are sanitized.
  const initial = useRef<JackpotSavePayload | undefined>(
    sanitizeIncomingDraft(initialDraft ?? incoming?.jackpotConfig),
  ).current;

  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeSection, setActiveSection] = useState('basic');

  // Jackpot type selection
  const [selectedType, setSelectedType] = useState<JackpotType>(initial?.type ?? 'classic');
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');

  // Prize Economy & Wallet Type — drives currency selector + amountScale.
  const [prizeEconomy, setPrizeEconomy] = useState<PrizeEconomyValue>(
    normalizePrizeEconomy({
      walletType: initial?.walletType,
      currencyId: initial?.currencyId ?? null,
      amountScale: initial?.amountScale,
    }) || DEFAULT_PRIZE_ECONOMY,
  );

  // Form state
  const [payoutModel, setPayoutModel] = useState<PayoutModel>(initial?.payoutModel ?? 'maximum');
  const [contributionType, setContributionType] = useState<ContributionType>(initial?.contributionType ?? 'fixed');
  const [seedContributionType, setSeedContributionType] = useState<ContributionType>(initial?.seedContributionType ?? 'fixed');
  const [volatility, setVolatility] = useState([initial?.volatility ?? 5]);
  const [playerContribution, setPlayerContribution] = useState([initial?.playerContribution ?? 0]);
  const [operatorContribution, setOperatorContribution] = useState([initial?.operatorContribution ?? 100]);
  const [seedPlayerContribution, setSeedPlayerContribution] = useState([initial?.seedPlayerContribution ?? 100]);
  const [seedOperatorContribution, setSeedOperatorContribution] = useState([initial?.seedOperatorContribution ?? 0]);
  const [poolPercentageValue, setPoolPercentageValue] = useState([initial?.poolPercentageValue ?? 3]);
  const [seedPercentageValue, setSeedPercentageValue] = useState([initial?.seedPercentageValue ?? 0]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isTemplate, setIsTemplate] = useState(initial?.isTemplate ?? false);
  const [selectedWidget, setSelectedWidget] = useState<string>(initial?.selectedWidget ?? 'jewels');
  const [isSegmented, setIsSegmented] = useState(initial?.isSegmented ?? false);
  const [segments, setSegments] = useState<string[]>(initial?.segments ?? ['Segment 1']);
  const [isCommunity, setIsCommunity] = useState(initial?.isCommunity ?? false);
  const [communitySplit, setCommunitySplit] = useState([initial?.communitySplit ?? 50]);
  const [communityPayoutIntervalSeconds, setCommunityPayoutIntervalSeconds] = useState<number>(initial?.communityPayoutIntervalSeconds ?? 0);
  const [communityMaxWinAmount, setCommunityMaxWinAmount] = useState<number>(initial?.communityMaxWinAmount ?? 0);
  const [communityMaxPlayers, setCommunityMaxPlayers] = useState<number>(initial?.communityMaxPlayers ?? 0);
  const [payoutInterval, setPayoutInterval] = useState<string>(initial?.payoutInterval ?? 'logged_in');
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>(initial?.recurrenceType ?? 'single');
  const [weeklyDay, setWeeklyDay] = useState<string>(initial?.weeklyDay ?? '');
  const [monthlyDay, setMonthlyDay] = useState<string>(initial?.monthlyDay ?? '');
  const [displayFrequency, setDisplayFrequency] = useState<DisplayFrequency>(initial?.displayFrequency ?? 'daily');
  const [weeklyFrequencyDay, setWeeklyFrequencyDay] = useState<string>(initial?.weeklyFrequencyDay ?? '');
  const [monthlyFrequencyDay, setMonthlyFrequencyDay] = useState<string>(initial?.monthlyFrequencyDay ?? '');
  const [separateContributionFrequency, setSeparateContributionFrequency] = useState(initial?.separateContributionFrequency ?? false);

  // Win/wager amounts (Classic)
  const [fixedWinAmount, setFixedWinAmount] = useState<number>(initial?.fixedWinAmount ?? 0);
  const [averageWinAmount, setAverageWinAmount] = useState<number>(initial?.averageWinAmount ?? 0);
  const [minWinAmount, setMinWinAmount] = useState<number>(initial?.minWinAmount ?? 0);
  const [maxWinAmount, setMaxWinAmount] = useState<number>(initial?.maxWinAmount ?? 0);
  const [minWagerAmount, setMinWagerAmount] = useState<number>(initial?.minWagerAmount ?? 0);
  const [maxWagerAmount, setMaxWagerAmount] = useState<number>(initial?.maxWagerAmount ?? 0);
  const [reseedingAmount, setReseedingAmount] = useState<number>(initial?.reseedingAmount ?? 0);
  const [maximumSeedAmount, setMaximumSeedAmount] = useState<number>(initial?.maximumSeedAmount ?? 0);
  const [initialPoolAmount, setInitialPoolAmount] = useState<number>(initial?.initialPoolAmount ?? 0);
  // Operation Safeguards — global per-jackpot caps (Must-Drop & Frequency).
  const [maxNumberOfWins, setMaxNumberOfWins] = useState<number>(initial?.maxNumberOfWins ?? 0);
  const [maxTotalPayout, setMaxTotalPayout] = useState<number>(initial?.maxTotalPayout ?? 0);

  // --- Frequency Happy Hour scheduling (calendar-gated)
  const [freqInterval, setFreqInterval] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>(
    initial?.freqInterval ?? 'DAILY',
  );
  const [freqDay, setFreqDay] = useState<string>(initial?.freqDay ?? '');
  const [contribStartTime, setContribStartTime] = useState<string>(initial?.contribStartTime ?? '18:00');
  const [contribEndTime, setContribEndTime] = useState<string>(initial?.contribEndTime ?? '20:00');
  const [winStartTime, setWinStartTime] = useState<string>(initial?.winStartTime ?? '18:00');
  const [winEndTime, setWinEndTime] = useState<string>(initial?.winEndTime ?? '20:00');
  const [cloneContribToWin, setCloneContribToWin] = useState<boolean>(initial?.cloneContribToWin ?? true);


  // --- MUST_DROP / FREQUENCY virtual lifespan
  const [lifespanMinutes, setLifespanMinutes] = useState<number>(initial?.lifespanMinutes ?? 1440);
  const [mustDropPeriod, setMustDropPeriod] = useState<1 | 2 | 3 | 4>(initial?.mustDropPeriod ?? 2);

  // --- v2: Engine v2 contribution split + fixed-odds trigger (global jackpot level)
  const [contributionMode, setContributionMode] = useState<'legacy' | 'split'>(initial?.contributionMode ?? 'split');
  const [totalContributionAmount, setTotalContributionAmount] = useState<number>(initial?.totalContributionAmount ?? 0.1);
  const [totalContributionType, setTotalContributionType] = useState<'fixed' | 'percentage'>(initial?.totalContributionType ?? 'fixed');
  const [poolWeight, setPoolWeight] = useState<number>(initial?.poolWeight ?? 60);
  const [seedWeight, setSeedWeight] = useState<number>(initial?.seedWeight ?? 30);
  const [houseWeight, setHouseWeight] = useState<number>(initial?.houseWeight ?? 10);
  // overlappingRule removed — see "Overlapping Jackpot Rule" cleanup
  const [triggerOdds, setTriggerOdds] = useState<number>(initial?.triggerOdds ?? 0);
  // "classic" → fixed 1/N odds; "curve" → time-decay / must-drop curve (triggerOdds forced to 0).
  const [triggerMode, setTriggerMode] = useState<'classic' | 'curve'>(
    (initial?.triggerOdds ?? 0) > 0 ? 'classic' : 'curve',
  );
  const [previewWager, setPreviewWager] = useState<number>(initial?.previewWager ?? 1.0);

  // --- Eligibility & Rules Engine — vertical-specific targeting
  const [eligVertical, setEligVertical] = useState<'casino' | 'sportsbook'>(
    initial?.eligibility?.vertical ?? 'casino',
  );
  const [eligCategories, setEligCategories] = useState<string[]>(
    initial?.eligibility?.casino?.categories ?? [],
  );
  const [eligProviders, setEligProviders] = useState<string[]>(
    initial?.eligibility?.casino?.providers ?? [],
  );
  const [eligGameIds, setEligGameIds] = useState<string[]>(
    initial?.eligibility?.casino?.gameIds ?? [],
  );
  const [eligGameIdDraft, setEligGameIdDraft] = useState('');
  const [eligBetType, setEligBetType] = useState<'live' | 'prematch' | 'all'>(
    initial?.eligibility?.sportsbook?.betType ?? 'all',
  );
  const [eligSportType, setEligSportType] = useState<string>(
    initial?.eligibility?.sportsbook?.sportType ?? '',
  );
  const [eligLeagues, setEligLeagues] = useState<string[]>(
    initial?.eligibility?.sportsbook?.leagues ?? [],
  );
  const [eligLeagueDraft, setEligLeagueDraft] = useState('');
  const [eligMatchIdsRaw, setEligMatchIdsRaw] = useState<string>(
    (initial?.eligibility?.sportsbook?.matchIds ?? []).join(', '),
  );

  // --- Player Targeting & Restrictions
  const [audienceMode, setAudienceMode] = useState<'all' | 'custom'>(
    initial?.eligibility?.players?.audienceMode ?? 'all',
  );
  const [vipTiers, setVipTiers] = useState<string[]>(
    initial?.eligibility?.players?.vipTiers ?? [],
  );
  const [crmSegmentsInclude, setCrmSegmentsInclude] = useState<string[]>(
    initial?.eligibility?.players?.crmSegmentsInclude ?? [],
  );
  const [crmSegmentIncludeDraft, setCrmSegmentIncludeDraft] = useState('');
  const [crmSegmentsExclude, setCrmSegmentsExclude] = useState<string[]>(
    initial?.eligibility?.players?.crmSegmentsExclude ?? [],
  );
  const [restrictedCountries, setRestrictedCountries] = useState<string[]>(
    initial?.eligibility?.players?.restrictedCountries ?? [],
  );
  const [countrySearch, setCountrySearch] = useState('');
  const [blacklistedIdsRaw, setBlacklistedIdsRaw] = useState<string>(
    (initial?.eligibility?.players?.blacklistedPlayerIds ?? []).join(', '),
  );

  const toggleInArray = (arr: string[], value: string): string[] =>
    arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];

  function buildPlayers(): NonNullable<JackpotSavePayload['eligibility']>['players'] {
    if (audienceMode === 'all') return { audienceMode: 'all', vipTiers: [], crmSegmentsInclude: [], crmSegmentsExclude: [], restrictedCountries: [], blacklistedPlayerIds: [], includedPlayerIds: [] };
    return {
      audienceMode: 'custom',
      vipTiers,
      crmSegmentsInclude,
      crmSegmentsExclude,
      restrictedCountries,
      blacklistedPlayerIds: blacklistedIdsRaw
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter(Boolean),
      includedPlayerIds,
    };
  }


  function buildEligibility(): JackpotSavePayload['eligibility'] {
    const base = { players: buildPlayers() };
    if (eligVertical === 'casino') {
      return {
        ...base,
        vertical: 'casino',
        casino: {
          categories: eligCategories,
          providers: eligProviders,
          gameIds: eligGameIds,
        },
      };
    }
    return {
      ...base,
      vertical: 'sportsbook',
      sportsbook: {
        betType: eligBetType,
        sportType: eligSportType,
        leagues: eligLeagues,
        matchIds: eligMatchIdsRaw
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      },
    };
  }

  // Update only the edited weight; cap so the trio never exceeds 100. Other two are left alone.
  function setSingleWeight(changed: 'pool' | 'seed' | 'house', nextRaw: number) {
    const others = (['pool', 'seed', 'house'] as const).filter((k) => k !== changed);
    const current = { pool: poolWeight, seed: seedWeight, house: houseWeight };
    const otherSum = current[others[0]] + current[others[1]];
    const max = Math.max(0, 100 - otherSum);
    const next = Math.max(0, Math.min(max, Number(nextRaw) || 0));
    const set = { pool: setPoolWeight, seed: setSeedWeight, house: setHouseWeight };
    set[changed](next);
  }

  // --- MULTI_LEVEL tiers editor state
  type TierRow = NonNullable<JackpotSavePayload['tiers']>[number];
  // Profit-optimized 3-tier baseline template (frontend defaults only — fully editable).
  const defaultTiers: TierRow[] = [
    { label: 'Mini',  multiLevelTier: 1, multiLevelWeight: 0.6, reseedingAmount: 100,   maximumPoolAmount: 1000,    minWinAmount: 400,   maxWinAmount: 600,    averageWinAmount: 600,    seedInitialAmount: 150,   seedTargetAmount: 500,    poolContributionType: 'fixed', poolContributionAmount: 0.7, seedContributionType: 'fixed', seedContributionAmount: 0.3, operatorShare: 0, seedOperatorShare: 0 },
    { label: 'Major', multiLevelTier: 2, multiLevelWeight: 0.3, reseedingAmount: 1000,  maximumPoolAmount: 10000,   minWinAmount: 5000,  maxWinAmount: 8000,   averageWinAmount: 8000,   seedInitialAmount: 1500,  seedTargetAmount: 5000,   poolContributionType: 'fixed', poolContributionAmount: 0.7, seedContributionType: 'fixed', seedContributionAmount: 0.3, operatorShare: 0, seedOperatorShare: 0 },
    { label: 'Mega',  multiLevelTier: 3, multiLevelWeight: 0.1, reseedingAmount: 10000, maximumPoolAmount: 100000,  minWinAmount: 60000, maxWinAmount: 100000, averageWinAmount: 100000, seedInitialAmount: 12000, seedTargetAmount: 50000,  poolContributionType: 'fixed', poolContributionAmount: 0.7, seedContributionType: 'fixed', seedContributionAmount: 0.3, operatorShare: 0, seedOperatorShare: 0 },
  ];
  const [tiers, setTiers] = useState<TierRow[]>(initial?.tiers && initial.tiers.length > 0 ? initial.tiers : defaultTiers);

  // When operator switches TO Multi-Level (and we don't have an inbound config),
  // apply the profit-optimized baseline: volatility=1.5, max win=100000, tier defaults.
  const prevTypeRef = useRef<JackpotType>(selectedType);
  useEffect(() => {
    if (selectedType === 'multi_level' && prevTypeRef.current !== 'multi_level' && !initial?.tiers) {
      setVolatility([1.5]);
      setMaxWinAmount(100000);
      setTiers(defaultTiers);
    }
    prevTypeRef.current = selectedType;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedType]);

  const updateTier = (idx: number, patch: Partial<TierRow>) =>
    setTiers((prev) => prev.map((t, i) => (i === idx ? { ...t, ...patch } : t)));
  const addTier = () => {
    setTiers((prev) => {
      if (prev.length >= 4) return prev;
      const nextRank = (prev.reduce((m, t) => Math.max(m, t.multiLevelTier), 0) || 0) + 1;
      return [
        ...prev,
        { label: `Tier ${nextRank}`, multiLevelTier: nextRank, multiLevelWeight: 0.1, reseedingAmount: 500, maximumPoolAmount: 5000, minWinAmount: 50, maxWinAmount: 2500, averageWinAmount: 500, seedInitialAmount: 200, seedTargetAmount: 1000, poolContributionType: 'fixed', poolContributionAmount: 0.7, seedContributionType: 'fixed', seedContributionAmount: 0.3, operatorShare: 0, seedOperatorShare: 0 },
      ];
    });
  };
  const removeTier = (idx: number) =>
    setTiers((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));
  const tierWeightTotal = tiers.reduce((s, t) => s + (Number(t.multiLevelWeight) || 0), 0);

  // Section refs for scroll tracking
  const basicRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);
  const poolSetupRef = useRef<HTMLDivElement>(null);
  const seedSetupRef = useRef<HTMLDivElement>(null);
  const recurrenceRef = useRef<HTMLDivElement>(null);
  const schedulingRef = useRef<HTMLDivElement>(null);
  const configRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ── Must-Drop: auto-map operator-friendly recurrence → engine lifespan/period.
  //    Hides raw "Virtual Lifespan (minutes)" + "Must-Drop Period" from the UI
  //    while keeping the backend payload contract intact.
  useEffect(() => {
    if (selectedType !== 'must_drop') return;
    const map: Record<RecurrenceType, { minutes: number; period: 1 | 2 | 3 | 4 }> = {
      single:  { minutes: 1440,  period: 1 },
      daily:   { minutes: 1440,  period: 2 },
      weekly:  { minutes: 10080, period: 3 },
      monthly: { minutes: 43200, period: 4 },
    };
    const next = map[recurrenceType];
    if (next) {
      setLifespanMinutes(next.minutes);
      setMustDropPeriod(next.period);
    }
  }, [selectedType, recurrenceType]);

  useEffect(() => {
    const handleScroll = () => {
      const sections = [
        { id: 'basic', ref: basicRef },
        { id: 'model', ref: modelRef },
        { id: 'poolSetup', ref: poolSetupRef },
        { id: 'seedSetup', ref: seedSetupRef },
        { id: 'recurrence', ref: recurrenceRef },
        { id: 'scheduling', ref: schedulingRef },
        { id: 'config', ref: configRef },
      ];

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section.ref.current) {
          const rect = section.ref.current.getBoundingClientRect();
          if (rect.top <= 120) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      const top = ref.current.offsetTop - 100;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false 
    }) + ' UTC';
  };

  const handleBack = () => {
    if (onCancel) onCancel(); else navigate({ to: '/admin/jackpots' });
  };




  const [continueError, setContinueError] = useState<string | null>(null);

  // ── Inclusions: bulk-uploaded allow-list of player IDs (CSV)
  const [includedPlayerIds, setIncludedPlayerIds] = useState<string[]>(
    initial?.eligibility?.players?.includedPlayerIds ?? [],
  );





  function buildPayload(): JackpotSavePayload {
    // ── Option A: strict mutually exclusive modes ─────────────────────────
    // Classic Progressive = fixed-odds only (triggerOdds, NO win/budget caps).
    // Must-Drop          = value-driven (Min/Max Win + caps, NO triggerOdds).
    // Frequency          = calendar-gated Happy Hour (contributionFrequency +
    //                      winFrequency JSON strings, NO triggerOdds).
    // Wager limits only apply when contributionType === 'percentage'.
    const isClassic = selectedType === 'classic';
    const isMustDrop = selectedType === 'must_drop';
    const isFrequency = selectedType === 'frequency';
    const isPercentage =
      (contributionMode === 'split' ? totalContributionType : contributionType) === 'percentage';

    // Win-amount fields are valid for Must-Drop AND Frequency (calendar-gated payouts).
    const includeWinAmounts = isMustDrop || isFrequency;

    // Happy Hour: when "clone" is on, mirror contribution times into the win window.
    const effWinStart = cloneContribToWin ? contribStartTime : winStartTime;
    const effWinEnd = cloneContribToWin ? contribEndTime : winEndTime;
    const freqDayOut = freqInterval === 'DAILY' ? '' : freqDay;
    const contributionFrequencyJSON = isFrequency
      ? JSON.stringify({
          frequency: freqInterval,
          day: freqDayOut,
          startTime: contribStartTime,
          endTime: contribEndTime,
        })
      : undefined;
    const winFrequencyJSON = isFrequency
      ? JSON.stringify({
          frequency: freqInterval,
          day: freqDayOut,
          startTime: effWinStart,
          endTime: effWinEnd,
        })
      : undefined;

    return {
      name: name.trim(),
      description: description.trim(),
      walletType: prizeEconomy.walletType,
      currencyId: prizeEconomy.walletType === 'internal' ? prizeEconomy.currencyId : null,
      amountScale: prizeEconomy.walletType === 'internal' ? 1 : 100,
      type: selectedType,
      // Must-Drop is structurally a Maximum-Win mechanic — force the payout model.
      // Frequency keeps the operator-selected payout model (fixed/average/maximum).
      payoutModel: (isClassic || isMustDrop) ? ('maximum' as PayoutModel) : payoutModel,

      contributionType,
      seedContributionType,
      volatility: volatility[0],
      playerContribution: playerContribution[0],
      operatorContribution: operatorContribution[0],
      seedPlayerContribution: seedPlayerContribution[0],
      seedOperatorContribution: seedOperatorContribution[0],
      poolPercentageValue: poolPercentageValue[0],
      seedPercentageValue: seedPercentageValue[0],
      recurrenceType,
      weeklyDay,
      monthlyDay,
      displayFrequency,
      weeklyFrequencyDay,
      monthlyFrequencyDay,
      separateContributionFrequency,
      payoutInterval,
      isSegmented,
      segments,
      isCommunity,
      communitySplit: communitySplit[0],
      communityPayoutIntervalSeconds,
      communityMaxWinAmount,
      communityMaxPlayers,
      community: {
        enabled: isCommunity,
        split: communitySplit[0],
        payoutInterval,
        payoutIntervalSeconds: communityPayoutIntervalSeconds || undefined,
        maximumWinAmount: communityMaxWinAmount,
        maximumNumberOfPlayers: communityMaxPlayers,
      },
      isTemplate,
      selectedWidget,
      // Win-amount fields — Must-Drop AND Frequency (calendar-gated payouts).
      fixedWinAmount: includeWinAmounts ? fixedWinAmount : 0,
      averageWinAmount: includeWinAmounts ? averageWinAmount : 0,
      minWinAmount: includeWinAmounts ? minWinAmount : 0,
      maxWinAmount: includeWinAmounts ? maxWinAmount : 0,
      // Wager limits — only valid for percentage contributions.
      minWagerAmount: isPercentage ? minWagerAmount : 0,
      maxWagerAmount: isPercentage ? maxWagerAmount : 0,
      reseedingAmount,
      maximumSeedAmount,
      initialPoolAmount,
      // Must-Drop derives lifespan/period from its Recurrence picker.
      // Frequency uses Happy Hour windows below — no legacy lifespan injection.
      ...(isMustDrop ? { lifespanMinutes, mustDropPeriod } : {}),
      ...(selectedType === 'multi_level' ? { tiers } : {}),
      // ── v2: contribution split + preview wager
      contributionMode,
      totalContributionAmount,
      totalContributionType,
      poolWeight,
      seedWeight,
      houseWeight,
      // Trigger Probability — only valid for Classic Progressive (nullified for Frequency/Must-Drop).
      triggerOdds: isClassic ? triggerOdds : 0,
      previewWager,
      eligibility: buildEligibility(),

      // ── Frequency Happy Hour — calendar-gated payload (Frequency mode only).
      ...(isFrequency
        ? {
            freqInterval,
            freqDay: freqDayOut,
            contribStartTime,
            contribEndTime,
            winStartTime: effWinStart,
            winEndTime: effWinEnd,
            cloneContribToWin,
            contributionFrequency: contributionFrequencyJSON,
            winFrequency: winFrequencyJSON,
          }
        : {}),

      // ── Operation Safeguards — Must-Drop & Frequency global caps.
      ...(isMustDrop || isFrequency
        ? { maxNumberOfWins, maxTotalPayout }
        : {}),
    };

  }

  function handleContinue() {
    setContinueError(null);
    const payload = buildPayload();

    if (!payload.name) {
      setContinueError('Internal Name is required.');
      return;
    }
    if (payload.type === 'multi_level' && payload.segments.length === 0) {
      setContinueError('Multi-Level jackpots need at least one tier.');
      return;
    }
    if (payload.type === 'must_drop' && !payload.recurrenceType) {
      setContinueError('Pick a recurrence to continue.');
      return;
    }
    if (payload.type === 'frequency') {
      if (!payload.contribStartTime || !payload.contribEndTime) {
        setContinueError('Set the Contribution Window start & end times.');
        return;
      }
      if (payload.freqInterval !== 'DAILY' && !payload.freqDay) {
        setContinueError('Pick a day for the selected Happy Hour interval.');
        return;
      }
    }

    const payloadWithId = editId != null ? { ...payload, editId } : payload;
    try {
      sessionStorage.setItem('jackpot:pendingPayload', JSON.stringify(payloadWithId));
    } catch {
      /* sessionStorage unavailable — fall back to history state only */
    }
    navigate({
      to: '/admin/simulator',
      state: (prev) => ({ ...prev, jackpotConfig: payloadWithId }) as never,
    });
  }

  // ── Jackpot Contribution section (rendered in-flow between Win Logic & Pool Setup) ──
  const jackpotContributionSection = selectedType !== 'multi_level' ? (
    <section className="scroll-mt-20">
      <h2 className="text-xl font-semibold mb-6">Jackpot Contribution</h2>
      <Card className="p-6 bg-neutral-900/50 border-neutral-800 mb-6">
        <div className="inline-flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => { setContributionMode('split'); setTotalContributionType('fixed'); }}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
              contributionMode === 'split' && totalContributionType === 'fixed'
                ? 'bg-blue-500 text-white' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
          >Fixed</button>
          <button
            type="button"
            onClick={() => { setContributionMode('split'); setTotalContributionType('percentage'); }}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
              contributionMode === 'split' && totalContributionType === 'percentage'
                ? 'bg-blue-500 text-white' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
          >Percent</button>
        </div>

        {/* ── Unified Wager Eligibility Limits — Percentage-only ───────────
            Single source of truth for Min/Max qualifying wager. Hidden &
            nullified when contribution is Fixed (flat-fee side bet). */}
        {totalContributionType === 'percentage' && (
          <div className="mb-8 p-4 rounded-lg border border-neutral-800 bg-neutral-900/60">
            <div className="text-sm font-semibold text-neutral-100 mb-1">Wager Eligibility Limits</div>
            <p className="text-[11px] text-neutral-500 mb-4">
              Applies globally to all contribution buckets. Bets outside this range do not contribute.
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <BrightLabel htmlFor="global-min-wager">Minimum Qualifying Wager</BrightLabel>
                <CurrencyInput
                  id="global-min-wager"
                  type="number"
                  placeholder="0"
                  value={minWagerAmount || ''}
                  onChange={(e) => setMinWagerAmount(parseFloat(e.target.value) || 0)}
                  className="bg-neutral-800 border-neutral-700"
                />
              </div>
              <div className="space-y-2">
                <BrightLabel htmlFor="global-max-wager">Maximum Qualifying Wager</BrightLabel>
                <CurrencyInput
                  id="global-max-wager"
                  type="number"
                  placeholder="0"
                  value={maxWagerAmount || ''}
                  onChange={(e) => setMaxWagerAmount(parseFloat(e.target.value) || 0)}
                  className="bg-neutral-800 border-neutral-700"
                />
              </div>
            </div>
          </div>
        )}




        <div className="space-y-2 mb-8" style={{ width: 193 }}>
          <BrightLabel htmlFor="v2-total" className="text-sm font-semibold text-neutral-100">
            {totalContributionType === 'fixed' ? 'Fixed Contribution Amount' : 'Percent of Wager'}
          </BrightLabel>
          <div className="relative">
            <AmountDraftInput
              id="v2-total"
              value={totalContributionAmount}
              onCommit={(next) => setTotalContributionAmount(next)}
              className="bg-neutral-900 border-neutral-700 pr-8 tabular-nums h-10"
            />
            <span className="absolute inset-y-0 right-3 flex items-center text-neutral-400 pointer-events-none text-sm">
              {totalContributionType === 'fixed' ? '€' : '%'}
            </span>
          </div>
        </div>


        {(() => {
          const base = totalContributionType === 'fixed'
            ? totalContributionAmount
            : (previewWager * totalContributionAmount) / 100;
          const sum = poolWeight + seedWeight + houseWeight;
          const sumOk = Math.abs(sum - 100) < 0.05;
          const rows: Array<{ label: string; k: 'pool' | 'seed' | 'house'; value: number }> = [
            { label: 'Pool', k: 'pool', value: poolWeight },
            { label: 'Seed', k: 'seed', value: seedWeight },
            { label: 'House', k: 'house', value: houseWeight },
          ];
          // Largest-remainder rounding @ 3 decimals so the three displayed
          // Amounts always sum exactly to `base` (no 0.249 / 0.251 drift).
          const allocated = (() => {
            const out = [0, 0, 0];
            if (!sumOk || base <= 0) {
              return rows.map((r) => base * (r.value / 100));
            }
            const target = Math.round(base * 1000);
            const exacts = rows.map((r) => (base * (r.value / 100)) * 1000);
            const floors = exacts.map((x) => Math.floor(x));
            let gap = target - floors.reduce((a, b) => a + b, 0);
            const order = exacts
              .map((x, i) => ({ i, rem: x - Math.floor(x) }))
              .sort((a, b) => b.rem - a.rem)
              .map((o) => o.i);
            const units = floors.slice();
            for (let j = 0; j < order.length && gap > 0; j++, gap--) units[order[j]]++;
            for (let i = 0; i < units.length; i++) out[i] = units[i] / 1000;
            return out;
          })();
          return (
            <div>
              <div className="text-sm font-semibold text-neutral-100 mb-3">Contribution Weight</div>
              <div className="grid grid-cols-[140px_200px_200px] gap-6 pb-3 border-b border-neutral-800">
                <span />
                <span className="text-sm font-semibold text-neutral-100">Weight</span>
                <span className="text-sm font-semibold text-neutral-100">Amount</span>
              </div>
              {rows.map(({ label, k, value }, i) => (
                <div key={k} className="grid grid-cols-[140px_200px_200px] items-center gap-6 py-3">
                  <span className="text-sm font-semibold text-neutral-100">{label}</span>
                  <div className="relative">
                    <WeightDraftInput
                      value={value}
                      onCommit={(next) => setSingleWeight(k, next)}
                      className="h-10 bg-neutral-900 border-neutral-700 pr-8 tabular-nums"
                    />
                    <span className="absolute inset-y-0 right-3 flex items-center text-sm text-neutral-400 pointer-events-none">%</span>
                  </div>
                  <Input
                    readOnly
                    tabIndex={-1}
                    value={allocated[i].toFixed(3)}
                    className="h-10 bg-neutral-900 border-neutral-700 text-neutral-400 tabular-nums cursor-default"
                  />
                </div>
              ))}
              {!sumOk && (
                <div className="mt-2 text-xs text-amber-400">
                  Sum: {sum.toFixed(2)}% — must equal 100 to save
                </div>
              )}
            </div>
          );
        })()}


      </Card>
    </section>
  ) : null;

  // Trigger Probability — visual dual-card picker for Single Jackpots.
  // Classic ("Pure Chance Roll") writes triggerOdds = N (1..10,000,000).
  // Curve  ("Hype Curve Engine") forces triggerOdds = 0 so the backend's
  // time-decay / must-drop calculus owns the trigger.
  //
  // Slider scaling uses a log10 map (slider 0..1000 → spins 1..10,000,000)
  // so the lower half of the operational range (under 500k) gets ~80% of
  // the physical track — making 5k / 10k / 50k easy to land on precisely.
  const TRIGGER_SLIDER_STEPS = 1000;
  const TRIGGER_MIN = 1;
  const TRIGGER_MAX = 10_000_000;
  const sliderToSpins = (s: number): number => {
    const t = Math.max(0, Math.min(TRIGGER_SLIDER_STEPS, s)) / TRIGGER_SLIDER_STEPS;
    const exp = Math.log10(TRIGGER_MIN) + t * (Math.log10(TRIGGER_MAX) - Math.log10(TRIGGER_MIN));
    return Math.max(TRIGGER_MIN, Math.min(TRIGGER_MAX, Math.round(Math.pow(10, exp))));
  };
  const spinsToSlider = (n: number): number => {
    const clamped = Math.max(TRIGGER_MIN, Math.min(TRIGGER_MAX, n || TRIGGER_MIN));
    const t =
      (Math.log10(clamped) - Math.log10(TRIGGER_MIN)) /
      (Math.log10(TRIGGER_MAX) - Math.log10(TRIGGER_MIN));
    return Math.round(t * TRIGGER_SLIDER_STEPS);
  };

  const pickVibe = (n: number) => {
    if (n < 10_000)
      return {
        Icon: Zap,
        label: '⚡ Rapid-Fire Mode',
        copy: `This jackpot drops constantly! Expect a hit roughly every ${n.toLocaleString()} spins network-wide. Ideal for ultra-high engagement or promotional happy hours.`,
        ring: 'border-emerald-500/40 bg-emerald-500/10',
        badge: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40',
        accent: 'text-emerald-300',
      };
    if (n < 100_000)
      return {
        Icon: Flame,
        label: '🔥 Action-Packed',
        copy: `Expect a hit roughly every ${n.toLocaleString()} spins. Perfect for keeping players glued during peak weekend traffic windows.`,
        ring: 'border-orange-500/40 bg-orange-500/10',
        badge: 'bg-orange-500/20 text-orange-200 border-orange-500/40',
        accent: 'text-orange-300',
      };
    if (n < 500_000)
      return {
        Icon: TrendingUp,
        label: '📈 Daily Driver',
        copy: `Expect a hit roughly every ${n.toLocaleString()} spins. This provides a classic, steady promotional heartbeat across your games.`,
        ring: 'border-sky-500/40 bg-sky-500/10',
        badge: 'bg-sky-500/20 text-sky-200 border-sky-500/40',
        accent: 'text-sky-300',
      };
    if (n < 2_500_000)
      return {
        Icon: Trophy,
        label: '🏆 Major Milestone',
        copy: `Expect a rare, high-anticipation drop roughly every ${n.toLocaleString()} spins. Builds significant community buzz and high-value tracking.`,
        ring: 'border-amber-400/40 bg-amber-400/10',
        badge: 'bg-amber-400/20 text-amber-100 border-amber-400/40',
        accent: 'text-amber-300',
      };
    return {
      Icon: Gem,
      label: '💎 The Mega Event',
      copy: `An ultra-rare, legendary network event. Expect a drop roughly once every ${n.toLocaleString()} spins. This is your headline-grabbing marketing campaign.`,
      ring: 'border-purple-500/40 bg-purple-500/10',
      badge: 'bg-purple-500/20 text-purple-200 border-purple-500/40',
      accent: 'text-purple-300',
    };
  };

  const setClassicMode = () => {
    setTriggerMode('classic');
    if (!(triggerOdds > 0)) setTriggerOdds(100_000);
  };
  const setCurveMode = () => {
    setTriggerMode('curve');
    setTriggerOdds(0);
  };

  const triggerProbabilitySection = selectedType !== 'multi_level' ? (
    <section className="scroll-mt-20">
      <h2 className="text-xl font-semibold mb-2">Trigger Probability</h2>
      <p className="text-sm text-neutral-400 mb-6">
        Choose how this jackpot decides when to drop.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1 — Pure Chance Roll */}
        <button
          type="button"
          onClick={setClassicMode}
          aria-pressed={triggerMode === 'classic'}
          className={`group text-left rounded-xl border p-5 transition-all ${
            triggerMode === 'classic'
              ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/40 shadow-lg shadow-blue-500/10'
              : 'border-neutral-800 bg-neutral-900/50 hover:border-neutral-700 hover:bg-neutral-900'
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-lg ${triggerMode === 'classic' ? 'bg-blue-500/20 text-blue-300' : 'bg-neutral-800 text-neutral-400'}`}>
              <Dice5 className="w-5 h-5" />
            </div>
            <div className="font-semibold text-white">Pure Chance Roll</div>
            <span className="ml-auto text-[11px] tabular-nums text-neutral-500">Classic 1/N</span>
          </div>
          <p className="text-sm text-neutral-400 mb-4 leading-relaxed">
            Every single spin across your network has the exact same static odds of winning. Like rolling a massive digital dice.
          </p>
          {/* Flat odds micro-sparkline */}
          <svg viewBox="0 0 120 24" className={`w-full h-6 ${triggerMode === 'classic' ? 'text-blue-400' : 'text-neutral-600'}`}>
            <line x1="2" y1="12" x2="118" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 3" />
            {[10, 30, 50, 70, 90, 110].map((x) => (
              <circle key={x} cx={x} cy={12} r="2" fill="currentColor" />
            ))}
          </svg>
        </button>

        {/* Card 2 — Hype Curve Engine */}
        <button
          type="button"
          onClick={setCurveMode}
          aria-pressed={triggerMode === 'curve'}
          className={`group text-left rounded-xl border p-5 transition-all ${
            triggerMode === 'curve'
              ? 'border-purple-500 bg-purple-500/10 ring-2 ring-purple-500/40 shadow-lg shadow-purple-500/10'
              : 'border-neutral-800 bg-neutral-900/50 hover:border-neutral-700 hover:bg-neutral-900'
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-lg ${triggerMode === 'curve' ? 'bg-purple-500/20 text-purple-300' : 'bg-neutral-800 text-neutral-400'}`}>
              <Activity className="w-5 h-5" />
            </div>
            <div className="font-semibold text-white">The Hype Curve Engine</div>
            <span className="ml-auto text-[11px] tabular-nums text-neutral-500">Dynamic / Must-Drop</span>
          </div>
          <p className="text-sm text-neutral-400 mb-4 leading-relaxed">
            Winning odds dynamically scale up over time or accumulation. Guarantees an explosive climax as your deadline or cap approaches.
          </p>
          {/* Exponential curve micro-icon */}
          <svg viewBox="0 0 120 24" className={`w-full h-6 ${triggerMode === 'curve' ? 'text-purple-400' : 'text-neutral-600'}`}>
            <path
              d="M2 22 C 40 22, 70 20, 90 14 S 115 4, 118 2"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="118" cy="2" r="2.5" fill="currentColor" />
          </svg>
        </button>
      </div>

      {/* Pure Chance controls (hidden when Hype Curve is active) */}
      {triggerMode === 'classic' && (() => {
        const vibe = pickVibe(triggerOdds || TRIGGER_MIN);
        const VibeIcon = vibe.Icon;
        return (
          <Card className="mt-5 p-6 bg-neutral-900/50 border-neutral-800">
            <div className="space-y-5 max-w-2xl">
              <div>
                <BrightLabel htmlFor="single-trigger-odds" className="text-sm font-semibold text-neutral-100">
                  Target Spin Interval
                </BrightLabel>
                <p className="text-[11px] text-neutral-500 mt-1">
                  Average number of network spins between hits. Slider uses logarithmic spacing — lower values have higher precision.
                </p>
              </div>

              <div className="space-y-3">
                <Slider
                  min={0}
                  max={TRIGGER_SLIDER_STEPS}
                  step={1}
                  value={[spinsToSlider(triggerOdds || TRIGGER_MIN)]}
                  onValueChange={(v) => setTriggerOdds(sliderToSpins(v[0] ?? 0))}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] text-neutral-500 tabular-nums">
                  <span>1</span>
                  <span>1k</span>
                  <span>10k</span>
                  <span>100k</span>
                  <span>1M</span>
                  <span>10M</span>
                </div>
              </div>

              <div className="flex items-stretch gap-2">
                <Input
                  id="single-trigger-odds"
                  type="number"
                  min={TRIGGER_MIN}
                  max={TRIGGER_MAX}
                  step={1}
                  value={triggerOdds || ''}
                  onChange={(e) => {
                    const raw = parseInt(e.target.value.slice(0, 8)) || 0;
                    setTriggerOdds(Math.max(0, Math.min(TRIGGER_MAX, raw)));
                  }}
                  placeholder="Enter spin interval"
                  className="flex-1 bg-neutral-900 border-neutral-700 tabular-nums"
                />
                <div className="flex items-center px-3 rounded-md bg-neutral-800/60 border border-neutral-800 text-xs text-emerald-400 tabular-nums whitespace-nowrap min-w-[160px] justify-center">
                  {triggerOdds > 0 ? `1 in ${triggerOdds.toLocaleString()} spins` : 'set a value'}
                </div>
              </div>

              {/* Live Vibe & Pacing translation */}
              <div className={`rounded-xl border p-4 transition-colors ${vibe.ring}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold ${vibe.badge}`}>
                    <VibeIcon className="w-3.5 h-3.5" />
                    {vibe.label}
                  </span>
                  <span className={`text-[11px] tabular-nums ${vibe.accent}`}>
                    p = {(1 / Math.max(1, triggerOdds || TRIGGER_MIN)).toExponential(3)} / spin
                  </span>
                </div>
                <p className="text-sm text-neutral-200 leading-relaxed">{vibe.copy}</p>
              </div>

              <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300">
                <span className="font-semibold">RNG Boundary Limit:</span> Max 10,000,000
              </div>
            </div>
          </Card>
        );
      })()}

      {triggerMode === 'curve' && (
        <Card className="mt-5 p-6 bg-neutral-900/30 border-dashed border-neutral-800">
          <div className="flex items-start gap-3 text-sm text-neutral-300">
            <Activity className="w-5 h-5 text-purple-300 mt-0.5 shrink-0" />
            <div>
              <div className="font-semibold text-white mb-1">Hype Curve engaged</div>
              <p className="text-neutral-400 leading-relaxed">
                No manual odds required — the backend's time-decay calculus controls when this jackpot drops based on your Must-Drop window or Frequency schedule.
              </p>
            </div>
          </div>
        </Card>
      )}
    </section>
  ) : null;


  // ── Eligibility & Rules Engine section (casino vs sportsbook targeting) ──
  const CASINO_CATEGORIES = ['Slots', 'Live Casino', 'Table Games', 'Crash Games'];
  const CASINO_PROVIDERS = ['Pragmatic Play', 'Evolution', 'Hacksaw', 'NetEnt', "Play'n GO", 'Relax Gaming'];
  const SPORT_TYPES = ['Football', 'Basketball', 'Tennis', 'Hockey', 'Baseball', 'eSports', 'MMA'];

  const eligibilitySection = (
    <section className="scroll-mt-20">
      <h2 className="text-xl font-semibold mb-6">Eligibility &amp; Rules Engine</h2>
      <Card className="p-6 bg-neutral-900/50 border-neutral-800 mb-6">
        {/* Vertical toggle */}
        <div className="inline-flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setEligVertical('casino')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
              eligVertical === 'casino'
                ? 'bg-blue-500 text-white'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            Casino Games
          </button>
          <button
            type="button"
            onClick={() => setEligVertical('sportsbook')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
              eligVertical === 'sportsbook'
                ? 'bg-blue-500 text-white'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            Sportsbook
          </button>
        </div>

        {eligVertical === 'casino' ? (
          <div className="space-y-6">
            {/* Game Categories */}
            <div className="space-y-2">
              <BrightLabel className="text-sm font-semibold text-neutral-100">Game Categories</BrightLabel>
              <div className="flex flex-wrap gap-2">
                {CASINO_CATEGORIES.map((cat) => {
                  const active = eligCategories.includes(cat);
                  return (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => setEligCategories((a) => toggleInArray(a, cat))}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        active
                          ? 'bg-blue-500/15 border-blue-500/50 text-blue-300'
                          : 'bg-neutral-900 border-neutral-700 text-neutral-300 hover:border-neutral-500'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-neutral-400">Empty selection targets all categories.</p>
            </div>

            {/* Providers / Game Studios */}
            <div className="space-y-2">
              <BrightLabel className="text-sm font-semibold text-neutral-100">
                Providers / Game Studios
              </BrightLabel>
              <div className="flex flex-wrap gap-2">
                {CASINO_PROVIDERS.map((p) => {
                  const active = eligProviders.includes(p);
                  return (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setEligProviders((a) => toggleInArray(a, p))}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        active
                          ? 'bg-blue-500/15 border-blue-500/50 text-blue-300'
                          : 'bg-neutral-900 border-neutral-700 text-neutral-300 hover:border-neutral-500'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Specific Game IDs */}
            <div className="space-y-2">
              <BrightLabel htmlFor="elig-gameid" className="text-sm font-semibold text-neutral-100">
                Specific Game IDs
              </BrightLabel>
              <div className="flex flex-wrap items-center gap-2 min-h-[40px] p-2 rounded-md bg-neutral-900 border border-neutral-700 focus-within:ring-2 focus-within:ring-blue-500">
                {eligGameIds.map((id) => (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-neutral-800 text-xs text-neutral-100"
                  >
                    {id}
                    <button
                      type="button"
                      onClick={() => setEligGameIds((a) => a.filter((v) => v !== id))}
                      className="text-neutral-400 hover:text-neutral-100"
                      aria-label={`Remove ${id}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  id="elig-gameid"
                  value={eligGameIdDraft}
                  onChange={(e) => setEligGameIdDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      const v = eligGameIdDraft.trim();
                      if (v && !eligGameIds.includes(v)) setEligGameIds((a) => [...a, v]);
                      setEligGameIdDraft('');
                    } else if (e.key === 'Backspace' && !eligGameIdDraft && eligGameIds.length > 0) {
                      setEligGameIds((a) => a.slice(0, -1));
                    }
                  }}
                  placeholder={eligGameIds.length ? '' : 'Type a game ID and press Enter…'}
                  className="flex-1 min-w-[160px] bg-transparent text-sm text-neutral-100 outline-none"
                />
              </div>
              <p className="text-xs text-neutral-400">Leave empty to include all games in the selected categories.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Bet Type Toggle */}
            <div className="space-y-2">
              <BrightLabel className="text-sm font-semibold text-neutral-100">Bet Type</BrightLabel>
              <div className="inline-flex rounded-lg border border-neutral-700 overflow-hidden">
                {([
                  { v: 'live', label: 'Live / In-Play Only' },
                  { v: 'prematch', label: 'Prematch Only' },
                  { v: 'all', label: 'All Bets' },
                ] as const).map((opt) => (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => setEligBetType(opt.v)}
                    className={`px-4 py-2 text-xs font-medium transition-colors ${
                      eligBetType === opt.v
                        ? 'bg-blue-500 text-white'
                        : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sport Type */}
            <div className="space-y-2 max-w-sm">
              <BrightLabel htmlFor="elig-sport" className="text-sm font-semibold text-neutral-100">
                Sport Type
              </BrightLabel>
              <select
                id="elig-sport"
                value={eligSportType}
                onChange={(e) => setEligSportType(e.target.value)}
                className="w-full h-10 rounded-md bg-neutral-900 border border-neutral-700 px-3 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Sports</option>
                {SPORT_TYPES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* League / Tournament Tags */}
            <div className="space-y-2">
              <BrightLabel htmlFor="elig-league" className="text-sm font-semibold text-neutral-100">
                League / Tournament Tags
              </BrightLabel>
              <div className="flex flex-wrap items-center gap-2 min-h-[40px] p-2 rounded-md bg-neutral-900 border border-neutral-700 focus-within:ring-2 focus-within:ring-blue-500">
                {eligLeagues.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-neutral-800 text-xs text-neutral-100 tracking-wider"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => setEligLeagues((a) => a.filter((v) => v !== tag))}
                      className="text-neutral-400 hover:text-neutral-100"
                      aria-label={`Remove ${tag}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  id="elig-league"
                  value={eligLeagueDraft}
                  onChange={(e) => setEligLeagueDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      const v = eligLeagueDraft.trim().toUpperCase().replace(/\s+/g, '_');
                      if (v && !eligLeagues.includes(v)) setEligLeagues((a) => [...a, v]);
                      setEligLeagueDraft('');
                    } else if (e.key === 'Backspace' && !eligLeagueDraft && eligLeagues.length > 0) {
                      setEligLeagues((a) => a.slice(0, -1));
                    }
                  }}
                  placeholder={eligLeagues.length ? '' : 'e.g. UEFA_CHAMPIONS_LEAGUE'}
                  className="flex-1 min-w-[200px] bg-transparent text-sm text-neutral-100 outline-none"
                />
              </div>
            </div>

            {/* Specific Match IDs */}
            <div className="space-y-2">
              <BrightLabel htmlFor="elig-matchids" className="text-sm font-semibold text-neutral-100">
                Specific Match IDs
              </BrightLabel>
              <textarea
                id="elig-matchids"
                value={eligMatchIdsRaw}
                onChange={(e) => setEligMatchIdsRaw(e.target.value)}
                rows={3}
                placeholder="Comma-separated fixture IDs (optional). Leave empty to include all matches."
                className="w-full rounded-md bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </Card>
    </section>
  );

  // ── Player Targeting & Restrictions section ──
  const VIP_TIERS = ['Bronze', 'Silver', 'Gold', 'Platinum'];
  const CRM_EXCLUDE_PRESETS = ['Bonus Abusers', 'High-Risk Flags', 'Self-Excluded', 'Chargeback History'];
  const COUNTRY_LIST: Array<{ code: string; name: string }> = [
    { code: 'US', name: 'United States' }, { code: 'GB', name: 'United Kingdom' },
    { code: 'DE', name: 'Germany' }, { code: 'NL', name: 'Netherlands' },
    { code: 'FR', name: 'France' }, { code: 'ES', name: 'Spain' },
    { code: 'IT', name: 'Italy' }, { code: 'BE', name: 'Belgium' },
    { code: 'SE', name: 'Sweden' }, { code: 'NO', name: 'Norway' },
    { code: 'DK', name: 'Denmark' }, { code: 'FI', name: 'Finland' },
    { code: 'PL', name: 'Poland' }, { code: 'PT', name: 'Portugal' },
    { code: 'IE', name: 'Ireland' }, { code: 'AT', name: 'Austria' },
    { code: 'CH', name: 'Switzerland' }, { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' }, { code: 'NZ', name: 'New Zealand' },
    { code: 'BR', name: 'Brazil' }, { code: 'MX', name: 'Mexico' },
    { code: 'AR', name: 'Argentina' }, { code: 'JP', name: 'Japan' },
    { code: 'SG', name: 'Singapore' }, { code: 'HK', name: 'Hong Kong' },
    { code: 'ZA', name: 'South Africa' }, { code: 'TR', name: 'Turkey' },
    { code: 'IN', name: 'India' }, { code: 'AE', name: 'United Arab Emirates' },
  ];
  const filteredCountries = COUNTRY_LIST.filter((c) => {
    const q = countrySearch.trim().toLowerCase();
    if (!q) return true;
    return c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q);
  });

  // ── Community Win Mechanics — relocated out of Widget Configuration ──
  const communityWinSection = (
    <section className="scroll-mt-20">
      <h2 className="text-xl font-semibold mb-6">Community Win Mechanics</h2>
      <Card className="p-6 bg-neutral-900/50 border-neutral-800 mb-6">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <BrightLabel className="text-sm font-medium">Community</BrightLabel>
                <p className="text-xs text-neutral-400 mt-1">
                  Enable community jackpots where multiple players can share the win
                </p>
              </div>
              <Switch
                checked={isCommunity}
                onCheckedChange={setIsCommunity}
                className="data-[state=checked]:bg-green-500"
              />
            </div>
            <div></div>
          </div>

          {isCommunity && (
            <div className="pt-4 space-y-6 border-t border-neutral-800">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <BrightLabel htmlFor="cw-community-split">Community Split</BrightLabel>
                    <span className="text-sm text-neutral-400">{communitySplit[0]}%</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
                      <span>Winner</span>
                      <span>Community</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-neutral-400">0%</span>
                      <Slider
                        id="cw-community-split"
                        value={communitySplit}
                        onValueChange={setCommunitySplit}
                        max={100}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-sm text-neutral-400">100%</span>
                    </div>
                    <div className="relative h-4">
                      <span
                        className="absolute text-xs text-neutral-400 -translate-x-1/2"
                        style={{ left: `${communitySplit[0]}%` }}
                      >
                        {communitySplit[0]}%
                      </span>
                    </div>
                  </div>
                </div>
                <div></div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <BrightLabel className="text-sm font-medium">Payout Interval</BrightLabel>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setPayoutInterval('logged_in')}
                      className={`w-full px-4 py-3 rounded-lg text-sm font-medium text-left transition-all ${
                        payoutInterval === 'logged_in'
                          ? 'bg-blue-500/20 text-white border-2 border-blue-500'
                          : 'bg-neutral-800 text-neutral-400 border-2 border-neutral-700 hover:border-neutral-600'
                      }`}
                    >
                      Currently Logged In
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayoutInterval('contributed_once')}
                      className={`w-full px-4 py-3 rounded-lg text-sm font-medium text-left transition-all ${
                        payoutInterval === 'contributed_once'
                          ? 'bg-blue-500/20 text-white border-2 border-blue-500'
                          : 'bg-neutral-800 text-neutral-400 border-2 border-neutral-700 hover:border-neutral-600'
                      }`}
                    >
                      Has Contributed At Least Once To This Jackpot
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayoutInterval('contributed_within_time')}
                      className={`w-full px-4 py-3 rounded-lg text-sm font-medium text-left transition-all ${
                        payoutInterval === 'contributed_within_time'
                          ? 'bg-blue-500/20 text-white border-2 border-blue-500'
                          : 'bg-neutral-800 text-neutral-400 border-2 border-neutral-700 hover:border-neutral-600'
                      }`}
                    >
                      Has Contributed Within This Amount Of Time
                    </button>

                    {payoutInterval === 'contributed_within_time' && (
                      <div className="pt-2 space-y-2">
                        <BrightLabel htmlFor="cw-payout-interval-seconds">Activity Lookback Window (Seconds)</BrightLabel>
                        <Input
                          id="cw-payout-interval-seconds"
                          type="number"
                          placeholder="e.g., 60, 300, 3600"
                          value={communityPayoutIntervalSeconds || ''}
                          onChange={(e) => setCommunityPayoutIntervalSeconds(Number(e.target.value) || 0)}
                          min="0"
                          className="bg-neutral-800 border-neutral-700 max-w-[240px]"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div></div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <BrightLabel htmlFor="cw-max-win">Maximum Payout Cap Per Member</BrightLabel>
                  <CurrencyInput
                    id="cw-max-win"
                    type="number"
                    placeholder="0"
                    value={communityMaxWinAmount || ''}
                    onChange={(e) => setCommunityMaxWinAmount(Number(e.target.value) || 0)}
                    className="bg-neutral-800 border-neutral-700"
                  />
                </div>
                <div></div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <BrightLabel htmlFor="cw-max-players">Maximum Qualified Players</BrightLabel>
                  <Input
                    id="cw-max-players"
                    type="number"
                    placeholder="0"
                    value={communityMaxPlayers || ''}
                    onChange={(e) => setCommunityMaxPlayers(Number(e.target.value) || 0)}
                    min="0"
                    className="bg-neutral-800 border-neutral-700"
                  />
                </div>
                <div></div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </section>
  );

  const playerTargetingSection = (
    <section className="scroll-mt-20">
      <h2 className="text-xl font-semibold mb-6">Player Targeting &amp; Restrictions</h2>
      <Card className="p-6 bg-neutral-900/50 border-neutral-800 mb-6">
        <div className="space-y-2 mb-6">
          <BrightLabel className="text-sm font-semibold text-neutral-100">Target Audience</BrightLabel>
          <div className="inline-flex gap-2">
            <button
              type="button"
              onClick={() => setAudienceMode('all')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                audienceMode === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              All Public Players
            </button>
            <button
              type="button"
              onClick={() => setAudienceMode('custom')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                audienceMode === 'custom'
                  ? 'bg-blue-500 text-white'
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              Custom Target Segments &amp; Restrictions
            </button>
          </div>
          {audienceMode === 'all' && (
            <p className="text-xs text-neutral-400">All eligible players will see and contribute to this jackpot.</p>
          )}
        </div>

        {audienceMode === 'custom' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-neutral-800">
            {/* Left column — Inclusions */}
            <div className="space-y-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-400">Inclusions / White-list</h3>

              <div className="space-y-2">
                <BrightLabel className="text-sm font-semibold text-neutral-100">Target VIP Tiers</BrightLabel>
                <div className="flex flex-wrap gap-2">
                  {VIP_TIERS.map((tier) => {
                    const active = vipTiers.includes(tier);
                    return (
                      <button
                        type="button"
                        key={tier}
                        onClick={() => setVipTiers((a) => toggleInArray(a, tier))}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          active
                            ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                            : 'bg-neutral-900 border-neutral-700 text-neutral-300 hover:border-neutral-500'
                        }`}
                      >
                        {tier}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-neutral-400">Empty = all tiers eligible.</p>
              </div>

              <div className="space-y-2">
                <BrightLabel htmlFor="crm-include" className="text-sm font-semibold text-neutral-100">
                  Target CRM Segments
                </BrightLabel>
                <div className="flex flex-wrap items-center gap-2 min-h-[40px] p-2 rounded-md bg-neutral-900 border border-neutral-700 focus-within:ring-2 focus-within:ring-emerald-500">
                  {crmSegmentsInclude.map((seg) => (
                    <span key={seg} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-900/40 text-xs text-emerald-100">
                      {seg}
                      <button
                        type="button"
                        onClick={() => setCrmSegmentsInclude((a) => a.filter((v) => v !== seg))}
                        className="text-emerald-300 hover:text-white"
                        aria-label={`Remove ${seg}`}
                      >×</button>
                    </span>
                  ))}
                  <input
                    id="crm-include"
                    value={crmSegmentIncludeDraft}
                    onChange={(e) => setCrmSegmentIncludeDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        const v = crmSegmentIncludeDraft.trim();
                        if (v && !crmSegmentsInclude.includes(v)) setCrmSegmentsInclude((a) => [...a, v]);
                        setCrmSegmentIncludeDraft('');
                      } else if (e.key === 'Backspace' && !crmSegmentIncludeDraft && crmSegmentsInclude.length > 0) {
                        setCrmSegmentsInclude((a) => a.slice(0, -1));
                      }
                    }}
                    placeholder={crmSegmentsInclude.length ? '' : 'e.g. Re-engaged Users, March Madness Depositors'}
                    className="flex-1 min-w-[200px] bg-transparent text-sm text-neutral-100 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Right column — Exclusions */}
            <div className="space-y-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-rose-400">Exclusions &amp; Restrictions / Black-list</h3>

              <div className="space-y-2">
                <BrightLabel className="text-sm font-semibold text-neutral-100">Exclude CRM Segments</BrightLabel>
                <div className="flex flex-wrap gap-2">
                  {CRM_EXCLUDE_PRESETS.map((seg) => {
                    const active = crmSegmentsExclude.includes(seg);
                    return (
                      <button
                        type="button"
                        key={seg}
                        onClick={() => setCrmSegmentsExclude((a) => toggleInArray(a, seg))}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          active
                            ? 'bg-rose-500/15 border-rose-500/50 text-rose-300'
                            : 'bg-neutral-900 border-neutral-700 text-neutral-300 hover:border-neutral-500'
                        }`}
                      >
                        {seg}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <BrightLabel htmlFor="geo-search" className="text-sm font-semibold text-neutral-100">
                  Restricted Countries (GEO)
                </BrightLabel>
                <input
                  id="geo-search"
                  type="text"
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  placeholder="Search ISO code or country name…"
                  className="w-full h-10 rounded-md bg-neutral-900 border border-neutral-700 px-3 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <div className="max-h-40 overflow-y-auto rounded-md border border-neutral-800 bg-neutral-950/60 p-2 space-y-1">
                  {filteredCountries.map((c) => {
                    const active = restrictedCountries.includes(c.code);
                    return (
                      <label key={c.code} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-neutral-800/50 cursor-pointer text-sm">
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={() => setRestrictedCountries((a) => toggleInArray(a, c.code))}
                          className="accent-rose-500"
                        />
                        <span className="font-mono text-xs text-rose-300 w-6">{c.code}</span>
                        <span className="text-neutral-200">{c.name}</span>
                      </label>
                    );
                  })}
                  {filteredCountries.length === 0 && (
                    <p className="text-xs text-neutral-500 px-2 py-1">No matches.</p>
                  )}
                </div>
                {restrictedCountries.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {restrictedCountries.map((code) => (
                      <span key={code} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-900/40 text-xs text-rose-100 font-mono">
                        {code}
                        <button
                          type="button"
                          onClick={() => setRestrictedCountries((a) => a.filter((v) => v !== code))}
                          className="text-rose-300 hover:text-white"
                          aria-label={`Remove ${code}`}
                        >×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <BrightLabel htmlFor="blacklist-ids" className="text-sm font-semibold text-neutral-100">
                  Blacklisted Player IDs
                </BrightLabel>
                <textarea
                  id="blacklist-ids"
                  value={blacklistedIdsRaw}
                  onChange={(e) => setBlacklistedIdsRaw(e.target.value)}
                  rows={3}
                  placeholder="Comma-separated player account tokens (e.g. p_8821, p_9904)"
                  className="w-full rounded-md bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>
          </div>
        )}
      </Card>
    </section>
  );






  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Horizontal Navigation */}
      <nav className="sticky top-14 z-40 border-b border-neutral-800 bg-neutral-900/95 backdrop-blur">
        <div className="px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => scrollToSection(basicRef)}
              className={`whitespace-nowrap px-3 py-2 rounded-lg text-xs transition-colors ${
                activeSection === 'basic' 
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' 
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              }`}
            >
              Basic Information
            </button>
            
            <button
              onClick={() => scrollToSection(modelRef)}
              className={`whitespace-nowrap px-3 py-2 rounded-lg text-xs transition-colors ${
                activeSection === 'model' 
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' 
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              }`}
            >
              Win Logic & Model
            </button>
            
            <button
              onClick={() => scrollToSection(poolSetupRef)}
              className={`whitespace-nowrap px-3 py-2 rounded-lg text-xs transition-colors ${
                activeSection === 'poolSetup' 
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' 
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              }`}
            >
              Pool Setup
            </button>
            
            <button
              onClick={() => scrollToSection(seedSetupRef)}
              className={`whitespace-nowrap px-3 py-2 rounded-lg text-xs transition-colors ${
                activeSection === 'seedSetup' 
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' 
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              }`}
            >
              Seed Setup
            </button>
            
            <button
              onClick={() => scrollToSection(recurrenceRef)}
              className={`whitespace-nowrap px-3 py-2 rounded-lg text-xs transition-colors ${
                activeSection === 'recurrence' 
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' 
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              }`}
            >
              Jackpot Recurrence
            </button>
            
            <button
              onClick={() => scrollToSection(schedulingRef)}
              className={`whitespace-nowrap px-3 py-2 rounded-lg text-xs transition-colors ${
                activeSection === 'scheduling' 
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' 
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              }`}
            >
              Scheduling
            </button>
            
            <button
              onClick={() => scrollToSection(configRef)}
              className={`whitespace-nowrap px-3 py-2 rounded-lg text-xs transition-colors ${
                activeSection === 'config' 
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' 
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              }`}
            >
              Widget Configuration
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-[1200px] mx-auto p-8">
        <div className="space-y-8">
          {/* Jackpot Type Selection */}
          <section className="scroll-mt-20">
            <h2 className="text-xl font-semibold mb-6">Jackpot Type</h2>
            
            <Card className="p-6 bg-neutral-900/50 border-neutral-800">
              <div className="grid grid-cols-4 gap-4">
                <button
                  onClick={() => setSelectedType('classic')}
                  className={`relative flex flex-col p-6 rounded-lg border-2 transition-all ${
                    selectedType === 'classic'
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-neutral-700 bg-neutral-800/30 hover:border-neutral-600'
                  }`}
                >
                  {selectedType === 'classic' && (
                    <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  )}
                  <div className="text-3xl mb-3">🎰</div>
                  <div className="font-medium text-white mb-2">Classic Jackpot</div>
                  <div className="text-xs text-neutral-400">
                    Traditional jackpot with flexible payout models
                  </div>
                </button>

                <button
                  onClick={() => setSelectedType('must_drop')}
                  className={`relative flex flex-col p-6 rounded-lg border-2 transition-all ${
                    selectedType === 'must_drop'
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-neutral-700 bg-neutral-800/30 hover:border-neutral-600'
                  }`}
                >
                  {selectedType === 'must_drop' && (
                    <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  )}
                  <div className="text-3xl mb-3">⏰</div>
                  <div className="font-medium text-white mb-2">Must Drop</div>
                  <div className="text-xs text-neutral-400">
                    Guaranteed to drop by a specific time or value
                  </div>
                </button>

                {/* Multi-Level type picker removed — MultiJackpots are now configured via the relational group wizard at /admin/jackpots/new → "MultiJackpot" tab. */}


                <button
                  onClick={() => setSelectedType('frequency')}
                  className={`relative flex flex-col p-6 rounded-lg border-2 transition-all ${
                    selectedType === 'frequency'
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-neutral-700 bg-neutral-800/30 hover:border-neutral-600'
                  }`}
                >
                  {selectedType === 'frequency' && (
                    <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  )}
                  <div className="text-3xl mb-3">📊</div>
                  <div className="font-medium text-white mb-2">Frequency</div>
                  <div className="text-xs text-neutral-400">
                    Win frequency-based jackpot triggering
                  </div>
                </button>
              </div>
            </Card>
          </section>


          {/* Classic Jackpot Fields */}
          {selectedType === 'classic' && (
            <>
              {/* Basic Information Section */}
              <section ref={basicRef} className="scroll-mt-20">
                <h2 className="text-xl font-semibold mb-6">Basic Information</h2>
                
                <div className="grid gap-6">
                  <Card className="p-6 bg-neutral-900/50 border-neutral-800">
                    <div className="grid gap-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <BrightLabel htmlFor="internal-name">Internal Name</BrightLabel>
                          <Input id="internal-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Jackpot Q1 2026" className="bg-neutral-800 border-neutral-700" />
                        </div>
                        <div></div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <BrightLabel htmlFor="description">Internal Description</BrightLabel>
                          <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what this jackpot does..." className="bg-neutral-800 border-neutral-700 min-h-[100px] text-white" />
                        </div>
                        <div></div>
                      </div>
                    </div>
                  </Card>
                  <PrizeEconomySelector value={prizeEconomy} onChange={setPrizeEconomy} />
                </div>
              </section>

              {/* Win Logic & Model Section — Classic Progressive is fixed-odds:
                  win-amount caps, payout models, and lifetime budget caps are
                  disabled in this mode (see Trigger Probability below). */}
              <section ref={modelRef} className="scroll-mt-20">
                <h2 className="text-xl font-semibold mb-6">Win Logic & Model</h2>
                <Card className="p-5 bg-amber-500/5 border-amber-500/30">
                  <div className="flex gap-3">
                    <div className="text-amber-300 text-lg leading-none mt-0.5">⚠</div>
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-amber-200">Fixed-Odds Mode (Classic Progressive)</div>
                      <p className="text-xs text-amber-100/80 leading-relaxed">
                        Classic Progressive pays the <strong>full pool balance</strong> on each trigger.
                        Win-amount caps (Min/Max Win), payout models (Fixed/Average/Maximum), and lifetime
                        budget limits (Max # of Wins, Max Total Payout) are <strong>completely disabled</strong>
                        to guarantee math alignment, prevent silent engine rejections, and meet regulatory
                        compliance standards. Configure the RNG denominator in the
                        <strong> Trigger Probability</strong> subsection below.
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-neutral-900/50 border-neutral-800 mt-4">
                  <h3 className="text-sm font-semibold text-neutral-100 mb-4">Trigger Probability</h3>
                  <TriggerProbabilityPanel
                    value={triggerOdds}
                    onChange={(n) => setTriggerOdds(n)}
                  />
                </Card>
              </section>


              {jackpotContributionSection}

              {/* Pool Setup Section */}
              <section ref={poolSetupRef} className="scroll-mt-20">
                <h2 className="text-base font-semibold mb-4">Pool</h2>
                
                <div className="grid gap-6">
                  <Card className="p-6 bg-neutral-900/50 border-neutral-800">
                    <div className="space-y-6">



                      {contributionType === 'percentage' ? (
                        <>
                          <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <BrightLabel htmlFor="initial-jackpot">Initial Jackpot Amount</BrightLabel>
                                <CurrencyInput
                                  id="initial-jackpot"
                                  type="number"
                                  placeholder="0"
                                  value={initialPoolAmount}
                                  onChange={(e) => setInitialPoolAmount(parseFloat(e.target.value) || 0)}
                                  className="bg-neutral-800 border-neutral-700"
                                />
                              </div>
                              <div></div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <BrightLabel htmlFor="pool-contribution">Percentage of Wager Pool Contribution Amount</BrightLabel>
                                <PercentageInput
                                  id="pool-contribution"
                                  type="number"
                                  placeholder="3"
                                  value={poolPercentageValue[0]}
                                  onChange={(e) => setPoolPercentageValue([parseFloat(e.target.value) || 0])}
                                  className="bg-neutral-800 border-neutral-700"
                                />
                              </div>
                              <div></div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <BrightLabel htmlFor="pool-player-contrib">Player Contribution</BrightLabel>
                                  <span className="text-sm text-neutral-400">{playerContribution[0]}%</span>
                                </div>
                                <div className="space-y-1">
                                  <Slider
                                    id="pool-player-contrib"
                                    value={playerContribution}
                                    onValueChange={(value) => {
                                      setPlayerContribution(value);
                                      setOperatorContribution([100 - value[0]]);
                                    }}
                                    max={100}
                                    step={1}
                                    className="flex-1"
                                  />
                                  <div className="relative h-4">
                                    <span
                                      className="absolute text-xs text-neutral-400 -translate-x-1/2"
                                      style={{ left: `${playerContribution[0]}%` }}
                                    >
                                      {playerContribution[0]}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div></div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <BrightLabel htmlFor="pool-operator-contrib">Operator Contribution</BrightLabel>
                                  <span className="text-sm text-neutral-400">{operatorContribution[0]}%</span>
                                </div>
                                <div className="space-y-1">
                                  <Slider
                                    id="pool-operator-contrib"
                                    value={operatorContribution}
                                    onValueChange={(value) => {
                                      setOperatorContribution(value);
                                      setPlayerContribution([100 - value[0]]);
                                    }}
                                    max={100}
                                    step={1}
                                    className="flex-1"
                                  />
                                  <div className="relative h-4">
                                    <span
                                      className="absolute text-xs text-neutral-400 -translate-x-1/2"
                                      style={{ left: `${operatorContribution[0]}%` }}
                                    >
                                      {operatorContribution[0]}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div></div>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-neutral-800">
                            <button
                              onClick={() => setShowAdvanced(!showAdvanced)}
                              className="flex items-center gap-2 text-sm text-neutral-400 hover:text-neutral-200"
                            >
                              <span>⚙</span>
                              <span>Advanced</span>
                            </button>

                            {showAdvanced && (
                              <div className="mt-4 grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                  <BrightLabel htmlFor="max-pool-size">maximum-pool-size</BrightLabel>
                                  <CurrencyInput
                                    id="max-pool-size"
                                    type="number"
                                    placeholder="0"
                                    defaultValue="0"
                                    className="bg-neutral-800 border-neutral-700"
                                  />
                                </div>
                                <div></div>
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <BrightLabel htmlFor="initial-jackpot-fixed">Initial Jackpot Amount</BrightLabel>
                                <CurrencyInput
                                  id="initial-jackpot-fixed"
                                  type="number"
                                  placeholder="0"
                                  value={initialPoolAmount}
                                  onChange={(e) => setInitialPoolAmount(parseFloat(e.target.value) || 0)}
                                  className="bg-neutral-800 border-neutral-700"
                                />
                              </div>
                              <div></div>
                            </div>




                            <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <BrightLabel htmlFor="pool-player-contrib-fixed">Player Contribution</BrightLabel>
                                  <span className="text-sm text-neutral-400">{playerContribution[0]}%</span>
                                </div>
                                <div className="space-y-1">
                                  <Slider
                                    id="pool-player-contrib-fixed"
                                    value={playerContribution}
                                    onValueChange={(value) => {
                                      setPlayerContribution(value);
                                      setOperatorContribution([100 - value[0]]);
                                    }}
                                    max={100}
                                    step={1}
                                    className="flex-1"
                                  />
                                  <div className="relative h-4">
                                    <span
                                      className="absolute text-xs text-neutral-400 -translate-x-1/2"
                                      style={{ left: `${playerContribution[0]}%` }}
                                    >
                                      {playerContribution[0]}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div></div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <BrightLabel htmlFor="pool-operator-contrib-fixed">Operator Contribution</BrightLabel>
                                  <span className="text-sm text-neutral-400">{operatorContribution[0]}%</span>
                                </div>
                                <div className="space-y-1">
                                  <Slider
                                    id="pool-operator-contrib-fixed"
                                    value={operatorContribution}
                                    onValueChange={(value) => {
                                      setOperatorContribution(value);
                                      setPlayerContribution([100 - value[0]]);
                                    }}
                                    max={100}
                                    step={1}
                                    className="flex-1"
                                  />
                                  <div className="relative h-4">
                                    <span
                                      className="absolute text-xs text-neutral-400 -translate-x-1/2"
                                      style={{ left: `${operatorContribution[0]}%` }}
                                    >
                                      {operatorContribution[0]}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div></div>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-neutral-800">
                            <button
                              onClick={() => setShowAdvanced(!showAdvanced)}
                              className="flex items-center gap-2 text-sm text-neutral-400 hover:text-neutral-200"
                            >
                              <span>⚙</span>
                              <span>Advanced</span>
                            </button>

                            {showAdvanced && (
                              <div className="mt-4 grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                  <BrightLabel htmlFor="max-pool-size-fixed">maximum-pool-size</BrightLabel>
                                  <CurrencyInput
                                    id="max-pool-size-fixed"
                                    type="number"
                                    placeholder="0"
                                    defaultValue="0"
                                    className="bg-neutral-800 border-neutral-700"
                                  />
                                </div>
                                <div></div>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </Card>
                </div>
              </section>

              {/* Seed Setup Section */}
              <section ref={seedSetupRef} className="scroll-mt-20">
                <h2 className="text-base font-semibold mb-4">Seed</h2>
                
                <div className="grid gap-6">
                  <Card className="p-6 bg-neutral-900/50 border-neutral-800">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <BrightLabel htmlFor="reseed-amount">Re-Seeding Amount</BrightLabel>
                        <div className="max-w-[400px]">
                          <CurrencyInput
                            id="reseed-amount"
                            type="number"
                            placeholder="0"
                            value={reseedingAmount}
                            onChange={(e) => setReseedingAmount(parseFloat(e.target.value) || 0)}
                            className="bg-neutral-800 border-neutral-700 w-full"
                          />
                        </div>
                      </div>




                      {seedContributionType === 'percentage' ? (
                        <>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <BrightLabel htmlFor="seed-contribution">Percent Seed Contribution From Wager</BrightLabel>
                              <PercentageInput
                                id="seed-contribution"
                                type="number"
                                placeholder="0"
                                value={seedPercentageValue[0]}
                                onChange={(e) => setSeedPercentageValue([parseFloat(e.target.value) || 0])}
                                className="bg-neutral-800 border-neutral-700"
                              />
                            </div>
                            <div></div>
                          </div>

                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <BrightLabel htmlFor="seed-player-contrib">Player Contribution</BrightLabel>
                                <span className="text-sm text-neutral-400">{seedPlayerContribution[0]}%</span>
                              </div>
                              <div className="space-y-1">
                                <Slider
                                  id="seed-player-contrib"
                                  value={seedPlayerContribution}
                                  onValueChange={(value) => {
                                    setSeedPlayerContribution(value);
                                    setSeedOperatorContribution([100 - value[0]]);
                                  }}
                                  max={100}
                                  step={1}
                                  className="flex-1"
                                />
                                <div className="relative h-4">
                                  <span
                                    className="absolute text-xs text-neutral-400 -translate-x-1/2"
                                    style={{ left: `${seedPlayerContribution[0]}%` }}
                                  >
                                    {seedPlayerContribution[0]}%
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div></div>
                          </div>

                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <BrightLabel htmlFor="seed-operator-contrib">Operator Contribution</BrightLabel>
                                <span className="text-sm text-neutral-400">{seedOperatorContribution[0]}%</span>
                              </div>
                              <div className="space-y-1">
                                <Slider
                                  id="seed-operator-contrib"
                                  value={seedOperatorContribution}
                                  onValueChange={(value) => {
                                    setSeedOperatorContribution(value);
                                    setSeedPlayerContribution([100 - value[0]]);
                                  }}
                                  max={100}
                                  step={1}
                                  className="flex-1"
                                />
                                <div className="relative h-4">
                                  <span
                                    className="absolute text-xs text-neutral-400 -translate-x-1/2"
                                    style={{ left: `${seedOperatorContribution[0]}%` }}
                                  >
                                    {seedOperatorContribution[0]}%
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div></div>
                          </div>




                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <BrightLabel htmlFor="max-seed-percentage">Maximum Seed Amount</BrightLabel>
                              <CurrencyInput
                                id="max-seed-percentage"
                                type="number"
                                placeholder="0"
                                value={maximumSeedAmount}
                                onChange={(e) => setMaximumSeedAmount(parseFloat(e.target.value) || 0)}
                                className="bg-neutral-800 border-neutral-700"
                              />
                            </div>
                            <div></div>
                          </div>
                        </>
                      ) : (
                        <>



                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <BrightLabel htmlFor="seed-player-contrib-fixed">Player Contribution</BrightLabel>
                                <span className="text-sm text-neutral-400">{seedPlayerContribution[0]}%</span>
                              </div>
                              <div className="space-y-1">
                                <Slider
                                  id="seed-player-contrib-fixed"
                                  value={seedPlayerContribution}
                                  onValueChange={(value) => {
                                    setSeedPlayerContribution(value);
                                    setSeedOperatorContribution([100 - value[0]]);
                                  }}
                                  max={100}
                                  step={1}
                                  className="flex-1"
                                />
                                <div className="relative h-4">
                                  <span
                                    className="absolute text-xs text-neutral-400 -translate-x-1/2"
                                    style={{ left: `${seedPlayerContribution[0]}%` }}
                                  >
                                    {seedPlayerContribution[0]}%
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div></div>
                          </div>

                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <BrightLabel htmlFor="seed-operator-contrib-fixed">Operator Contribution</BrightLabel>
                                <span className="text-sm text-neutral-400">{seedOperatorContribution[0]}%</span>
                              </div>
                              <div className="space-y-1">
                                <Slider
                                  id="seed-operator-contrib-fixed"
                                  value={seedOperatorContribution}
                                  onValueChange={(value) => {
                                    setSeedOperatorContribution(value);
                                    setSeedPlayerContribution([100 - value[0]]);
                                  }}
                                  max={100}
                                  step={1}
                                  className="flex-1"
                                />
                                <div className="relative h-4">
                                  <span
                                    className="absolute text-xs text-neutral-400 -translate-x-1/2"
                                    style={{ left: `${seedOperatorContribution[0]}%` }}
                                  >
                                    {seedOperatorContribution[0]}%
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div></div>
                          </div>




                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <BrightLabel htmlFor="max-seed">Maximum Seed Amount</BrightLabel>
                              <CurrencyInput
                                id="max-seed"
                                type="number"
                                placeholder="0"
                                value={maximumSeedAmount}
                                onChange={(e) => setMaximumSeedAmount(parseFloat(e.target.value) || 0)}
                                className="bg-neutral-800 border-neutral-700"
                              />
                            </div>
                            <div></div>
                          </div>
                        </>
                      )}
                    </div>
                  </Card>
                </div>
              </section>

              {/* Scheduling Section */}
              <section ref={schedulingRef} className="scroll-mt-20">
                <h2 className="text-xl font-semibold mb-6">Scheduling</h2>

                <div className="grid gap-6">
                  <Card className="p-6 bg-neutral-900/50 border-neutral-800">
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <BrightLabel htmlFor="start-date">Start Date & Time</BrightLabel>
                          <Input
                            id="start-date"
                            type="datetime-local"
                            className="bg-neutral-800 border-neutral-700"
                            defaultValue="2026-03-15T04:15"
                          />
                          <p className="text-xs text-neutral-500">
                            Date and time the jackpot becomes active for players
                          </p>
                        </div>
                        <div></div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <BrightLabel htmlFor="end-date">End Date & Time</BrightLabel>
                          <Input
                            id="end-date"
                            type="datetime-local"
                            className="bg-neutral-800 border-neutral-700"
                            defaultValue="2027-03-15T04:15"
                          />
                          <p className="text-xs text-neutral-500">
                            Optional expiration date for the jackpot
                          </p>
                        </div>
                        <div></div>
                      </div>

                      {/* Max Number of Wins / Max Total Payout — disabled for
                          Classic Progressive (fixed-odds mode). Configure those
                          caps in a Must-Drop jackpot instead. */}
                    </div>
                  </Card>
                </div>
              </section>

              {eligibilitySection}
              {communityWinSection}
              {playerTargetingSection}


              {/* Widget Configuration Section */}
              <section ref={configRef} className="scroll-mt-20">
                <h2 className="text-xl font-semibold mb-6">Widget Configuration</h2>
                
                <div className="grid gap-6">
                  <Card className="p-6 bg-neutral-900/50 border-neutral-800">
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <BrightLabel className="text-sm font-medium">Player Opt-in Type</BrightLabel>
                        <div className="flex gap-3">
                          <button className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium">Automatic</button>
                          <button className="px-4 py-2 rounded-lg bg-neutral-800 text-neutral-400 hover:text-neutral-200 text-sm font-medium">
                            Manual
                          </button>
                        </div>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-neutral-800">
                        <BrightLabel className="text-sm font-medium">Select Widget Design</BrightLabel>
                        <p className="text-xs text-neutral-400 mb-4">
                          Choose a widget design that will be displayed in the slot game
                        </p>
                        <div className="grid grid-cols-4 gap-6">
                          <button
                            onClick={() => setSelectedWidget('jewels')}
                            className={`relative p-4 rounded-lg border-2 transition-all bg-neutral-800/50 ${
                              selectedWidget === 'jewels'
                                ? 'border-blue-500 ring-2 ring-blue-500/20'
                                : 'border-neutral-700 hover:border-neutral-600'
                            }`}
                          >
                            {selectedWidget === 'jewels' && (
                              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center z-10">
                                <div className="w-2 h-2 rounded-full bg-white" />
                              </div>
                            )}
                            <div className="flex items-center justify-center">
                              <img 
                                src={widgetMegaJewels} 
                                alt="Jackpot Jewels Widget" 
                                className="w-full h-auto object-contain"
                              />
                            </div>
                            <p className="text-xs text-neutral-400 mt-3 text-center">Jewels Multi-Tier</p>
                          </button>

                          <button
                            onClick={() => setSelectedWidget('tiers')}
                            className={`relative p-4 rounded-lg border-2 transition-all bg-neutral-800/50 ${
                              selectedWidget === 'tiers'
                                ? 'border-blue-500 ring-2 ring-blue-500/20'
                                : 'border-neutral-700 hover:border-neutral-600'
                            }`}
                          >
                            {selectedWidget === 'tiers' && (
                              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center z-10">
                                <div className="w-2 h-2 rounded-full bg-white" />
                              </div>
                            )}
                            <div className="flex items-center justify-center">
                              <img 
                                src={widgetSuperMega} 
                                alt="Metal Tiers Widget" 
                                className="w-full h-auto object-contain"
                              />
                            </div>
                            <p className="text-xs text-neutral-400 mt-3 text-center">Metal Tiers</p>
                          </button>

                          <button
                            onClick={() => setSelectedWidget('classic')}
                            className={`relative p-4 rounded-lg border-2 transition-all bg-neutral-800/50 ${
                              selectedWidget === 'classic'
                                ? 'border-blue-500 ring-2 ring-blue-500/20'
                                : 'border-neutral-700 hover:border-neutral-600'
                            }`}
                          >
                            {selectedWidget === 'classic' && (
                              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center z-10">
                                <div className="w-2 h-2 rounded-full bg-white" />
                              </div>
                            )}
                            <div className="flex items-center justify-center">
                              <img 
                                src={widgetGoldenHarvest} 
                                alt="Golden Harvest Widget" 
                                className="w-full h-auto object-contain"
                              />
                            </div>
                            <p className="text-xs text-neutral-400 mt-3 text-center">Golden Harvest</p>
                          </button>

                          <button
                            onClick={() => setSelectedWidget('minimal')}
                            className={`relative p-4 rounded-lg border-2 transition-all bg-neutral-800/50 ${
                              selectedWidget === 'minimal'
                                ? 'border-blue-500 ring-2 ring-blue-500/20'
                                : 'border-neutral-700 hover:border-neutral-600'
                            }`}
                          >
                            {selectedWidget === 'minimal' && (
                              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center z-10">
                                <div className="w-2 h-2 rounded-full bg-white" />
                              </div>
                            )}
                            <div className="flex items-center justify-center">
                              <img 
                                src={widgetCyberNeon} 
                                alt="Cyber Neon Widget" 
                                className="w-full h-auto object-contain"
                              />
                            </div>
                            <p className="text-xs text-neutral-400 mt-3 text-center">Cyber Neon</p>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3 pt-4 border-t border-neutral-800">
                        <BrightLabel className="text-sm font-medium">Winning Animation</BrightLabel>
                        <div className="space-y-2 max-w-md">
                          <BrightLabel htmlFor="win-animation">Select Animation</BrightLabel>
                          <Select defaultValue="animation1">
                            <SelectTrigger id="win-animation" className="bg-neutral-800 border-neutral-700">
                              <SelectValue placeholder="Choose an animation" />
                            </SelectTrigger>
                            <SelectContent className="bg-neutral-800 border-neutral-700">
                              <SelectItem value="animation1">Animation 1</SelectItem>
                              <SelectItem value="animation2">Animation 2</SelectItem>
                              <SelectItem value="animation3">Animation 3</SelectItem>
                              <SelectItem value="animation4">Animation 4</SelectItem>
                              <SelectItem value="animation5">Animation 5</SelectItem>
                              <SelectItem value="animation6">Animation 6</SelectItem>
                              <SelectItem value="animation7">Animation 7</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button variant="outline" className="mt-2">
                          Test Winning Animation
                        </Button>
                      </div>

                      {/* Inform All Players of a Win */}
                      <div className="pt-6 border-t border-neutral-800">
                        <div className="grid grid-cols-2 gap-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <BrightLabel className="text-sm font-medium">Inform All Players of a Win</BrightLabel>
                              <p className="text-xs text-neutral-400 mt-1">
                                Broadcast win notifications to all active players
                              </p>
                            </div>
                            <Switch className="data-[state=checked]:bg-green-500" />
                          </div>
                          <div></div>
                        </div>
                      </div>

                      {/* Community Win Mechanics relocated to its own section above */}

                      {/* Save as Template */}
                      <div className="pt-6 border-t border-neutral-800">
                        <div className="grid grid-cols-2 gap-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <BrightLabel htmlFor="is-template" className="text-sm font-medium">Save as Template</BrightLabel>
                              <p className="text-xs text-neutral-400 mt-1">
                                Save this configuration as a reusable template
                              </p>
                            </div>
                            <Switch
                              id="is-template"
                              checked={isTemplate}
                              onCheckedChange={setIsTemplate}
                              className="data-[state=checked]:bg-green-500"
                            />
                          </div>
                          <div></div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </section>

              {/* Per-type action bar removed — global Continue bar handles navigation. */}
            </>
          )}

          {/* Must Drop Jackpot Fields */}
          {selectedType === 'must_drop' && (
            <>
              {/* Basic Information Section */}
              <section ref={basicRef} className="scroll-mt-20">
                <h2 className="text-xl font-semibold mb-6">Basic Information</h2>

                <div className="grid gap-6">
                  <Card className="p-6 bg-neutral-900/50 border-neutral-800">
                    <div className="grid gap-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <BrightLabel htmlFor="internal-name">Internal Name</BrightLabel>
                          <Input id="internal-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Jackpot Q1 2026" className="bg-neutral-800 border-neutral-700" />
                        </div>
                        <div></div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <BrightLabel htmlFor="description">Internal Description</BrightLabel>
                          <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what this jackpot does..." className="bg-neutral-800 border-neutral-700 min-h-[100px] text-white" />
                        </div>
                        <div></div>
                      </div>
                    </div>
                  </Card>
                  <PrizeEconomySelector value={prizeEconomy} onChange={setPrizeEconomy} />
                </div>
              </section>

              {/* 1. Jackpot Recurrence & Timing — first in the Must-Drop flow. */}
              <section ref={recurrenceRef} className="scroll-mt-20">
                <h2 className="text-xl font-semibold mb-6">Jackpot Recurrence &amp; Timing</h2>
                <div className="grid gap-6">
                  <Card className="p-6 bg-neutral-900/50 border-neutral-800">
                    <div className="space-y-6">
                      {/* Recurrence Type Buttons */}
                      <div>
                        <BrightLabel className="mb-3 block">Recurrence Type</BrightLabel>
                        <div className="flex gap-3">
                          {(['single', 'daily', 'weekly', 'monthly'] as const).map((rt) => (
                            <button
                              key={rt}
                              type="button"
                              onClick={() => setRecurrenceType(rt)}
                              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all capitalize ${
                                recurrenceType === rt
                                  ? 'bg-white text-neutral-900'
                                  : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200'
                              }`}
                            >
                              {rt}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Start / End Date — present for every recurrence type */}
                      <div className="space-y-2">
                        <BrightLabel htmlFor="must-drop-startDate">Start Date &amp; Time</BrightLabel>
                        <Input
                          id="must-drop-startDate"
                          type="datetime-local"
                          className="bg-neutral-800 border-neutral-700 max-w-[400px]"
                        />
                      </div>
                      <div className="space-y-2">
                        <BrightLabel htmlFor="must-drop-endDate">End Date &amp; Time</BrightLabel>
                        <Input
                          id="must-drop-endDate"
                          type="datetime-local"
                          className="bg-neutral-800 border-neutral-700 max-w-[400px]"
                        />
                      </div>

                      {recurrenceType === 'weekly' && (
                        <div className="space-y-2">
                          <BrightLabel htmlFor="frequency-day-mustDrop">Frequency Day Must Drop</BrightLabel>
                          <Select value={weeklyDay} onValueChange={setWeeklyDay}>
                            <SelectTrigger id="frequency-day-mustDrop" className="bg-neutral-800 border-neutral-700 max-w-[400px] text-white">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent className="bg-neutral-800 border-neutral-700 text-white">
                              {['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map((d) => (
                                <SelectItem key={d} value={d} className="text-white capitalize">{d}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      {recurrenceType === 'monthly' && (
                        <div className="space-y-2">
                          <BrightLabel htmlFor="frequency-day-mustDrop-monthly">Frequency Day Must Drop</BrightLabel>
                          <Select value={monthlyDay} onValueChange={setMonthlyDay}>
                            <SelectTrigger id="frequency-day-mustDrop-monthly" className="bg-neutral-800 border-neutral-700 max-w-[400px] text-white">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent className="bg-neutral-800 border-neutral-700 text-white max-h-[300px]">
                              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                                <SelectItem key={day} value={day.toString()} className="text-white">{day}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              </section>

              {/* 2. Win Boundaries */}
              <section ref={modelRef} className="scroll-mt-20">
                <h2 className="text-xl font-semibold mb-6">Win Boundaries</h2>
                <div className="grid gap-6">
                  <Card className="p-6 bg-neutral-900/50 border-neutral-800">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <BrightLabel htmlFor="min-win-must-drop">Minimum Win Amount</BrightLabel>
                        <CurrencyInput
                          id="min-win-must-drop"
                          type="number"
                          placeholder="0"
                          value={minWinAmount || ''}
                          onChange={(e) => setMinWinAmount(parseFloat(e.target.value) || 0)}
                          className="bg-neutral-800 border-neutral-700"
                        />
                        <p className="text-[11px] text-neutral-500">
                          Lower threshold — the jackpot cannot drop before the pool reaches this value.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <BrightLabel htmlFor="max-win-must-drop">Maximum Win Amount</BrightLabel>
                        <CurrencyInput
                          id="max-win-must-drop"
                          type="number"
                          placeholder="0"
                          value={maxWinAmount || ''}
                          onChange={(e) => setMaxWinAmount(parseFloat(e.target.value) || 0)}
                          className="bg-neutral-800 border-neutral-700"
                        />
                        <p className="text-[11px] text-neutral-500">
                          Absolute target — the jackpot is mathematically guaranteed to drop at or before this value.
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              </section>

              {/* 3. Drop Pacing */}
              <section className="scroll-mt-20">
                <h2 className="text-xl font-semibold mb-6">Drop Pacing</h2>
                <div className="grid gap-6">
                  <Card className="p-6 bg-neutral-900/50 border-neutral-800">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <BrightLabel htmlFor="drop-pacing-must-drop">Drop Pacing</BrightLabel>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-neutral-400">1</span>
                            <Slider
                              id="drop-pacing-must-drop"
                              value={volatility}
                              onValueChange={setVolatility}
                              min={1}
                              max={10}
                              step={1}
                              className="flex-1"
                            />
                            <span className="text-sm text-neutral-400">10</span>
                          </div>
                          <div className="flex justify-center">
                            <span className="text-sm text-neutral-400">{volatility[0]}</span>
                          </div>
                        </div>
                        <p className="text-[11px] text-neutral-400 leading-relaxed">
                          Lower settings distribute triggers evenly across the timeline / value window.
                          Higher settings create high suspense by holding back triggers until the end
                          of the drop cycle is reached.
                        </p>
                      </div>
                      <div></div>
                    </div>
                  </Card>
                </div>
              </section>

              {/* 4. Operation Safeguards — consolidated global caps. */}
              <section className="scroll-mt-20">
                <h2 className="text-xl font-semibold mb-6">Operation Safeguards</h2>
                <div className="grid gap-6">
                  <Card className="p-6 bg-neutral-900/50 border-neutral-800">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <BrightLabel htmlFor="op-max-number-wins">Maximum Number of Wins</BrightLabel>
                        <Input
                          id="op-max-number-wins"
                          type="number"
                          placeholder="0"
                          value={maxNumberOfWins || ''}
                          onChange={(e) => setMaxNumberOfWins(parseInt(e.target.value) || 0)}
                          className="bg-neutral-800 border-neutral-700"
                        />
                        <p className="text-[11px] text-neutral-500">
                          Hard cap on total drops for the jackpot's lifetime. 0 = unlimited.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <BrightLabel htmlFor="op-max-total-payout">Max Total Payout</BrightLabel>
                        <CurrencyInput
                          id="op-max-total-payout"
                          type="number"
                          placeholder="0"
                          value={maxTotalPayout || ''}
                          onChange={(e) => setMaxTotalPayout(parseFloat(e.target.value) || 0)}
                          className="bg-neutral-800 border-neutral-700"
                        />
                        <p className="text-[11px] text-neutral-500">
                          Aggregate payout ceiling across all wins. 0 = unlimited.
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              </section>




              {jackpotContributionSection}

              {/* Pool Setup Section */}
              <section ref={poolSetupRef} className="scroll-mt-20">
                <h2 className="text-base font-semibold mb-4">Pool</h2>

                <div className="grid gap-6">
                  <Card className="p-6 bg-neutral-900/50 border-neutral-800">
                    <div className="space-y-6">



                      {contributionType === 'percentage' ? (
                        <>
                          <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <BrightLabel htmlFor="initial-jackpot">Initial Jackpot Amount</BrightLabel>
                                <CurrencyInput
                                  id="initial-jackpot"
                                  type="number"
                                  placeholder="0"
                                  value={initialPoolAmount}
                                  onChange={(e) => setInitialPoolAmount(parseFloat(e.target.value) || 0)}
                                  className="bg-neutral-800 border-neutral-700"
                                />
                              </div>
                              <div></div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <BrightLabel htmlFor="pool-contribution">Percentage of Wager Pool Contribution Amount</BrightLabel>
                                <PercentageInput
                                  id="pool-contribution"
                                  type="number"
                                  placeholder="3"
                                  value={poolPercentageValue[0]}
                                  onChange={(e) => setPoolPercentageValue([parseFloat(e.target.value) || 0])}
                                  className="bg-neutral-800 border-neutral-700"
                                />
                              </div>
                              <div></div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <BrightLabel htmlFor="pool-player-contrib">Player Contribution</BrightLabel>
                                  <span className="text-sm text-neutral-400">{playerContribution[0]}%</span>
                                </div>
                                <div className="space-y-1">
                                  <Slider
                                    id="pool-player-contrib"
                                    value={playerContribution}
                                    onValueChange={(value) => {
                                      setPlayerContribution(value);
                                      setOperatorContribution([100 - value[0]]);
                                    }}
                                    max={100}
                                    step={1}
                                    className="flex-1"
                                  />
                                  <div className="relative h-4">
                                    <span
                                      className="absolute text-xs text-neutral-400 -translate-x-1/2"
                                      style={{ left: `${playerContribution[0]}%` }}
                                    >
                                      {playerContribution[0]}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div></div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <BrightLabel htmlFor="pool-operator-contrib">Operator Contribution</BrightLabel>
                                  <span className="text-sm text-neutral-400">{operatorContribution[0]}%</span>
                                </div>
                                <div className="space-y-1">
                                  <Slider
                                    id="pool-operator-contrib"
                                    value={operatorContribution}
                                    onValueChange={(value) => {
                                      setOperatorContribution(value);
                                      setPlayerContribution([100 - value[0]]);
                                    }}
                                    max={100}
                                    step={1}
                                    className="flex-1"
                                  />
                                  <div className="relative h-4">
                                    <span
                                      className="absolute text-xs text-neutral-400 -translate-x-1/2"
                                      style={{ left: `${operatorContribution[0]}%` }}
                                    >
                                      {operatorContribution[0]}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div></div>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-neutral-800">
                            <button
                              onClick={() => setShowAdvanced(!showAdvanced)}
                              className="flex items-center gap-2 text-sm text-neutral-400 hover:text-neutral-200"
                            >
                              <span>⚙</span>
                              <span>Advanced</span>
                            </button>

                            {showAdvanced && (
                              <div className="mt-4 grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                  <BrightLabel htmlFor="max-pool-size">maximum-pool-size</BrightLabel>
                                  <CurrencyInput
                                    id="max-pool-size"
                                    type="number"
                                    placeholder="0"
                                    defaultValue="0"
                                    className="bg-neutral-800 border-neutral-700"
                                  />
                                </div>
                                <div></div>
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <BrightLabel htmlFor="initial-jackpot-fixed">Initial Jackpot Amount</BrightLabel>
                                <CurrencyInput
                                  id="initial-jackpot-fixed"
                                  type="number"
                                  placeholder="0"
                                  value={initialPoolAmount}
                                  onChange={(e) => setInitialPoolAmount(parseFloat(e.target.value) || 0)}
                                  className="bg-neutral-800 border-neutral-700"
                                />
                              </div>
                              <div></div>
                            </div>




                            <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <BrightLabel htmlFor="pool-player-contrib-fixed">Player Contribution</BrightLabel>
                                  <span className="text-sm text-neutral-400">{playerContribution[0]}%</span>
                                </div>
                                <div className="space-y-1">
                                  <Slider
                                    id="pool-player-contrib-fixed"
                                    value={playerContribution}
                                    onValueChange={(value) => {
                                      setPlayerContribution(value);
                                      setOperatorContribution([100 - value[0]]);
                                    }}
                                    max={100}
                                    step={1}
                                    className="flex-1"
                                  />
                                  <div className="relative h-4">
                                    <span
                                      className="absolute text-xs text-neutral-400 -translate-x-1/2"
                                      style={{ left: `${playerContribution[0]}%` }}
                                    >
                                      {playerContribution[0]}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div></div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <BrightLabel htmlFor="pool-operator-contrib-fixed">Operator Contribution</BrightLabel>
                                  <span className="text-sm text-neutral-400">{operatorContribution[0]}%</span>
                                </div>
                                <div className="space-y-1">
                                  <Slider
                                    id="pool-operator-contrib-fixed"
                                    value={operatorContribution}
                                    onValueChange={(value) => {
                                      setOperatorContribution(value);
                                      setPlayerContribution([100 - value[0]]);
                                    }}
                                    max={100}
                                    step={1}
                                    className="flex-1"
                                  />
                                  <div className="relative h-4">
                                    <span
                                      className="absolute text-xs text-neutral-400 -translate-x-1/2"
                                      style={{ left: `${operatorContribution[0]}%` }}
                                    >
                                      {operatorContribution[0]}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div></div>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-neutral-800">
                            <button
                              onClick={() => setShowAdvanced(!showAdvanced)}
                              className="flex items-center gap-2 text-sm text-neutral-400 hover:text-neutral-200"
                            >
                              <span>⚙</span>
                              <span>Advanced</span>
                            </button>

                            {showAdvanced && (
                              <div className="mt-4 grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                  <BrightLabel htmlFor="max-pool-size-fixed">maximum-pool-size</BrightLabel>
                                  <CurrencyInput
                                    id="max-pool-size-fixed"
                                    type="number"
                                    placeholder="0"
                                    defaultValue="0"
                                    className="bg-neutral-800 border-neutral-700"
                                  />
                                </div>
                                <div></div>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </Card>
                </div>
              </section>

              {/* Seed Setup Section */}
              <section ref={seedSetupRef} className="scroll-mt-20">
                <h2 className="text-base font-semibold mb-4">Seed</h2>

                <div className="grid gap-6">
                  <Card className="p-6 bg-neutral-900/50 border-neutral-800">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <BrightLabel htmlFor="reseed-amount">Re-Seeding Amount</BrightLabel>
                        <div className="max-w-[400px]">
                          <CurrencyInput
                            id="reseed-amount"
                            type="number"
                            placeholder="03"
                            defaultValue="03"
                            className="bg-neutral-800 border-neutral-700 w-full"
                          />
                        </div>
                      </div>




                      {seedContributionType === 'percentage' ? (
                        <>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <BrightLabel htmlFor="seed-contribution">Percent Seed Contribution From Wager</BrightLabel>
                              <PercentageInput
                                id="seed-contribution"
                                type="number"
                                placeholder="0"
                                value={seedPercentageValue[0]}
                                onChange={(e) => setSeedPercentageValue([parseFloat(e.target.value) || 0])}
                                className="bg-neutral-800 border-neutral-700"
                              />
                            </div>
                            <div></div>
                          </div>

                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <BrightLabel htmlFor="seed-player-contrib">Player Contribution</BrightLabel>
                                <span className="text-sm text-neutral-400">{seedPlayerContribution[0]}%</span>
                              </div>
                              <div className="space-y-1">
                                <Slider
                                  id="seed-player-contrib"
                                  value={seedPlayerContribution}
                                  onValueChange={(value) => {
                                    setSeedPlayerContribution(value);
                                    setSeedOperatorContribution([100 - value[0]]);
                                  }}
                                  max={100}
                                  step={1}
                                  className="flex-1"
                                />
                                <div className="relative h-4">
                                  <span
                                    className="absolute text-xs text-neutral-400 -translate-x-1/2"
                                    style={{ left: `${seedPlayerContribution[0]}%` }}
                                  >
                                    {seedPlayerContribution[0]}%
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div></div>
                          </div>

                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <BrightLabel htmlFor="seed-operator-contrib">Operator Contribution</BrightLabel>
                                <span className="text-sm text-neutral-400">{seedOperatorContribution[0]}%</span>
                              </div>
                              <div className="space-y-1">
                                <Slider
                                  id="seed-operator-contrib"
                                  value={seedOperatorContribution}
                                  onValueChange={(value) => {
                                    setSeedOperatorContribution(value);
                                    setSeedPlayerContribution([100 - value[0]]);
                                  }}
                                  max={100}
                                  step={1}
                                  className="flex-1"
                                />
                                <div className="relative h-4">
                                  <span
                                    className="absolute text-xs text-neutral-400 -translate-x-1/2"
                                    style={{ left: `${seedOperatorContribution[0]}%` }}
                                  >
                                    {seedOperatorContribution[0]}%
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div></div>
                          </div>




                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <BrightLabel htmlFor="max-seed-percentage">Maximum Seed Amount</BrightLabel>
                              <CurrencyInput
                                id="max-seed-percentage"
                                type="number"
                                placeholder="0"
                                defaultValue="0"
                                className="bg-neutral-800 border-neutral-700"
                              />
                            </div>
                            <div></div>
                          </div>
                        </>
                      ) : (
                        <>



                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <BrightLabel htmlFor="seed-player-contrib-fixed">Player Contribution</BrightLabel>
                                <span className="text-sm text-neutral-400">{seedPlayerContribution[0]}%</span>
                              </div>
                              <div className="space-y-1">
                                <Slider
                                  id="seed-player-contrib-fixed"
                                  value={seedPlayerContribution}
                                  onValueChange={(value) => {
                                    setSeedPlayerContribution(value);
                                    setSeedOperatorContribution([100 - value[0]]);
                                  }}
                                  max={100}
                                  step={1}
                                  className="flex-1"
                                />
                                <div className="relative h-4">
                                  <span
                                    className="absolute text-xs text-neutral-400 -translate-x-1/2"
                                    style={{ left: `${seedPlayerContribution[0]}%` }}
                                  >
                                    {seedPlayerContribution[0]}%
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div></div>
                          </div>

                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <BrightLabel htmlFor="seed-operator-contrib-fixed">Operator Contribution</BrightLabel>
                                <span className="text-sm text-neutral-400">{seedOperatorContribution[0]}%</span>
                              </div>
                              <div className="space-y-1">
                                <Slider
                                  id="seed-operator-contrib-fixed"
                                  value={seedOperatorContribution}
                                  onValueChange={(value) => {
                                    setSeedOperatorContribution(value);
                                    setSeedPlayerContribution([100 - value[0]]);
                                  }}
                                  max={100}
                                  step={1}
                                  className="flex-1"
                                />
                                <div className="relative h-4">
                                  <span
                                    className="absolute text-xs text-neutral-400 -translate-x-1/2"
                                    style={{ left: `${seedOperatorContribution[0]}%` }}
                                  >
                                    {seedOperatorContribution[0]}%
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div></div>
                          </div>




                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <BrightLabel htmlFor="max-seed">Maximum Seed Amount</BrightLabel>
                              <CurrencyInput
                                id="max-seed"
                                type="number"
                                placeholder="0"
                                className="bg-neutral-800 border-neutral-700"
                              />
                            </div>
                            <div></div>
                          </div>
                        </>
                      )}
                    </div>
                  </Card>
                </div>
              </section>

              {/* Recurrence & Timing moved to top of Must-Drop configuration flow. */}



              {eligibilitySection}
              {communityWinSection}
              {/* Trigger Probability is disabled for Must-Drop (value-driven). */}
              {playerTargetingSection}

              {/* Widget Configuration Section */}
              <section ref={configRef} className="scroll-mt-20">
                <h2 className="text-xl font-semibold mb-6">Widget Configuration</h2>

                <div className="grid gap-6">
                  <Card className="p-6 bg-neutral-900/50 border-neutral-800">
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <BrightLabel className="text-sm font-medium">Player Opt-in Type</BrightLabel>
                        <div className="flex gap-3">
                          <button className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium">Automatic</button>
                          <button className="px-4 py-2 rounded-lg bg-neutral-800 text-neutral-400 hover:text-neutral-200 text-sm font-medium">
                            Manual
                          </button>
                        </div>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-neutral-800">
                        <BrightLabel className="text-sm font-medium">Select Widget Design</BrightLabel>
                        <p className="text-xs text-neutral-400 mb-4">
                          Choose a widget design that will be displayed in the slot game
                        </p>
                        <div className="grid grid-cols-4 gap-6">
                          <button
                            onClick={() => setSelectedWidget('jewels')}
                            className={`relative p-4 rounded-lg border-2 transition-all bg-neutral-800/50 ${
                              selectedWidget === 'jewels'
                                ? 'border-blue-500 ring-2 ring-blue-500/20'
                                : 'border-neutral-700 hover:border-neutral-600'
                            }`}
                          >
                            {selectedWidget === 'jewels' && (
                              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center z-10">
                                <div className="w-2 h-2 rounded-full bg-white" />
                              </div>
                            )}
                            <div className="flex items-center justify-center">
                              <img
                                src={widgetMegaJewels}
                                alt="Jackpot Jewels Widget"
                                className="w-full h-auto object-contain"
                              />
                            </div>
                            <p className="text-xs text-neutral-400 mt-3 text-center">Jewels Multi-Tier</p>
                          </button>

                          <button
                            onClick={() => setSelectedWidget('tiers')}
                            className={`relative p-4 rounded-lg border-2 transition-all bg-neutral-800/50 ${
                              selectedWidget === 'tiers'
                                ? 'border-blue-500 ring-2 ring-blue-500/20'
                                : 'border-neutral-700 hover:border-neutral-600'
                            }`}
                          >
                            {selectedWidget === 'tiers' && (
                              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center z-10">
                                <div className="w-2 h-2 rounded-full bg-white" />
                              </div>
                            )}
                            <div className="flex items-center justify-center">
                              <img
                                src={widgetSuperMega}
                                alt="Metal Tiers Widget"
                                className="w-full h-auto object-contain"
                              />
                            </div>
                            <p className="text-xs text-neutral-400 mt-3 text-center">Metal Tiers</p>
                          </button>

                          <button
                            onClick={() => setSelectedWidget('classic')}
                            className={`relative p-4 rounded-lg border-2 transition-all bg-neutral-800/50 ${
                              selectedWidget === 'classic'
                                ? 'border-blue-500 ring-2 ring-blue-500/20'
                                : 'border-neutral-700 hover:border-neutral-600'
                            }`}
                          >
                            {selectedWidget === 'classic' && (
                              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center z-10">
                                <div className="w-2 h-2 rounded-full bg-white" />
                              </div>
                            )}
                            <div className="flex items-center justify-center">
                              <img
                                src={widgetGoldenHarvest}
                                alt="Golden Harvest Widget"
                                className="w-full h-auto object-contain"
                              />
                            </div>
                            <p className="text-xs text-neutral-400 mt-3 text-center">Golden Harvest</p>
                          </button>

                          <button
                            onClick={() => setSelectedWidget('minimal')}
                            className={`relative p-4 rounded-lg border-2 transition-all bg-neutral-800/50 ${
                              selectedWidget === 'minimal'
                                ? 'border-blue-500 ring-2 ring-blue-500/20'
                                : 'border-neutral-700 hover:border-neutral-600'
                            }`}
                          >
                            {selectedWidget === 'minimal' && (
                              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center z-10">
                                <div className="w-2 h-2 rounded-full bg-white" />
                              </div>
                            )}
                            <div className="flex items-center justify-center">
                              <img
                                src={widgetCyberNeon}
                                alt="Cyber Neon Widget"
                                className="w-full h-auto object-contain"
                              />
                            </div>
                            <p className="text-xs text-neutral-400 mt-3 text-center">Cyber Neon</p>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3 pt-4 border-t border-neutral-800">
                        <BrightLabel className="text-sm font-medium">Winning Animation</BrightLabel>
                        <div className="space-y-2 max-w-md">
                          <BrightLabel htmlFor="must-drop-win-animation">Select Animation</BrightLabel>
                          <Select defaultValue="animation1">
                            <SelectTrigger id="must-drop-win-animation" className="bg-neutral-800 border-neutral-700">
                              <SelectValue placeholder="Choose an animation" />
                            </SelectTrigger>
                            <SelectContent className="bg-neutral-800 border-neutral-700">
                              <SelectItem value="animation1">Animation 1</SelectItem>
                              <SelectItem value="animation2">Animation 2</SelectItem>
                              <SelectItem value="animation3">Animation 3</SelectItem>
                              <SelectItem value="animation4">Animation 4</SelectItem>
                              <SelectItem value="animation5">Animation 5</SelectItem>
                              <SelectItem value="animation6">Animation 6</SelectItem>
                              <SelectItem value="animation7">Animation 7</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button variant="outline" className="mt-2">
                          Test Winning Animation
                        </Button>
                      </div>

                      {/* Inform All Players of a Win */}
                      <div className="pt-6 border-t border-neutral-800">
                        <div className="grid grid-cols-2 gap-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <BrightLabel className="text-sm font-medium">Inform All Players of a Win</BrightLabel>
                              <p className="text-xs text-neutral-400 mt-1">
                                Broadcast win notifications to all active players
                              </p>
                            </div>
                            <Switch className="data-[state=checked]:bg-green-500" />
                          </div>
                          <div></div>
                        </div>
                      </div>

                      {/* Community Win Mechanics relocated to its own section above */}

                      {/* Save as Template */}
                      <div className="pt-6 border-t border-neutral-800">
                        <div className="grid grid-cols-2 gap-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <BrightLabel htmlFor="must-drop-is-template" className="text-sm font-medium">Save as Template</BrightLabel>
                              <p className="text-xs text-neutral-400 mt-1">
                                Save this configuration as a reusable template
                              </p>
                            </div>
                            <Switch
                              id="must-drop-is-template"
                              checked={isTemplate}
                              onCheckedChange={setIsTemplate}
                              className="data-[state=checked]:bg-green-500"
                            />
                          </div>
                          <div></div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </section>
            </>
          )}

          {/* Multi-Level Jackpot Fields */}
          {selectedType === 'multi_level' && (
            <>
              {/* Basic Information Section */}
              <section ref={basicRef} className="scroll-mt-20">
                <h2 className="text-xl font-semibold mb-6">Basic Information</h2>

                <div className="grid gap-6">
                  <Card className="p-6 bg-neutral-900/50 border-neutral-800">
                    <div className="grid gap-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <BrightLabel htmlFor="internal-name">Internal Name</BrightLabel>
                          <Input id="internal-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Jackpot Q1 2026" className="bg-neutral-800 border-neutral-700" />
                        </div>
                        <div></div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <BrightLabel htmlFor="description">Internal Description</BrightLabel>
                          <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what this jackpot does..." className="bg-neutral-800 border-neutral-700 min-h-[100px] text-white" />
                        </div>
                        <div></div>
                      </div>
                    </div>
                  </Card>
                  <PrizeEconomySelector value={prizeEconomy} onChange={setPrizeEconomy} />
                </div>
              </section>
            </>
          )}

          {/* Frequency Jackpot Fields */}
          {selectedType === 'frequency' && (
            <>
              {/* Basic Information Section */}
              <section ref={basicRef} className="scroll-mt-20">
                <h2 className="text-xl font-semibold mb-6">Basic Information</h2>

                <div className="grid gap-6">
                  <Card className="p-6 bg-neutral-900/50 border-neutral-800">
                    <div className="grid gap-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <BrightLabel htmlFor="internal-name">Internal Name</BrightLabel>
                          <Input id="internal-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Jackpot Q1 2026" className="bg-neutral-800 border-neutral-700" />
                        </div>
                        <div></div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <BrightLabel htmlFor="description">Internal Description</BrightLabel>
                          <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what this jackpot does..." className="bg-neutral-800 border-neutral-700 min-h-[100px] text-white" />
                        </div>
                        <div></div>
                      </div>
                    </div>
                  </Card>
                  <PrizeEconomySelector value={prizeEconomy} onChange={setPrizeEconomy} />
                </div>
              </section>

              {/* 1. Happy Hour Frequency Settings — calendar recurrence + windows. */}
              <section ref={schedulingRef} className="scroll-mt-20">
                <h2 className="text-xl font-semibold mb-6">Happy Hour Frequency Settings</h2>
                <div className="grid gap-6">
                  <Card className="p-6 bg-neutral-900/50 border-neutral-800">
                    <p className="text-xs text-neutral-400 mb-6">
                      Calendar-gated jackpot. Contributions only accrue during the Contribution Window;
                      payouts only fire during the Winning Window. Both are serialized as
                      <code className="ml-1 text-neutral-300">contributionFrequency</code> &amp;{' '}
                      <code className="text-neutral-300">winFrequency</code> JSON for the Java engine.
                    </p>

                    <div className="space-y-6">
                      {/* Interval + conditional day picker */}
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <BrightLabel htmlFor="freq-interval">Recurrence Interval</BrightLabel>
                          <Select
                            value={freqInterval}
                            onValueChange={(v) => {
                              setFreqInterval(v as 'DAILY' | 'WEEKLY' | 'MONTHLY');
                              setFreqDay('');
                            }}
                          >
                            <SelectTrigger id="freq-interval" className="bg-neutral-800 border-neutral-700 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-neutral-800 border-neutral-700 text-white">
                              <SelectItem value="DAILY" className="text-white">Daily</SelectItem>
                              <SelectItem value="WEEKLY" className="text-white">Weekly</SelectItem>
                              <SelectItem value="MONTHLY" className="text-white">Monthly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {freqInterval === 'WEEKLY' && (
                          <div className="space-y-2">
                            <BrightLabel htmlFor="freq-day-weekly">Day of Week</BrightLabel>
                            <Select value={freqDay} onValueChange={setFreqDay}>
                              <SelectTrigger id="freq-day-weekly" className="bg-neutral-800 border-neutral-700 text-white">
                                <SelectValue placeholder="Select a day (1–7)" />
                              </SelectTrigger>
                              <SelectContent className="bg-neutral-800 border-neutral-700 text-white">
                                {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map((label, i) => (
                                  <SelectItem key={i + 1} value={String(i + 1)} className="text-white">
                                    {i + 1} — {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {freqInterval === 'MONTHLY' && (
                          <div className="space-y-2">
                            <BrightLabel htmlFor="freq-day-monthly">Day of Month</BrightLabel>
                            <Select value={freqDay} onValueChange={setFreqDay}>
                              <SelectTrigger id="freq-day-monthly" className="bg-neutral-800 border-neutral-700 text-white">
                                <SelectValue placeholder="Select a day (1–31)" />
                              </SelectTrigger>
                              <SelectContent className="bg-neutral-800 border-neutral-700 text-white max-h-[300px]">
                                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                                  <SelectItem key={d} value={String(d)} className="text-white">{d}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>

                      {/* Contribution Window */}
                      <div className="pt-2 border-t border-neutral-800">
                        <BrightLabel className="text-sm">Contribution Window</BrightLabel>
                        <p className="text-[11px] text-neutral-500 mt-1 mb-3">
                          Only bets placed within this window contribute to the pool.
                        </p>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <BrightLabel htmlFor="contrib-start">Start Time</BrightLabel>
                            <Input
                              id="contrib-start"
                              type="time"
                              value={contribStartTime}
                              onChange={(e) => setContribStartTime(e.target.value)}
                              className="bg-neutral-800 border-neutral-700 text-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <BrightLabel htmlFor="contrib-end">End Time</BrightLabel>
                            <Input
                              id="contrib-end"
                              type="time"
                              value={contribEndTime}
                              onChange={(e) => setContribEndTime(e.target.value)}
                              className="bg-neutral-800 border-neutral-700 text-white"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Clone toggle */}
                      <div className="flex items-center justify-between p-4 rounded-lg bg-neutral-800/40 border border-neutral-800">
                        <div className="space-y-1 pr-4">
                          <BrightLabel className="text-sm">Mirror Contribution Window into Winning Window</BrightLabel>
                          <p className="text-[11px] text-neutral-500">
                            When on, players win only during the same hours they contributed. Turn off to
                            schedule a separate payout window (e.g. accrue all day, pay out 20:00–21:00).
                          </p>
                        </div>
                        <Switch checked={cloneContribToWin} onCheckedChange={setCloneContribToWin} />
                      </div>

                      {/* Winning Window (split mode) */}
                      {!cloneContribToWin && (
                        <div className="pt-2 border-t border-neutral-800">
                          <BrightLabel className="text-sm">Winning Window</BrightLabel>
                          <p className="text-[11px] text-neutral-500 mt-1 mb-3">
                            Only payouts triggered during this window are awarded.
                          </p>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <BrightLabel htmlFor="win-start">Start Time</BrightLabel>
                              <Input
                                id="win-start"
                                type="time"
                                value={winStartTime}
                                onChange={(e) => setWinStartTime(e.target.value)}
                                className="bg-neutral-800 border-neutral-700 text-white"
                              />
                            </div>
                            <div className="space-y-2">
                              <BrightLabel htmlFor="win-end">End Time</BrightLabel>
                              <Input
                                id="win-end"
                                type="time"
                                value={winEndTime}
                                onChange={(e) => setWinEndTime(e.target.value)}
                                className="bg-neutral-800 border-neutral-700 text-white"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              </section>

              {/* 2. Win Targets & Payout Model — payout-model toggle + bound target amounts. */}
              <section ref={modelRef} className="scroll-mt-20">
                <h2 className="text-xl font-semibold mb-6">Win Targets & Payout Model</h2>
                <div className="grid gap-6">
                  <Card className="p-6 bg-neutral-900/50 border-neutral-800">
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <BrightLabel className="text-sm font-medium">Payout Model</BrightLabel>
                        <RadioGroup value={payoutModel} onValueChange={(v) => setPayoutModel(v as PayoutModel)}>
                          <div className="grid grid-cols-3 gap-4">
                            <label className={`relative flex flex-col p-5 rounded-lg border-2 cursor-pointer transition-all ${
                              payoutModel === 'fixed' ? 'border-blue-500 bg-blue-500/10' : 'border-neutral-700 bg-neutral-800/30 hover:border-neutral-600'
                            }`}>
                              <RadioGroupItem value="fixed" className="sr-only" />
                              <div className="flex items-center justify-between mb-3">
                                <span className="font-medium text-white">Fixed Payout</span>
                                {payoutModel === 'fixed' && (
                                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                                    <div className="w-2 h-2 rounded-full bg-white" />
                                  </div>
                                )}
                              </div>
                              <span className="text-xs text-neutral-400 leading-relaxed">Predetermined fixed amount every drop.</span>
                            </label>

                            <label className={`relative flex flex-col p-5 rounded-lg border-2 cursor-pointer transition-all ${
                              payoutModel === 'average' ? 'border-blue-500 bg-blue-500/10' : 'border-neutral-700 bg-neutral-800/30 hover:border-neutral-600'
                            }`}>
                              <RadioGroupItem value="average" className="sr-only" />
                              <div className="flex items-center justify-between mb-3">
                                <span className="font-medium text-white">Average Payout</span>
                                {payoutModel === 'average' && (
                                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                                    <div className="w-2 h-2 rounded-full bg-white" />
                                  </div>
                                )}
                              </div>
                              <span className="text-xs text-neutral-400 leading-relaxed">Targets an average with min/max bounds.</span>
                            </label>

                            <label className={`relative flex flex-col p-5 rounded-lg border-2 cursor-pointer transition-all ${
                              payoutModel === 'maximum' ? 'border-blue-500 bg-blue-500/10' : 'border-neutral-700 bg-neutral-800/30 hover:border-neutral-600'
                            }`}>
                              <RadioGroupItem value="maximum" className="sr-only" />
                              <div className="flex items-center justify-between mb-3">
                                <span className="font-medium text-white">Maximum Payout</span>
                                {payoutModel === 'maximum' && (
                                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                                    <div className="w-2 h-2 rounded-full bg-white" />
                                  </div>
                                )}
                              </div>
                              <span className="text-xs text-neutral-400 leading-relaxed">Varies up to a hard maximum cap.</span>
                            </label>
                          </div>
                        </RadioGroup>
                      </div>

                      {payoutModel === 'fixed' && (
                        <div className="grid grid-cols-2 gap-6 pt-4 border-t border-neutral-800">
                          <div className="space-y-2">
                            <BrightLabel htmlFor="freq-fixed-amount">Fixed Win Amount</BrightLabel>
                            <CurrencyInput
                              id="freq-fixed-amount"
                              type="number"
                              placeholder="0"
                              value={fixedWinAmount || ''}
                              onChange={(e) => setFixedWinAmount(parseFloat(e.target.value) || 0)}
                              className="bg-neutral-800 border-neutral-700"
                            />
                          </div>
                          <div></div>
                        </div>
                      )}

                      {payoutModel === 'average' && (
                        <div className="space-y-6 pt-4 border-t border-neutral-800">
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <BrightLabel htmlFor="freq-avg-amount">Average Win Amount</BrightLabel>
                              <CurrencyInput
                                id="freq-avg-amount"
                                type="number"
                                placeholder="0"
                                value={averageWinAmount || ''}
                                onChange={(e) => setAverageWinAmount(parseFloat(e.target.value) || 0)}
                                className="bg-neutral-800 border-neutral-700"
                              />
                            </div>
                            <div></div>
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <BrightLabel htmlFor="freq-min-win-avg">Minimum Win Amount</BrightLabel>
                              <CurrencyInput
                                id="freq-min-win-avg"
                                type="number"
                                placeholder="0"
                                value={minWinAmount || ''}
                                onChange={(e) => setMinWinAmount(parseFloat(e.target.value) || 0)}
                                className="bg-neutral-800 border-neutral-700"
                              />
                            </div>
                            <div className="space-y-2">
                              <BrightLabel htmlFor="freq-max-win-avg">Maximum Win Amount</BrightLabel>
                              <CurrencyInput
                                id="freq-max-win-avg"
                                type="number"
                                placeholder="0"
                                value={maxWinAmount || ''}
                                onChange={(e) => setMaxWinAmount(parseFloat(e.target.value) || 0)}
                                className="bg-neutral-800 border-neutral-700"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {payoutModel === 'maximum' && (
                        <div className="grid grid-cols-2 gap-6 pt-4 border-t border-neutral-800">
                          <div className="space-y-2">
                            <BrightLabel htmlFor="freq-min-win-max">Minimum Win Amount</BrightLabel>
                            <CurrencyInput
                              id="freq-min-win-max"
                              type="number"
                              placeholder="0"
                              value={minWinAmount || ''}
                              onChange={(e) => setMinWinAmount(parseFloat(e.target.value) || 0)}
                              className="bg-neutral-800 border-neutral-700"
                            />
                          </div>
                          <div className="space-y-2">
                            <BrightLabel htmlFor="freq-max-win-max">Maximum Win Amount</BrightLabel>
                            <CurrencyInput
                              id="freq-max-win-max"
                              type="number"
                              placeholder="0"
                              value={maxWinAmount || ''}
                              onChange={(e) => setMaxWinAmount(parseFloat(e.target.value) || 0)}
                              className="bg-neutral-800 border-neutral-700"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              </section>

              {/* 3. Drop Pacing — standalone volatility slider. */}
              <section className="scroll-mt-20">
                <h2 className="text-xl font-semibold mb-6">Drop Pacing</h2>
                <div className="grid gap-6">
                  <Card className="p-6 bg-neutral-900/50 border-neutral-800">
                    <div className="space-y-3">
                      <BrightLabel htmlFor="freq-volatility">Volatility ({volatility[0]})</BrightLabel>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-neutral-400 w-6">1</span>
                        <Slider
                          id="freq-volatility"
                          value={volatility}
                          onValueChange={setVolatility}
                          min={1}
                          max={10}
                          step={1}
                          className="flex-1"
                        />
                        <span className="text-sm text-neutral-400 w-6 text-right">10</span>
                      </div>
                      <p className="text-[11px] text-neutral-500">
                        Lower settings distribute triggers evenly across the Happy Hour window. Higher settings
                        hold triggers back to build suspense and concentrate drops near the end of the window.
                      </p>
                    </div>
                  </Card>
                </div>
              </section>

              {/* 4. Operation Safeguards — global per-jackpot caps. */}
              <section className="scroll-mt-20">
                <h2 className="text-xl font-semibold mb-6">Operation Safeguards</h2>
                <div className="grid gap-6">
                  <Card className="p-6 bg-neutral-900/50 border-neutral-800">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <BrightLabel htmlFor="freq-max-number-wins">Maximum Number of Wins</BrightLabel>
                        <Input
                          id="freq-max-number-wins"
                          type="number"
                          placeholder="0"
                          value={maxNumberOfWins || ''}
                          onChange={(e) => setMaxNumberOfWins(parseInt(e.target.value) || 0)}
                          className="bg-neutral-800 border-neutral-700"
                        />
                        <p className="text-[11px] text-neutral-500">Hard cap on drops across the jackpot's lifetime. 0 = unlimited.</p>
                      </div>
                      <div className="space-y-2">
                        <BrightLabel htmlFor="freq-max-total-payout">Max Total Payout</BrightLabel>
                        <CurrencyInput
                          id="freq-max-total-payout"
                          type="number"
                          placeholder="0"
                          value={maxTotalPayout || ''}
                          onChange={(e) => setMaxTotalPayout(parseFloat(e.target.value) || 0)}
                          className="bg-neutral-800 border-neutral-700"
                        />
                        <p className="text-[11px] text-neutral-500">Aggregate payout ceiling across all wins. 0 = unlimited.</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </section>

              {jackpotContributionSection}

              {/* Pool Setup Section */}
              <section ref={poolSetupRef} className="scroll-mt-20">
                <h2 className="text-base font-semibold mb-4">Pool</h2>

                <div className="grid gap-6">
                  <Card className="p-6 bg-neutral-900/50 border-neutral-800">
                    <div className="space-y-6">



                      {contributionType === 'percentage' ? (
                        <>
                          <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <BrightLabel htmlFor="frequency-initial-jackpot">Initial Jackpot Amount</BrightLabel>
                                <CurrencyInput
                                  id="frequency-initial-jackpot"
                                  type="number"
                                  placeholder="0"
                                  value={initialPoolAmount}
                                  onChange={(e) => setInitialPoolAmount(parseFloat(e.target.value) || 0)}
                                  className="bg-neutral-800 border-neutral-700"
                                />
                              </div>
                              <div></div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <BrightLabel htmlFor="frequency-pool-contribution">Percentage of Wager Pool Contribution Amount</BrightLabel>
                                <PercentageInput
                                  id="frequency-pool-contribution"
                                  type="number"
                                  placeholder="3"
                                  value={poolPercentageValue[0]}
                                  onChange={(e) => setPoolPercentageValue([parseFloat(e.target.value) || 0])}
                                  className="bg-neutral-800 border-neutral-700"
                                />
                              </div>
                              <div></div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <BrightLabel htmlFor="frequency-pool-player-contrib">Player Contribution</BrightLabel>
                                  <span className="text-sm text-neutral-400">{playerContribution[0]}%</span>
                                </div>
                                <div className="space-y-1">
                                  <Slider
                                    id="frequency-pool-player-contrib"
                                    value={playerContribution}
                                    onValueChange={(value) => {
                                      setPlayerContribution(value);
                                      setOperatorContribution([100 - value[0]]);
                                    }}
                                    max={100}
                                    step={1}
                                    className="flex-1"
                                  />
                                  <div className="relative h-4">
                                    <span
                                      className="absolute text-xs text-neutral-400 -translate-x-1/2"
                                      style={{ left: `${playerContribution[0]}%` }}
                                    >
                                      {playerContribution[0]}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div></div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <BrightLabel htmlFor="frequency-pool-operator-contrib">Operator Contribution</BrightLabel>
                                  <span className="text-sm text-neutral-400">{operatorContribution[0]}%</span>
                                </div>
                                <div className="space-y-1">
                                  <Slider
                                    id="frequency-pool-operator-contrib"
                                    value={operatorContribution}
                                    onValueChange={(value) => {
                                      setOperatorContribution(value);
                                      setPlayerContribution([100 - value[0]]);
                                    }}
                                    max={100}
                                    step={1}
                                    className="flex-1"
                                  />
                                  <div className="relative h-4">
                                    <span
                                      className="absolute text-xs text-neutral-400 -translate-x-1/2"
                                      style={{ left: `${operatorContribution[0]}%` }}
                                    >
                                      {operatorContribution[0]}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div></div>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-neutral-800">
                            <button
                              onClick={() => setShowAdvanced(!showAdvanced)}
                              className="flex items-center gap-2 text-sm text-neutral-400 hover:text-neutral-200"
                            >
                              <span>⚙</span>
                              <span>Advanced</span>
                            </button>

                            {showAdvanced && (
                              <div className="mt-4 grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                  <BrightLabel htmlFor="frequency-max-pool-size">maximum-pool-size</BrightLabel>
                                  <CurrencyInput
                                    id="frequency-max-pool-size"
                                    type="number"
                                    placeholder="0"
                                    defaultValue="0"
                                    className="bg-neutral-800 border-neutral-700"
                                  />
                                </div>
                                <div></div>
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <BrightLabel htmlFor="frequency-initial-jackpot-fixed">Initial Jackpot Amount</BrightLabel>
                                <CurrencyInput
                                  id="frequency-initial-jackpot-fixed"
                                  type="number"
                                  placeholder="0"
                                  value={initialPoolAmount}
                                  onChange={(e) => setInitialPoolAmount(parseFloat(e.target.value) || 0)}
                                  className="bg-neutral-800 border-neutral-700"
                                />
                              </div>
                              <div></div>
                            </div>




                            <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <BrightLabel htmlFor="frequency-pool-player-contrib-fixed">Player Contribution</BrightLabel>
                                  <span className="text-sm text-neutral-400">{playerContribution[0]}%</span>
                                </div>
                                <div className="space-y-1">
                                  <Slider
                                    id="frequency-pool-player-contrib-fixed"
                                    value={playerContribution}
                                    onValueChange={(value) => {
                                      setPlayerContribution(value);
                                      setOperatorContribution([100 - value[0]]);
                                    }}
                                    max={100}
                                    step={1}
                                    className="flex-1"
                                  />
                                  <div className="relative h-4">
                                    <span
                                      className="absolute text-xs text-neutral-400 -translate-x-1/2"
                                      style={{ left: `${playerContribution[0]}%` }}
                                    >
                                      {playerContribution[0]}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div></div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <BrightLabel htmlFor="frequency-pool-operator-contrib-fixed">Operator Contribution</BrightLabel>
                                  <span className="text-sm text-neutral-400">{operatorContribution[0]}%</span>
                                </div>
                                <div className="space-y-1">
                                  <Slider
                                    id="frequency-pool-operator-contrib-fixed"
                                    value={operatorContribution}
                                    onValueChange={(value) => {
                                      setOperatorContribution(value);
                                      setPlayerContribution([100 - value[0]]);
                                    }}
                                    max={100}
                                    step={1}
                                    className="flex-1"
                                  />
                                  <div className="relative h-4">
                                    <span
                                      className="absolute text-xs text-neutral-400 -translate-x-1/2"
                                      style={{ left: `${operatorContribution[0]}%` }}
                                    >
                                      {operatorContribution[0]}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div></div>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-neutral-800">
                            <button
                              onClick={() => setShowAdvanced(!showAdvanced)}
                              className="flex items-center gap-2 text-sm text-neutral-400 hover:text-neutral-200"
                            >
                              <span>⚙</span>
                              <span>Advanced</span>
                            </button>

                            {showAdvanced && (
                              <div className="mt-4 grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                  <BrightLabel htmlFor="frequency-max-pool-size-fixed">maximum-pool-size</BrightLabel>
                                  <CurrencyInput
                                    id="frequency-max-pool-size-fixed"
                                    type="number"
                                    placeholder="0"
                                    defaultValue="0"
                                    className="bg-neutral-800 border-neutral-700"
                                  />
                                </div>
                                <div></div>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </Card>
                </div>
              </section>

              {/* Seed Setup Section */}
              <section ref={seedSetupRef} className="scroll-mt-20">
                <h2 className="text-base font-semibold mb-4">Seed</h2>

                <div className="grid gap-6">
                  <Card className="p-6 bg-neutral-900/50 border-neutral-800">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <BrightLabel htmlFor="frequency-reseed-amount">Re-Seeding Amount</BrightLabel>
                        <div className="max-w-[400px]">
                          <CurrencyInput
                            id="frequency-reseed-amount"
                            type="number"
                            placeholder="03"
                            defaultValue="03"
                            className="bg-neutral-800 border-neutral-700 w-full"
                          />
                        </div>
                      </div>




                      {seedContributionType === 'percentage' ? (
                        <>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <BrightLabel htmlFor="frequency-seed-contribution">Percent Seed Contribution From Wager</BrightLabel>
                              <PercentageInput
                                id="frequency-seed-contribution"
                                type="number"
                                placeholder="0"
                                value={seedPercentageValue[0]}
                                onChange={(e) => setSeedPercentageValue([parseFloat(e.target.value) || 0])}
                                className="bg-neutral-800 border-neutral-700"
                              />
                            </div>
                            <div></div>
                          </div>

                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <BrightLabel htmlFor="frequency-seed-player-contrib">Player Contribution</BrightLabel>
                                <span className="text-sm text-neutral-400">{seedPlayerContribution[0]}%</span>
                              </div>
                              <div className="space-y-1">
                                <Slider
                                  id="frequency-seed-player-contrib"
                                  value={seedPlayerContribution}
                                  onValueChange={(value) => {
                                    setSeedPlayerContribution(value);
                                    setSeedOperatorContribution([100 - value[0]]);
                                  }}
                                  max={100}
                                  step={1}
                                  className="flex-1"
                                />
                                <div className="relative h-4">
                                  <span
                                    className="absolute text-xs text-neutral-400 -translate-x-1/2"
                                    style={{ left: `${seedPlayerContribution[0]}%` }}
                                  >
                                    {seedPlayerContribution[0]}%
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div></div>
                          </div>

                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <BrightLabel htmlFor="frequency-seed-operator-contrib">Operator Contribution</BrightLabel>
                                <span className="text-sm text-neutral-400">{seedOperatorContribution[0]}%</span>
                              </div>
                              <div className="space-y-1">
                                <Slider
                                  id="frequency-seed-operator-contrib"
                                  value={seedOperatorContribution}
                                  onValueChange={(value) => {
                                    setSeedOperatorContribution(value);
                                    setSeedPlayerContribution([100 - value[0]]);
                                  }}
                                  max={100}
                                  step={1}
                                  className="flex-1"
                                />
                                <div className="relative h-4">
                                  <span
                                    className="absolute text-xs text-neutral-400 -translate-x-1/2"
                                    style={{ left: `${seedOperatorContribution[0]}%` }}
                                  >
                                    {seedOperatorContribution[0]}%
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div></div>
                          </div>




                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <BrightLabel htmlFor="frequency-max-seed-percentage">Maximum Seed Amount</BrightLabel>
                              <CurrencyInput
                                id="frequency-max-seed-percentage"
                                type="number"
                                placeholder="0"
                                defaultValue="0"
                                className="bg-neutral-800 border-neutral-700"
                              />
                            </div>
                            <div></div>
                          </div>
                        </>
                      ) : (
                        <>



                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <BrightLabel htmlFor="frequency-seed-player-contrib-fixed">Player Contribution</BrightLabel>
                                <span className="text-sm text-neutral-400">{seedPlayerContribution[0]}%</span>
                              </div>
                              <div className="space-y-1">
                                <Slider
                                  id="frequency-seed-player-contrib-fixed"
                                  value={seedPlayerContribution}
                                  onValueChange={(value) => {
                                    setSeedPlayerContribution(value);
                                    setSeedOperatorContribution([100 - value[0]]);
                                  }}
                                  max={100}
                                  step={1}
                                  className="flex-1"
                                />
                                <div className="relative h-4">
                                  <span
                                    className="absolute text-xs text-neutral-400 -translate-x-1/2"
                                    style={{ left: `${seedPlayerContribution[0]}%` }}
                                  >
                                    {seedPlayerContribution[0]}%
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div></div>
                          </div>

                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <BrightLabel htmlFor="frequency-seed-operator-contrib-fixed">Operator Contribution</BrightLabel>
                                <span className="text-sm text-neutral-400">{seedOperatorContribution[0]}%</span>
                              </div>
                              <div className="space-y-1">
                                <Slider
                                  id="frequency-seed-operator-contrib-fixed"
                                  value={seedOperatorContribution}
                                  onValueChange={(value) => {
                                    setSeedOperatorContribution(value);
                                    setSeedPlayerContribution([100 - value[0]]);
                                  }}
                                  max={100}
                                  step={1}
                                  className="flex-1"
                                />
                                <div className="relative h-4">
                                  <span
                                    className="absolute text-xs text-neutral-400 -translate-x-1/2"
                                    style={{ left: `${seedOperatorContribution[0]}%` }}
                                  >
                                    {seedOperatorContribution[0]}%
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div></div>
                          </div>




                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <BrightLabel htmlFor="frequency-max-seed">Maximum Seed Amount</BrightLabel>
                              <CurrencyInput
                                id="frequency-max-seed"
                                type="number"
                                placeholder="0"
                                className="bg-neutral-800 border-neutral-700"
                              />
                            </div>
                            <div></div>
                          </div>
                        </>
                      )}
                    </div>
                  </Card>
                </div>
              </section>

              {/* Legacy Scheduling section removed — replaced by Happy Hour Frequency Settings at top. */}

              {eligibilitySection}
              {communityWinSection}
              {/* Trigger Probability is disabled for Frequency (time-driven). */}
              {playerTargetingSection}

            </>
          )}
        </div>




        {/* ── Engine Configuration: Multi-Level tiers only.
            Must-Drop derives lifespan/period from its Recurrence picker.
            Frequency derives windows from Happy Hour Settings — no legacy lifespan card. */}
        {selectedType === 'multi_level' && (
          <section className="mt-10 scroll-mt-20">
            <h2 className="text-xl font-semibold mb-2">Engine Configuration</h2>
            <p className="text-sm text-neutral-400 mb-6">
              These fields drive the simulator engine directly for Multi-Level tier cascading.
            </p>

            {selectedType === 'multi_level' && (
              <Card className="p-6 bg-neutral-900/50 border-neutral-800 mb-6">
                <BrightLabel className="text-base">Global Parameters</BrightLabel>
                <p className="text-xs text-neutral-400 mt-1 mb-4">
                  Engine-wide tuning applied across all tiers.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <BrightLabel htmlFor="ml-volatility">Volatility</BrightLabel>
                    <div className="flex items-center gap-4">
                      <Slider
                        id="ml-volatility"
                        value={volatility}
                        onValueChange={setVolatility}
                        min={0}
                        max={10}
                        step={0.5}
                        className="flex-1"
                      />
                      <span className="text-sm text-neutral-400 w-10 text-right">{volatility[0]}</span>
                    </div>
                    <p className="text-[11px] text-neutral-500">
                      Exponent applied to each tier's hit-chance curve. Lower = looser / more frequent wins, higher = tighter / rarer wins.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <BrightLabel htmlFor="ml-maxwin">Jackpot Maximum Win Amount</BrightLabel>
                    <CurrencyInput
                      id="ml-maxwin"
                      type="number"
                      value={maxWinAmount || ''}
                      onChange={(e) => setMaxWinAmount(parseFloat(e.target.value) || 0)}
                      className="bg-neutral-800 border-neutral-700"
                    />
                    <p className="text-[11px] text-neutral-500">
                      Global cap referenced by the highest tier (e.g. Mega).
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {selectedType === 'multi_level' && (
              <Card className="p-6 bg-neutral-900/50 border-neutral-800">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <BrightLabel className="text-base">Tiers</BrightLabel>
                    <p className="text-xs text-neutral-400 mt-1">
                      Up to 4 tiers. Higher rank evaluated first (Mega → Mini). Weights split each bet's pool &amp; seed contribution.
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs ${Math.abs(tierWeightTotal - 1) < 0.005 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      Weight total: {tierWeightTotal.toFixed(3)} {Math.abs(tierWeightTotal - 1) < 0.005 ? '✓' : '(should be 1.000)'}
                    </div>
                    <Button type="button" size="sm" variant="outline" className="mt-2" onClick={addTier} disabled={tiers.length >= 4}>
                      <Plus className="w-4 h-4 mr-1" /> Add tier
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {tiers.map((t, idx) => (
                    <div key={idx} className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs uppercase tracking-wider text-neutral-500">Tier #{idx + 1}</span>
                        <Button type="button" size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => removeTier(idx)} disabled={tiers.length <= 1}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <BrightLabel>Label</BrightLabel>
                          <Input value={t.label ?? ''} onChange={(e) => updateTier(idx, { label: e.target.value })} placeholder="Mini / Major / Mega" className="bg-neutral-800 border-neutral-700" />
                        </div>
                        <div className="space-y-2">
                          <BrightLabel>Rank (1–4)</BrightLabel>
                          <Input type="number" min={1} max={4} value={t.multiLevelTier} onChange={(e) => updateTier(idx, { multiLevelTier: Math.max(1, Math.min(4, parseInt(e.target.value) || 1)) })} className="bg-neutral-800 border-neutral-700" />
                        </div>
                        <div className="space-y-2">
                          <BrightLabel>Weight (0–1)</BrightLabel>
                          <Input type="number" step="0.01" min={0} max={1} value={t.multiLevelWeight} onChange={(e) => updateTier(idx, { multiLevelWeight: Math.max(0, Math.min(1, parseFloat(e.target.value) || 0)) })} className="bg-neutral-800 border-neutral-700" />
                        </div>
                        <div className="space-y-2">
                          <BrightLabel>Reseed / Min Pool</BrightLabel>
                          <CurrencyInput id={`tier-reseed-${idx}`} type="number" value={t.reseedingAmount} onChange={(e) => updateTier(idx, { reseedingAmount: parseFloat(e.target.value) || 0 })} className="bg-neutral-800 border-neutral-700" />
                        </div>
                        <div className="space-y-2">
                          <BrightLabel>Min Win</BrightLabel>
                          <CurrencyInput id={`tier-minwin-${idx}`} type="number" value={t.minWinAmount} onChange={(e) => updateTier(idx, { minWinAmount: parseFloat(e.target.value) || 0 })} className="bg-neutral-800 border-neutral-700" />
                        </div>
                        <div className="space-y-2">
                          <BrightLabel>Max Win</BrightLabel>
                          <CurrencyInput id={`tier-maxwin-${idx}`} type="number" value={t.maxWinAmount} onChange={(e) => updateTier(idx, { maxWinAmount: parseFloat(e.target.value) || 0 })} className="bg-neutral-800 border-neutral-700" />
                        </div>
                        <div className="space-y-2">
                          <BrightLabel>Average / Target Win</BrightLabel>
                          <CurrencyInput id={`tier-avgwin-${idx}`} type="number" value={t.averageWinAmount} onChange={(e) => updateTier(idx, { averageWinAmount: parseFloat(e.target.value) || 0 })} className="bg-neutral-800 border-neutral-700" />
                        </div>
                        <div className="space-y-2">
                          <BrightLabel>Max Pool Cap</BrightLabel>
                          <CurrencyInput id={`tier-maxpool-${idx}`} type="number" value={t.maximumPoolAmount ?? 0} onChange={(e) => updateTier(idx, { maximumPoolAmount: parseFloat(e.target.value) || 0 })} className="bg-neutral-800 border-neutral-700" />
                          <p className="text-[10px] text-neutral-500">0 = uncapped</p>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-neutral-800">
                        <div className="text-xs uppercase tracking-wider text-neutral-500 mb-3">Contributions &amp; Operator Share</div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <BrightLabel>Pool Contribution Type</BrightLabel>
                            <select
                              value={t.poolContributionType ?? 'percentage'}
                              onChange={(e) => updateTier(idx, { poolContributionType: e.target.value as 'fixed' | 'percentage' })}
                              className="w-full h-10 rounded-md bg-neutral-800 border border-neutral-700 px-3 text-sm text-neutral-100"
                            >
                              <option value="percentage">Percentage (%)</option>
                              <option value="fixed">Fixed</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <BrightLabel>Pool Contribution Amount</BrightLabel>
                            <Input type="number" step="0.01" min={0} value={t.poolContributionAmount ?? 0} onChange={(e) => updateTier(idx, { poolContributionAmount: parseFloat(e.target.value) || 0 })} className="bg-neutral-800 border-neutral-700" />
                          </div>
                          <div className="space-y-2">
                            <BrightLabel>Seed Contribution Type</BrightLabel>
                            <select
                              value={t.seedContributionType ?? 'percentage'}
                              onChange={(e) => updateTier(idx, { seedContributionType: e.target.value as 'fixed' | 'percentage' })}
                              className="w-full h-10 rounded-md bg-neutral-800 border border-neutral-700 px-3 text-sm text-neutral-100"
                            >
                              <option value="percentage">Percentage (%)</option>
                              <option value="fixed">Fixed</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <BrightLabel>Seed Contribution Amount</BrightLabel>
                            <Input type="number" step="0.01" min={0} value={t.seedContributionAmount ?? 0} onChange={(e) => updateTier(idx, { seedContributionAmount: parseFloat(e.target.value) || 0 })} className="bg-neutral-800 border-neutral-700" />
                          </div>
                          <div className="space-y-2">
                            <BrightLabel>Seed Initial Balance</BrightLabel>
                            <CurrencyInput id={`tier-seedinit-${idx}`} type="number" value={t.seedInitialAmount ?? 0} onChange={(e) => updateTier(idx, { seedInitialAmount: parseFloat(e.target.value) || 0 })} className="bg-neutral-800 border-neutral-700" />
                          </div>
                          <div className="space-y-2">
                            <BrightLabel>Seed Target Amount</BrightLabel>
                            <CurrencyInput id={`tier-seedtgt-${idx}`} type="number" value={t.seedTargetAmount ?? 0} onChange={(e) => updateTier(idx, { seedTargetAmount: parseFloat(e.target.value) || 0 })} className="bg-neutral-800 border-neutral-700" />
                          </div>
                          <div className="space-y-2">
                            <BrightLabel>Pool Operator Share (%)</BrightLabel>
                            <Input type="number" step="0.1" min={0} max={100} value={t.operatorShare ?? 0} onChange={(e) => updateTier(idx, { operatorShare: Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)) })} className="bg-neutral-800 border-neutral-700" />
                          </div>
                          <div className="space-y-2">
                            <BrightLabel>Seed Operator Share (%)</BrightLabel>
                            <Input type="number" step="0.1" min={0} max={100} value={t.seedOperatorShare ?? 0} onChange={(e) => updateTier(idx, { seedOperatorShare: Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)) })} className="bg-neutral-800 border-neutral-700" />
                          </div>
                        </div>
                      </div>

                      {/* ── v2: Per-tier Contribution Split + Trigger Odds ── */}
                      <div className="mt-4 pt-4 border-t border-neutral-800">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-xs uppercase tracking-wider text-neutral-500">Engine v2 · Split &amp; Trigger Odds</div>
                          <div className="inline-flex rounded-md bg-neutral-800 p-0.5 text-xs">
                            <button
                              type="button"
                              onClick={() => updateTier(idx, { contributionMode: 'legacy' })}
                              className={`px-3 py-1 rounded ${(t.contributionMode ?? 'legacy') === 'legacy' ? 'bg-blue-500 text-white' : 'text-neutral-300'}`}
                            >
                              Legacy
                            </button>
                            <button
                              type="button"
                              onClick={() => updateTier(idx, { contributionMode: 'split' })}
                              className={`px-3 py-1 rounded ${t.contributionMode === 'split' ? 'bg-blue-500 text-white' : 'text-neutral-300'}`}
                            >
                              Split
                            </button>
                          </div>
                        </div>
                        {t.contributionMode === 'split' && (() => {
                          const tType = t.totalContributionType ?? 'fixed';
                          const tAmt = Number(t.totalContributionAmount) || 0;
                          const tPool = Number(t.poolWeight ?? 60);
                          const tSeed = Number(t.seedWeight ?? 30);
                          const tHouse = Number(t.houseWeight ?? 10);
                          const tSum = tPool + tSeed + tHouse;
                          const tOk = Math.abs(tSum - 100) < 0.05;
                          const totalCalc = tType === 'fixed' ? tAmt : (previewWager * tAmt) / 100;
                          // Largest-remainder rounding @ 4 decimals so displayed amounts sum to totalCalc.
                          const tAlloc = (() => {
                            const weights = [tPool, tSeed, tHouse];
                            if (!tOk || totalCalc <= 0) return weights.map((w) => totalCalc * (w / 100));
                            const scale = 10000;
                            const target = Math.round(totalCalc * scale);
                            const exacts = weights.map((w) => (totalCalc * (w / 100)) * scale);
                            const floors = exacts.map((x) => Math.floor(x));
                            let gap = target - floors.reduce((a, b) => a + b, 0);
                            const order = exacts.map((x, i) => ({ i, rem: x - Math.floor(x) }))
                              .sort((a, b) => b.rem - a.rem).map((o) => o.i);
                            const units = floors.slice();
                            for (let j = 0; j < order.length && gap > 0; j++, gap--) units[order[j]]++;
                            return units.map((u) => u / scale);
                          })();
                          const projIdx = (k: 'pool' | 'seed' | 'house') => {
                            const i = k === 'pool' ? 0 : k === 'seed' ? 1 : 2;
                            return `€${tAlloc[i].toFixed(4)}`;
                          };
                          const setTierWeight = (key: 'pool' | 'seed' | 'house', val: number) => {
                            const others = (['pool', 'seed', 'house'] as const).filter((k) => k !== key);
                            const cur = { pool: tPool, seed: tSeed, house: tHouse };
                            const otherSum = cur[others[0]] + cur[others[1]];
                            const max = Math.max(0, 100 - otherSum);
                            const next = Math.max(0, Math.min(max, Number(val) || 0));
                            updateTier(idx, { [`${key}Weight`]: next } as any);
                          };
                          return (
                            <div className="space-y-4 mb-3">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <BrightLabel>Total Contribution Type</BrightLabel>
                                  <select
                                    value={tType}
                                    onChange={(e) => updateTier(idx, { totalContributionType: e.target.value as 'fixed' | 'percentage' })}
                                    className="w-full h-10 rounded-md bg-neutral-800 border border-neutral-700 px-3 text-sm text-neutral-100"
                                  >
                                    <option value="fixed">Fixed</option>
                                    <option value="percentage">Percentage of Wager</option>
                                  </select>
                                </div>
                                <div className="space-y-2">
                                  <BrightLabel>Total Contribution Amount</BrightLabel>
                                  <Input type="number" step="0.01" min={0} value={tAmt}
                                    onChange={(e) => updateTier(idx, { totalContributionAmount: parseFloat(e.target.value) || 0 })}
                                    className="bg-neutral-800 border-neutral-700" />
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                {(['pool', 'seed', 'house'] as const).map((k) => {
                                  const val = k === 'pool' ? tPool : k === 'seed' ? tSeed : tHouse;
                                  const label = k === 'pool' ? 'Pool %' : k === 'seed' ? 'Seed %' : 'House %';
                                  return (
                                    <div key={k} className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-2.5 space-y-1.5">
                                      <div className="flex items-baseline justify-between">
                                        <BrightLabel className="text-xs">{label}</BrightLabel>
                                        <span className="text-[10px] text-emerald-400 tabular-nums">{projIdx(k)}</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <WeightDraftInput
                                          value={val}
                                          onCommit={(next) => setTierWeight(k, next)}
                                          className="h-8 bg-neutral-800 border-neutral-700 text-right tabular-nums text-xs"
                                        />
                                        <span className="text-[10px] text-neutral-400">%</span>
                                      </div>
                                      <Slider value={[val]} onValueChange={(v) => setTierWeight(k, v[0])} min={0} max={100} step={1} />
                                    </div>
                                  );
                                })}
                              </div>
                              <div className={`text-xs ${tOk ? 'text-emerald-400' : 'text-amber-400'}`}>
                                Sum: {tSum.toFixed(2)}% {tOk ? '✓' : '— must equal 100 to save'}
                              </div>
                            </div>
                          );
                        })()}
                        <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-3 space-y-2">
                          <BrightLabel className="text-sm">Trigger Probability Denominator (N)</BrightLabel>
                          <div className="flex items-stretch gap-2">
                            <Input type="number" min={0} max={10_000_000} step={1} maxLength={8} value={t.triggerOdds ?? 0}
                              onChange={(e) => {
                                const raw = parseInt(e.target.value.slice(0, 8)) || 0;
                                updateTier(idx, { triggerOdds: Math.max(0, Math.min(10_000_000, raw)) });
                              }}
                              placeholder="0 = disabled"
                              aria-invalid={Number(t.triggerOdds) > 10_000_000}
                              className={`flex-1 bg-neutral-800 border-neutral-700 ${Number(t.triggerOdds) > 10_000_000 ? 'border-red-500 ring-1 ring-red-500' : ''}`} />
                            <div className="flex items-center px-3 rounded-md bg-neutral-800/60 border border-neutral-800 text-xs text-emerald-400 tabular-nums whitespace-nowrap min-w-[140px] justify-center">
                              {Number(t.triggerOdds) > 0
                                ? `1 in ${Number(t.triggerOdds).toLocaleString()} spins`
                                : 'disabled'}
                            </div>
                          </div>
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300">
                            <span className="font-semibold">RNG Boundary Limit:</span> Max 10,000,000
                          </div>
                          {Number(t.triggerOdds) > 10_000_000 && (
                            <p className="text-[11px] text-red-400">
                              Exceeds certified RNG ceiling of 10,000,000.
                            </p>
                          )}
                          <p className="text-[11px] text-neutral-500">
                            {Number(t.triggerOdds) > 0
                              ? `p = ${(1 / Number(t.triggerOdds)).toExponential(3)} per spin`
                              : 'Empty/0 → uses curve-based hit chance.'}
                          </p>
                        </div>
                      </div>
                    </div>

                  ))}
                </div>
              </Card>
            )}

            {/* Frequency legacy Virtual Lifespan card removed — superseded by Happy Hour Frequency Settings. */}
          </section>
        )}




        {/* Continue bar — bottom-right, navigates to /backoffice/simulator */}

        <div className="flex items-center justify-between pt-8 pb-16 border-t border-neutral-800 mt-8">
          <Button variant="outline" size="lg" onClick={handleBack}>Back</Button>
          <div className="flex items-center gap-4">
            {continueError && (
              <span className="text-sm text-red-400">{continueError}</span>
            )}
            <Button
              size="lg"
              className="bg-blue-500 hover:bg-blue-600"
              onClick={handleContinue}
            >
              Continue
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}