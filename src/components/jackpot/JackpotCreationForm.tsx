import { useState, useRef, useEffect } from 'react';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { Clock, LogOut, Plus, X } from 'lucide-react';
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

export type PayoutModel = 'fixed' | 'average' | 'maximum';
export type ContributionType = 'fixed' | 'percentage';
export type JackpotType = 'classic' | 'must_drop' | 'multi_level' | 'frequency';
export type RecurrenceType = 'single' | 'daily' | 'weekly' | 'monthly';
export type DisplayFrequency = 'daily' | 'weekly' | 'monthly';

export type JackpotSavePayload = {
  name: string;
  description: string;
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
  }>;
};

export interface JackpotCreationFormProps {
  onSave: (payload: JackpotSavePayload) => void | Promise<void>;
  submitting?: boolean;
  onCancel?: () => void;
}

export function JackpotCreationForm({ onSave, submitting = false, onCancel }: JackpotCreationFormProps) {
  const navigate = useNavigate();
  const incoming = useRouterState({
    select: (s) => s.location.state as { jackpotConfig?: JackpotSavePayload } | undefined,
  });
  // Capture once on mount so re-renders don't clobber user edits.
  const initial = useRef<JackpotSavePayload | undefined>(incoming?.jackpotConfig).current;

  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeSection, setActiveSection] = useState('basic');

  // Jackpot type selection
  const [selectedType, setSelectedType] = useState<JackpotType>(initial?.type ?? 'classic');
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');

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

  // --- MUST_DROP / FREQUENCY virtual lifespan
  const [lifespanMinutes, setLifespanMinutes] = useState<number>(initial?.lifespanMinutes ?? 1440);
  const [mustDropPeriod, setMustDropPeriod] = useState<1 | 2 | 3 | 4>(initial?.mustDropPeriod ?? 2);

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

  function buildPayload(): JackpotSavePayload {
    return {
      name: name.trim(),
      description: description.trim(),
      type: selectedType,
      payoutModel,
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
      isTemplate,
      selectedWidget,
      fixedWinAmount,
      averageWinAmount,
      minWinAmount,
      maxWinAmount,
      minWagerAmount,
      maxWagerAmount,
      reseedingAmount,
      maximumSeedAmount,
      ...(selectedType === 'must_drop' || selectedType === 'frequency'
        ? { lifespanMinutes, mustDropPeriod }
        : {}),
      ...(selectedType === 'multi_level' ? { tiers } : {}),
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
    if ((payload.type === 'frequency' || payload.type === 'must_drop') && !payload.recurrenceType) {
      setContinueError('Pick a recurrence to continue.');
      return;
    }

    navigate({
      to: '/admin/simulator',
      state: { jackpotConfig: payload } as never,
    });
  }

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

                <button
                  onClick={() => setSelectedType('multi_level')}
                  className={`relative flex flex-col p-6 rounded-lg border-2 transition-all ${
                    selectedType === 'multi_level'
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-neutral-700 bg-neutral-800/30 hover:border-neutral-600'
                  }`}
                >
                  {selectedType === 'multi_level' && (
                    <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  )}
                  <div className="text-3xl mb-3">🏆</div>
                  <div className="font-medium text-white mb-2">Multi-Level</div>
                  <div className="text-xs text-neutral-400">
                    Multiple jackpot tiers with different prize pools
                  </div>
                </button>

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

          {/* Segment Selection */}
          <section className="scroll-mt-20">
            <Card className="p-6 bg-neutral-900/50 border-neutral-800">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <BrightLabel className="text-sm font-medium">Segmented</BrightLabel>
                      <p className="text-xs text-neutral-400 mt-1">
                        Enable to create jackpots for specific player segments
                      </p>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-2 bg-neutral-800/50 rounded-full border border-neutral-700">
                      <span className={`text-xs font-medium transition-colors ${!isSegmented ? 'text-neutral-100' : 'text-neutral-500'}`}>
                        {isSegmented ? 'Segmented' : 'Global'}
                      </span>
                      <Switch
                        checked={isSegmented}
                        onCheckedChange={(checked) => {
                          setIsSegmented(checked);
                          if (!checked) {
                            setSegments(['Segment 1']);
                          }
                        }}
                        className="data-[state=checked]:bg-blue-500"
                      />
                    </div>
                  </div>
                  <div></div>
                </div>

                {isSegmented && (
                  <div className="pt-4 border-t border-neutral-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <BrightLabel className="text-sm font-medium">Player Segments</BrightLabel>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSegments([...segments, `Segment ${segments.length + 1}`])}
                        className="gap-2 h-8"
                      >
                        <Plus className="w-4 h-4" />
                        Add Segment
                      </Button>
                    </div>

                    <div className="grid gap-3">
                      {segments.map((segment, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <Input 
                            value={segment}
                            onChange={(e) => {
                              const newSegments = [...segments];
                              newSegments[index] = e.target.value;
                              setSegments(newSegments);
                            }}
                            placeholder="Enter segment name..." 
                            className="bg-neutral-800 border-neutral-700 flex-1"
                          />
                          {segments.length > 1 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSegments(segments.filter((_, i) => i !== index))}
                              className="h-10 w-10 p-0 text-neutral-400 hover:text-red-400"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                </div>
              </section>

              {/* Win Logic & Model Section */}
              <section ref={modelRef} className="scroll-mt-20">
                <h2 className="text-xl font-semibold mb-6">Win Logic & Model</h2>
                
                <div className="grid gap-6">
                  <Card className="p-6 bg-neutral-900/50 border-neutral-800">
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <BrightLabel className="text-sm font-medium">Payout Model</BrightLabel>
                        <RadioGroup value={payoutModel} onValueChange={(v) => setPayoutModel(v as PayoutModel)}>
                          <div className="grid grid-cols-3 gap-4">
                            <label className={`relative flex flex-col p-5 rounded-lg border-2 cursor-pointer transition-all ${
                              payoutModel === 'fixed' 
                                ? 'border-blue-500 bg-blue-500/10' 
                                : 'border-neutral-700 bg-neutral-800/30 hover:border-neutral-600'
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
                              <span className="text-xs text-neutral-400 leading-relaxed">
                                Jackpot pays a predetermined fixed amount every time
                              </span>
                            </label>
                            
                            <label className={`relative flex flex-col p-5 rounded-lg border-2 cursor-pointer transition-all ${
                              payoutModel === 'average' 
                                ? 'border-blue-500 bg-blue-500/10' 
                                : 'border-neutral-700 bg-neutral-800/30 hover:border-neutral-600'
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
                              <span className="text-xs text-neutral-400 leading-relaxed">
                                Payout varies around a target average with volatility control
                              </span>
                            </label>
                            
                            <label className={`relative flex flex-col p-5 rounded-lg border-2 cursor-pointer transition-all ${
                              payoutModel === 'maximum' 
                                ? 'border-blue-500 bg-blue-500/10' 
                                : 'border-neutral-700 bg-neutral-800/30 hover:border-neutral-600'
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
                              <span className="text-xs text-neutral-400 leading-relaxed">
                                Payout varies with a defined maximum cap
                              </span>
                            </label>
                          </div>
                        </RadioGroup>
                      </div>

                      {/* Model-specific fields */}
                      {payoutModel === 'fixed' && (
                        <div className="space-y-6 pt-4">
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <BrightLabel htmlFor="fixed-amount">Fixed Win Amount</BrightLabel>
                              <CurrencyInput
                                id="fixed-amount"
                                type="number"
                                placeholder="0"
                                value={fixedWinAmount || ''}
                                onChange={(e) => setFixedWinAmount(parseFloat(e.target.value) || 0)}
                                className="bg-neutral-800 border-neutral-700"
                              />
                              <p className="text-xs text-red-400">This field is required</p>
                            </div>
                            <div></div>
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <BrightLabel htmlFor="volatility">Volatility</BrightLabel>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-neutral-400">0</span>
                                  <Slider
                                    value={volatility}
                                    onValueChange={setVolatility}
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
                            </div>
                            <div></div>
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <BrightLabel htmlFor="min-wager-fixed">Minimum Wager Amount</BrightLabel>
                              <CurrencyInput
                                id="min-wager-fixed"
                                type="number"
                                placeholder="0"
                                value={minWagerAmount || ''}
                                onChange={(e) => setMinWagerAmount(parseFloat(e.target.value) || 0)}
                                className="bg-neutral-800 border-neutral-700"
                              />
                            </div>
                            <div></div>
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <BrightLabel htmlFor="max-wager-fixed">Maximum Wager Amount</BrightLabel>
                              <CurrencyInput
                                id="max-wager-fixed"
                                type="number"
                                placeholder="0"
                                value={maxWagerAmount || ''}
                                onChange={(e) => setMaxWagerAmount(parseFloat(e.target.value) || 0)}
                                className="bg-neutral-800 border-neutral-700"
                              />
                            </div>
                            <div></div>
                          </div>
                        </div>
                      )}

                      {payoutModel === 'average' && (
                        <div className="space-y-6 pt-4">
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <BrightLabel htmlFor="avg-target">Average Win Amount</BrightLabel>
                              <CurrencyInput
                                id="avg-target"
                                type="number"
                                placeholder="0"
                                value={averageWinAmount || ''}
                                onChange={(e) => setAverageWinAmount(parseFloat(e.target.value) || 0)}
                                className="bg-neutral-800 border-neutral-700"
                              />
                              <p className="text-xs text-red-400">This field is required</p>
                            </div>
                            <div></div>
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <BrightLabel htmlFor="min-win">Minimum Win Amount</BrightLabel>
                              <CurrencyInput
                                id="min-win"
                                type="number"
                                placeholder="0"
                                value={minWinAmount || ''}
                                onChange={(e) => setMinWinAmount(parseFloat(e.target.value) || 0)}
                                className="bg-neutral-800 border-neutral-700"
                              />
                            </div>
                            <div></div>
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <BrightLabel htmlFor="max-win">Maximum Win Amount</BrightLabel>
                              <CurrencyInput
                                id="max-win"
                                type="number"
                                placeholder="0"
                                value={maxWinAmount || ''}
                                onChange={(e) => setMaxWinAmount(parseFloat(e.target.value) || 0)}
                                className="bg-neutral-800 border-neutral-700"
                              />
                            </div>
                            <div></div>
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <BrightLabel htmlFor="volatility-avg">Volatility</BrightLabel>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-neutral-400">0</span>
                                  <Slider
                                    value={volatility}
                                    onValueChange={setVolatility}
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
                            </div>
                            <div></div>
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <BrightLabel htmlFor="min-wager">Minimum Wager Amount</BrightLabel>
                              <CurrencyInput
                                id="min-wager"
                                type="number"
                                placeholder="0"
                                value={minWagerAmount || ''}
                                onChange={(e) => setMinWagerAmount(parseFloat(e.target.value) || 0)}
                                className="bg-neutral-800 border-neutral-700"
                              />
                            </div>
                            <div></div>
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <BrightLabel htmlFor="max-wager">Maximum Wager Amount</BrightLabel>
                              <CurrencyInput
                                id="max-wager"
                                type="number"
                                placeholder="0"
                                value={maxWagerAmount || ''}
                                onChange={(e) => setMaxWagerAmount(parseFloat(e.target.value) || 0)}
                                className="bg-neutral-800 border-neutral-700"
                              />
                            </div>
                            <div></div>
                          </div>
                        </div>
                      )}

                      {payoutModel === 'maximum' && (
                        <div className="space-y-6 pt-4">
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <BrightLabel htmlFor="min-win-max">Minimum Win Amount</BrightLabel>
                              <CurrencyInput
                                id="min-win-max"
                                type="number"
                                placeholder="0"
                                value={minWinAmount || ''}
                                onChange={(e) => setMinWinAmount(parseFloat(e.target.value) || 0)}
                                className="bg-neutral-800 border-neutral-700"
                              />
                            </div>
                            <div></div>
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <BrightLabel htmlFor="max-win-max">Maximum Win Amount</BrightLabel>
                              <CurrencyInput
                                id="max-win-max"
                                type="number"
                                placeholder="0"
                                value={maxWinAmount || ''}
                                onChange={(e) => setMaxWinAmount(parseFloat(e.target.value) || 0)}
                                className="bg-neutral-800 border-neutral-700"
                              />
                            </div>
                            <div></div>
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <BrightLabel htmlFor="volatility-max">Volatility</BrightLabel>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-neutral-400">0</span>
                                  <Slider
                                    value={volatility}
                                    onValueChange={setVolatility}
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
                            </div>
                            <div></div>
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <BrightLabel htmlFor="min-wager-max">Minimum Wager Amount</BrightLabel>
                              <CurrencyInput
                                id="min-wager-max"
                                type="number"
                                placeholder="0"
                                className="bg-neutral-800 border-neutral-700"
                              />
                            </div>
                            <div></div>
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <BrightLabel htmlFor="max-wager-max">Maximum Wager Amount</BrightLabel>
                              <CurrencyInput
                                id="max-wager-max"
                                type="number"
                                placeholder="0"
                                className="bg-neutral-800 border-neutral-700"
                              />
                            </div>
                            <div></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              </section>

              {/* Pool Setup Section */}
              <section ref={poolSetupRef} className="scroll-mt-20">
                <h2 className="text-xl font-semibold mb-6">Pool Setup</h2>
                
                <div className="grid gap-6">
                  <Card className="p-6 bg-neutral-900/50 border-neutral-800">
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => setContributionType('fixed')}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            contributionType === 'fixed'
                              ? 'bg-blue-500 text-white'
                              : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
                          }`}
                        >
                          Fixed
                        </button>
                        <button
                          onClick={() => setContributionType('percentage')}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            contributionType === 'percentage'
                              ? 'bg-blue-500 text-white'
                              : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
                          }`}
                        >
                          Percentage
                        </button>
                      </div>

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
                                  defaultValue="0"
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
                                  className="bg-neutral-800 border-neutral-700"
                                />
                              </div>
                              <div></div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <BrightLabel htmlFor="pool-contribution">Fixed Pool Contribution Amount</BrightLabel>
                                <CurrencyInput
                                  id="pool-contribution"
                                  type="number"
                                  placeholder="1"
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
                <h2 className="text-xl font-semibold mb-6">Seed Setup</h2>
                
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

                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => setSeedContributionType('fixed')}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            seedContributionType === 'fixed'
                              ? 'bg-blue-500 text-white'
                              : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
                          }`}
                        >
                          Fixed
                        </button>
                        <button
                          onClick={() => setSeedContributionType('percentage')}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            seedContributionType === 'percentage'
                              ? 'bg-blue-500 text-white'
                              : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
                          }`}
                        >
                          Percentage
                        </button>
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
                              <BrightLabel htmlFor="min-wager-seed-percentage">Minimum Wager Amount</BrightLabel>
                              <CurrencyInput
                                id="min-wager-seed-percentage"
                                type="number"
                                placeholder="0"
                                defaultValue="0"
                                className="bg-neutral-800 border-neutral-700"
                              />
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
                          <div className="space-y-2">
                            <BrightLabel htmlFor="seed-contribution">Fixed Seed Contribution Amount</BrightLabel>
                            <div className="max-w-[400px]">
                              <CurrencyInput
                                id="seed-contribution"
                                type="number"
                                placeholder="0"
                                value={seedPercentageValue[0]}
                                onChange={(e) => setSeedPercentageValue([parseFloat(e.target.value) || 0])}
                                className="bg-neutral-800 border-neutral-700 w-full"
                              />
                            </div>
                          </div>

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
                              <BrightLabel htmlFor="min-wager-seed-fixed">Minimum Wager Amount</BrightLabel>
                              <CurrencyInput
                                id="min-wager-seed-fixed"
                                type="number"
                                placeholder="0"
                                className="bg-neutral-800 border-neutral-700"
                              />
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

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <BrightLabel htmlFor="max-wins">Maximum Number of Wins</BrightLabel>
                          <Input
                            id="max-wins"
                            type="number"
                            placeholder="0"
                            className="bg-neutral-800 border-neutral-700"
                          />
                          <p className="text-xs text-neutral-500">
                            Jackpot deactivates after this many wins (0 = unlimited)
                          </p>
                        </div>
                        <div></div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <BrightLabel htmlFor="max-payout">Maximum Total Payout Amount</BrightLabel>
                          <CurrencyInput
                            id="max-payout"
                            type="number"
                            placeholder="0"
                            className="bg-neutral-800 border-neutral-700"
                          />
                          <p className="text-xs text-neutral-500">
                            Jackpot stops after total payouts reach this amount
                          </p>
                        </div>
                        <div></div>
                      </div>
                    </div>
                  </Card>
                </div>
              </section>

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

                      {/* Community Section */}
                      <div className="pt-6 border-t border-neutral-800 space-y-6">
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
                          <div className="pt-4 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <BrightLabel htmlFor="community-split">Community Split</BrightLabel>
                                  <span className="text-sm text-neutral-400">{communitySplit[0]}%</span>
                                </div>
                                <p className="text-xs text-red-400">This is required</p>
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
                                    <span>Winner</span>
                                    <span>Community</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-neutral-400">0%</span>
                                    <Slider
                                      id="community-split"
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
                                      <BrightLabel htmlFor="payout-interval-minutes">Payout Interval</BrightLabel>
                                      <Input
                                        id="payout-interval-minutes"
                                        type="number"
                                        placeholder="Enter minutes (e.g., 60, 120, 180)"
                                        defaultValue="0"
                                        min="0"
                                        className="bg-neutral-800 border-neutral-700 max-w-[200px]"
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div></div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <BrightLabel htmlFor="community-max-win">Maximum Win Amount</BrightLabel>
                                <CurrencyInput
                                  id="community-max-win"
                                  type="number"
                                  placeholder="0"
                                  className="bg-neutral-800 border-neutral-700"
                                />
                              </div>
                              <div></div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <BrightLabel htmlFor="community-max-players">Maximum Number Of Players</BrightLabel>
                                <Input
                                  id="community-max-players"
                                  type="number"
                                  placeholder="0"
                                  className="bg-neutral-800 border-neutral-700"
                                />
                              </div>
                              <div></div>
                            </div>
                          </div>
                        )}
                      </div>

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
                </div>
              </section>

              {/* Win Logic & Model Section */}
              <section ref={modelRef} className="scroll-mt-20">
                <h2 className="text-xl font-semibold mb-6">Win Logic & Model</h2>

                <div className="grid gap-6">
                  <Card className="p-6 bg-neutral-900/50 border-neutral-800">
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <BrightLabel htmlFor="max-win-must-drop">Maximum Win Amount</BrightLabel>
                          <CurrencyInput
                            id="max-win-must-drop"
                            type="number"
                            placeholder="0"
                            className="bg-neutral-800 border-neutral-700"
                          />
                        </div>
                        <div></div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <BrightLabel htmlFor="min-win-must-drop">Minimum Win Amount</BrightLabel>
                          <CurrencyInput
                            id="min-win-must-drop"
                            type="number"
                            placeholder="0"
                            className="bg-neutral-800 border-neutral-700"
                          />
                        </div>
                        <div></div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <BrightLabel htmlFor="volatility-must-drop">Volatility</BrightLabel>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-neutral-400">0</span>
                              <Slider
                                value={volatility}
                                onValueChange={setVolatility}
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
                        </div>
                        <div></div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <BrightLabel htmlFor="min-wager-must-drop">Minimum Wager Amount</BrightLabel>
                          <CurrencyInput
                            id="min-wager-must-drop"
                            type="number"
                            placeholder="0"
                            className="bg-neutral-800 border-neutral-700"
                          />
                        </div>
                        <div></div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <BrightLabel htmlFor="max-wager-must-drop">Maximum Wager Amount</BrightLabel>
                          <CurrencyInput
                            id="max-wager-must-drop"
                            type="number"
                            placeholder="0"
                            className="bg-neutral-800 border-neutral-700"
                          />
                        </div>
                        <div></div>
                      </div>
                    </div>
                  </Card>
                </div>
              </section>

              {/* Pool Setup Section */}
              <section ref={poolSetupRef} className="scroll-mt-20">
                <h2 className="text-xl font-semibold mb-6">Pool Setup</h2>

                <div className="grid gap-6">
                  <Card className="p-6 bg-neutral-900/50 border-neutral-800">
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => setContributionType('fixed')}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            contributionType === 'fixed'
                              ? 'bg-blue-500 text-white'
                              : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
                          }`}
                        >
                          Fixed
                        </button>
                        <button
                          onClick={() => setContributionType('percentage')}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            contributionType === 'percentage'
                              ? 'bg-blue-500 text-white'
                              : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
                          }`}
                        >
                          Percentage
                        </button>
                      </div>

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
                                  defaultValue="0"
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
                                  className="bg-neutral-800 border-neutral-700"
                                />
                              </div>
                              <div></div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <BrightLabel htmlFor="pool-contribution">Fixed Pool Contribution Amount</BrightLabel>
                                <CurrencyInput
                                  id="pool-contribution"
                                  type="number"
                                  placeholder="1"
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
                <h2 className="text-xl font-semibold mb-6">Seed Setup</h2>

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

                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => setSeedContributionType('fixed')}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            seedContributionType === 'fixed'
                              ? 'bg-blue-500 text-white'
                              : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
                          }`}
                        >
                          Fixed
                        </button>
                        <button
                          onClick={() => setSeedContributionType('percentage')}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            seedContributionType === 'percentage'
                              ? 'bg-blue-500 text-white'
                              : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
                          }`}
                        >
                          Percentage
                        </button>
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
                              <BrightLabel htmlFor="min-wager-seed-percentage">Minimum Wager Amount</BrightLabel>
                              <CurrencyInput
                                id="min-wager-seed-percentage"
                                type="number"
                                placeholder="0"
                                defaultValue="0"
                                className="bg-neutral-800 border-neutral-700"
                              />
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
                          <div className="space-y-2">
                            <BrightLabel htmlFor="seed-contribution">Fixed Seed Contribution Amount</BrightLabel>
                            <div className="max-w-[400px]">
                              <CurrencyInput
                                id="seed-contribution"
                                type="number"
                                placeholder="0"
                                value={seedPercentageValue[0]}
                                onChange={(e) => setSeedPercentageValue([parseFloat(e.target.value) || 0])}
                                className="bg-neutral-800 border-neutral-700 w-full"
                              />
                            </div>
                          </div>

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
                              <BrightLabel htmlFor="min-wager-seed-fixed">Minimum Wager Amount</BrightLabel>
                              <CurrencyInput
                                id="min-wager-seed-fixed"
                                type="number"
                                placeholder="0"
                                className="bg-neutral-800 border-neutral-700"
                              />
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

              {/* Jackpot Recurrence Section */}
              <section ref={recurrenceRef} className="scroll-mt-20">
                <h2 className="text-xl font-semibold mb-6">Jackpot Recurrence</h2>

                <div className="grid gap-6">
                  <Card className="p-6 bg-neutral-900/50 border-neutral-800">
                    <div className="space-y-6">
                      {/* Recurrence Type Buttons */}
                      <div>
                        <BrightLabel className="mb-3 block">Recurrence Type</BrightLabel>
                        <div className="flex gap-3">
                          <button
                            onClick={() => setRecurrenceType('single')}
                            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                              recurrenceType === 'single'
                                ? 'bg-white text-neutral-900'
                                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200'
                            }`}
                          >
                            Single
                          </button>
                          <button
                            onClick={() => setRecurrenceType('daily')}
                            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                              recurrenceType === 'daily'
                                ? 'bg-white text-neutral-900'
                                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200'
                            }`}
                          >
                            Daily
                          </button>
                          <button
                            onClick={() => setRecurrenceType('weekly')}
                            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                              recurrenceType === 'weekly'
                                ? 'bg-white text-neutral-900'
                                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200'
                            }`}
                          >
                            Weekly
                          </button>
                          <button
                            onClick={() => setRecurrenceType('monthly')}
                            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                              recurrenceType === 'monthly'
                                ? 'bg-white text-neutral-900'
                                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200'
                            }`}
                          >
                            Monthly
                          </button>
                        </div>
                      </div>

                      {/* Weekly Fields */}
                      {recurrenceType === 'weekly' && (
                        <div className="space-y-6">
                          <div className="space-y-2">
                            <BrightLabel htmlFor="weekly-startDate">Start Date & Time</BrightLabel>
                            <Input
                              id="weekly-startDate"
                              type="datetime-local"
                              className="bg-neutral-800 border-neutral-700 max-w-[400px]"
                            />
                          </div>

                          <div className="space-y-2">
                            <BrightLabel htmlFor="weekly-endDate">End Date & Time</BrightLabel>
                            <Input
                              id="weekly-endDate"
                              type="datetime-local"
                              className="bg-neutral-800 border-neutral-700 max-w-[400px]"
                            />
                          </div>

                          <div className="space-y-2">
                            <BrightLabel htmlFor="frequency-day-mustDrop">Frequency Day Must Drop</BrightLabel>
                            <Select value={weeklyDay} onValueChange={setWeeklyDay}>
                              <SelectTrigger id="frequency-day-mustDrop" className="bg-neutral-800 border-neutral-700 max-w-[400px] text-white">
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent className="bg-neutral-800 border-neutral-700 text-white">
                                <SelectItem value="monday" className="text-white">Monday</SelectItem>
                                <SelectItem value="tuesday" className="text-white">Tuesday</SelectItem>
                                <SelectItem value="wednesday" className="text-white">Wednesday</SelectItem>
                                <SelectItem value="thursday" className="text-white">Thursday</SelectItem>
                                <SelectItem value="friday" className="text-white">Friday</SelectItem>
                                <SelectItem value="saturday" className="text-white">Saturday</SelectItem>
                                <SelectItem value="sunday" className="text-white">Sunday</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <BrightLabel htmlFor="weekly-max-number-wins">Maximum Number of Wins</BrightLabel>
                            <Input
                              id="weekly-max-number-wins"
                              type="number"
                              defaultValue="0"
                              className="bg-neutral-800 border-neutral-700 max-w-[400px]"
                            />
                          </div>

                          <div className="space-y-2">
                            <BrightLabel htmlFor="weekly-maximum-payout-amount">Maximum Payout Amount</BrightLabel>
                            <CurrencyInput
                              id="weekly-maximum-payout-amount"
                              type="number"
                              defaultValue="0"
                              className="bg-neutral-800 border-neutral-700 max-w-[400px]"
                            />
                          </div>
                        </div>
                      )}

                      {/* Monthly Fields */}
                      {recurrenceType === 'monthly' && (
                        <div className="space-y-6">
                          <div className="space-y-2">
                            <BrightLabel htmlFor="monthly-startDate">Start Date & Time</BrightLabel>
                            <Input
                              id="monthly-startDate"
                              type="datetime-local"
                              className="bg-neutral-800 border-neutral-700 max-w-[400px]"
                            />
                          </div>

                          <div className="space-y-2">
                            <BrightLabel htmlFor="monthly-endDate">End Date & Time</BrightLabel>
                            <Input
                              id="monthly-endDate"
                              type="datetime-local"
                              className="bg-neutral-800 border-neutral-700 max-w-[400px]"
                            />
                          </div>

                          <div className="space-y-2">
                            <BrightLabel htmlFor="frequency-day-mustDrop-monthly">Frequency Day Must Drop</BrightLabel>
                            <Select value={monthlyDay} onValueChange={setMonthlyDay}>
                              <SelectTrigger id="frequency-day-mustDrop-monthly" className="bg-neutral-800 border-neutral-700 max-w-[400px] text-white">
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent className="bg-neutral-800 border-neutral-700 text-white max-h-[300px]">
                                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                                  <SelectItem key={day} value={day.toString()} className="text-white">
                                    {day}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <BrightLabel htmlFor="monthly-max-number-wins">Maximum Number of Wins</BrightLabel>
                            <Input
                              id="monthly-max-number-wins"
                              type="number"
                              defaultValue="0"
                              className="bg-neutral-800 border-neutral-700 max-w-[400px]"
                            />
                          </div>

                          <div className="space-y-2">
                            <BrightLabel htmlFor="monthly-maximum-payout-amount">Maximum Payout Amount</BrightLabel>
                            <CurrencyInput
                              id="monthly-maximum-payout-amount"
                              type="number"
                              defaultValue="0"
                              className="bg-neutral-800 border-neutral-700 max-w-[400px]"
                            />
                          </div>
                        </div>
                      )}

                      {/* Daily Fields */}
                      {recurrenceType === 'daily' && (
                        <div className="space-y-6">
                          <div className="space-y-2">
                            <BrightLabel htmlFor="daily-startDate">Start Date & Time</BrightLabel>
                            <Input
                              id="daily-startDate"
                              type="datetime-local"
                              className="bg-neutral-800 border-neutral-700 max-w-[400px]"
                            />
                          </div>

                          <div className="space-y-2">
                            <BrightLabel htmlFor="daily-endDate">End Date & Time</BrightLabel>
                            <Input
                              id="daily-endDate"
                              type="datetime-local"
                              className="bg-neutral-800 border-neutral-700 max-w-[400px]"
                            />
                          </div>

                          <div className="space-y-2">
                            <BrightLabel htmlFor="daily-max-number-wins">Maximum Number of Wins</BrightLabel>
                            <Input
                              id="daily-max-number-wins"
                              type="number"
                              defaultValue="0"
                              className="bg-neutral-800 border-neutral-700 max-w-[400px]"
                            />
                          </div>

                          <div className="space-y-2">
                            <BrightLabel htmlFor="daily-maximum-payout-amount">Maximum Payout Amount</BrightLabel>
                            <CurrencyInput
                              id="daily-maximum-payout-amount"
                              type="number"
                              defaultValue="0"
                              className="bg-neutral-800 border-neutral-700 max-w-[400px]"
                            />
                          </div>
                        </div>
                      )}

                      {/* Single Fields */}
                      {recurrenceType === 'single' && (
                        <div className="space-y-6">
                          <div className="space-y-2">
                            <BrightLabel htmlFor="must-drop-startDate">Start Date & Time</BrightLabel>
                            <Input
                              id="must-drop-startDate"
                              type="datetime-local"
                              className="bg-neutral-800 border-neutral-700 max-w-[400px]"
                            />
                          </div>

                          <div className="space-y-2">
                            <BrightLabel htmlFor="must-drop-endDate">End Date & Time</BrightLabel>
                            <Input
                              id="must-drop-endDate"
                              type="datetime-local"
                              className="bg-neutral-800 border-neutral-700 max-w-[400px]"
                            />
                          </div>

                          <div className="space-y-2">
                            <BrightLabel htmlFor="max-number-wins">Maximum Number of Wins</BrightLabel>
                            <Input
                              id="max-number-wins"
                              type="number"
                              defaultValue="0"
                              className="bg-neutral-800 border-neutral-700 max-w-[400px]"
                            />
                          </div>

                          <div className="space-y-2">
                            <BrightLabel htmlFor="maximum-payout-amount">Maximum Payout Amount</BrightLabel>
                            <CurrencyInput
                              id="maximum-payout-amount"
                              type="number"
                              defaultValue="0"
                              className="bg-neutral-800 border-neutral-700 max-w-[400px]"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              </section>

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

                      {/* Community Section */}
                      <div className="pt-6 border-t border-neutral-800 space-y-6">
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
                          <div className="pt-4 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <BrightLabel htmlFor="must-drop-community-split">Community Split</BrightLabel>
                                  <span className="text-sm text-neutral-400">{communitySplit[0]}%</span>
                                </div>
                                <p className="text-xs text-red-400">This is required</p>
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
                                    <span>Winner</span>
                                    <span>Community</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-neutral-400">0%</span>
                                    <Slider
                                      id="must-drop-community-split"
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
                                      <BrightLabel htmlFor="must-drop-payout-interval-minutes">Payout Interval</BrightLabel>
                                      <Input
                                        id="must-drop-payout-interval-minutes"
                                        type="number"
                                        placeholder="Enter minutes (e.g., 60, 120, 180)"
                                        defaultValue="0"
                                        min="0"
                                        className="bg-neutral-800 border-neutral-700 max-w-[200px]"
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div></div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <BrightLabel htmlFor="must-drop-community-max-win">Maximum Win Amount</BrightLabel>
                                <CurrencyInput
                                  id="must-drop-community-max-win"
                                  type="number"
                                  placeholder="0"
                                  className="bg-neutral-800 border-neutral-700"
                                />
                              </div>
                              <div></div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <BrightLabel htmlFor="must-drop-community-max-players">Maximum Number Of Players</BrightLabel>
                                <Input
                                  id="must-drop-community-max-players"
                                  type="number"
                                  placeholder="0"
                                  className="bg-neutral-800 border-neutral-700"
                                />
                              </div>
                              <div></div>
                            </div>
                          </div>
                        )}
                      </div>

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
                </div>
              </section>

              {/* Win Logic & Model Section */}
              <section ref={modelRef} className="scroll-mt-20">
                <h2 className="text-xl font-semibold mb-6">Win Logic & Model</h2>

                <div className="grid gap-6">
                  <Card className="p-6 bg-neutral-900/50 border-neutral-800">
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <BrightLabel className="text-sm font-medium">Payout Model</BrightLabel>
                        <RadioGroup value={payoutModel} onValueChange={(v) => setPayoutModel(v as PayoutModel)}>
                          <div className="grid grid-cols-3 gap-4">
                            <label className={`relative flex flex-col p-5 rounded-lg border-2 cursor-pointer transition-all ${
                              payoutModel === 'fixed'
                                ? 'border-blue-500 bg-blue-500/10'
                                : 'border-neutral-700 bg-neutral-800/30 hover:border-neutral-600'
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
                              <span className="text-xs text-neutral-400 leading-relaxed">
                                Jackpot pays a predetermined fixed amount every time
                              </span>
                            </label>

                            <label className={`relative flex flex-col p-5 rounded-lg border-2 cursor-pointer transition-all ${
                              payoutModel === 'average'
                                ? 'border-blue-500 bg-blue-500/10'
                                : 'border-neutral-700 bg-neutral-800/30 hover:border-neutral-600'
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
                              <span className="text-xs text-neutral-400 leading-relaxed">
                                Payout varies around a target average with volatility control
                              </span>
                            </label>

                            <label className={`relative flex flex-col p-5 rounded-lg border-2 cursor-pointer transition-all ${
                              payoutModel === 'maximum'
                                ? 'border-blue-500 bg-blue-500/10'
                                : 'border-neutral-700 bg-neutral-800/30 hover:border-neutral-600'
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
                              <span className="text-xs text-neutral-400 leading-relaxed">
                                Payout varies with a defined maximum cap
                              </span>
                            </label>
                          </div>
                        </RadioGroup>
                      </div>

                      {/* Model-specific fields */}
                      {payoutModel === 'fixed' && (
                        <div className="space-y-6 pt-4">
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <BrightLabel htmlFor="frequency-fixed-amount">Fixed Win Amount</BrightLabel>
                              <CurrencyInput
                                id="frequency-fixed-amount"
                                type="number"
                                placeholder="0"
                                className="bg-neutral-800 border-neutral-700"
                              />
                              <p className="text-xs text-red-400">This field is required</p>
                            </div>
                            <div></div>
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <BrightLabel htmlFor="frequency-volatility">Volatility</BrightLabel>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-neutral-400">0</span>
                                  <Slider
                                    value={volatility}
                                    onValueChange={setVolatility}
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
                            </div>
                            <div></div>
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <BrightLabel htmlFor="frequency-min-wager-fixed">Minimum Wager Amount</BrightLabel>
                              <CurrencyInput
                                id="frequency-min-wager-fixed"
                                type="number"
                                placeholder="0"
                                className="bg-neutral-800 border-neutral-700"
                              />
                            </div>
                            <div></div>
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <BrightLabel htmlFor="frequency-max-wager-fixed">Maximum Wager Amount</BrightLabel>
                              <CurrencyInput
                                id="frequency-max-wager-fixed"
                                type="number"
                                placeholder="0"
                                className="bg-neutral-800 border-neutral-700"
                              />
                            </div>
                            <div></div>
                          </div>
                        </div>
                      )}

                      {payoutModel === 'average' && (
                        <div className="space-y-6 pt-4">
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <BrightLabel htmlFor="frequency-avg-target">Average Win Amount</BrightLabel>
                              <CurrencyInput
                                id="frequency-avg-target"
                                type="number"
                                placeholder="0"
                                className="bg-neutral-800 border-neutral-700"
                              />
                              <p className="text-xs text-red-400">This field is required</p>
                            </div>
                            <div></div>
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <BrightLabel htmlFor="frequency-min-win">Minimum Win Amount</BrightLabel>
                              <CurrencyInput
                                id="frequency-min-win"
                                type="number"
                                placeholder="0"
                                className="bg-neutral-800 border-neutral-700"
                              />
                            </div>
                            <div></div>
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <BrightLabel htmlFor="frequency-max-win">Maximum Win Amount</BrightLabel>
                              <CurrencyInput
                                id="frequency-max-win"
                                type="number"
                                placeholder="0"
                                className="bg-neutral-800 border-neutral-700"
                              />
                            </div>
                            <div></div>
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <BrightLabel htmlFor="frequency-volatility-avg">Volatility</BrightLabel>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-neutral-400">0</span>
                                  <Slider
                                    value={volatility}
                                    onValueChange={setVolatility}
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
                            </div>
                            <div></div>
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <BrightLabel htmlFor="frequency-min-wager">Minimum Wager Amount</BrightLabel>
                              <CurrencyInput
                                id="frequency-min-wager"
                                type="number"
                                placeholder="0"
                                className="bg-neutral-800 border-neutral-700"
                              />
                            </div>
                            <div></div>
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <BrightLabel htmlFor="frequency-max-wager">Maximum Wager Amount</BrightLabel>
                              <CurrencyInput
                                id="frequency-max-wager"
                                type="number"
                                placeholder="0"
                                className="bg-neutral-800 border-neutral-700"
                              />
                            </div>
                            <div></div>
                          </div>
                        </div>
                      )}

                      {payoutModel === 'maximum' && (
                        <div className="space-y-6 pt-4">
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <BrightLabel htmlFor="frequency-min-win-max">Minimum Win Amount</BrightLabel>
                              <CurrencyInput
                                id="frequency-min-win-max"
                                type="number"
                                placeholder="0"
                                className="bg-neutral-800 border-neutral-700"
                              />
                            </div>
                            <div></div>
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <BrightLabel htmlFor="frequency-max-win-max">Maximum Win Amount</BrightLabel>
                              <CurrencyInput
                                id="frequency-max-win-max"
                                type="number"
                                placeholder="0"
                                className="bg-neutral-800 border-neutral-700"
                              />
                            </div>
                            <div></div>
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <BrightLabel htmlFor="frequency-volatility-max">Volatility</BrightLabel>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-neutral-400">0</span>
                                  <Slider
                                    value={volatility}
                                    onValueChange={setVolatility}
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
                            </div>
                            <div></div>
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <BrightLabel htmlFor="frequency-min-wager-max">Minimum Wager Amount</BrightLabel>
                              <CurrencyInput
                                id="frequency-min-wager-max"
                                type="number"
                                placeholder="0"
                                className="bg-neutral-800 border-neutral-700"
                              />
                            </div>
                            <div></div>
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <BrightLabel htmlFor="frequency-max-wager-max">Maximum Wager Amount</BrightLabel>
                              <CurrencyInput
                                id="frequency-max-wager-max"
                                type="number"
                                placeholder="0"
                                className="bg-neutral-800 border-neutral-700"
                              />
                            </div>
                            <div></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              </section>

              {/* Pool Setup Section */}
              <section ref={poolSetupRef} className="scroll-mt-20">
                <h2 className="text-xl font-semibold mb-6">Pool Setup</h2>

                <div className="grid gap-6">
                  <Card className="p-6 bg-neutral-900/50 border-neutral-800">
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => setContributionType('fixed')}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            contributionType === 'fixed'
                              ? 'bg-blue-500 text-white'
                              : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
                          }`}
                        >
                          Fixed
                        </button>
                        <button
                          onClick={() => setContributionType('percentage')}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            contributionType === 'percentage'
                              ? 'bg-blue-500 text-white'
                              : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
                          }`}
                        >
                          Percentage
                        </button>
                      </div>

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
                                  defaultValue="0"
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
                                  className="bg-neutral-800 border-neutral-700"
                                />
                              </div>
                              <div></div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <BrightLabel htmlFor="frequency-pool-contribution-fixed">Fixed Pool Contribution Amount</BrightLabel>
                                <CurrencyInput
                                  id="frequency-pool-contribution-fixed"
                                  type="number"
                                  placeholder="1"
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
                <h2 className="text-xl font-semibold mb-6">Seed Setup</h2>

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

                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => setSeedContributionType('fixed')}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            seedContributionType === 'fixed'
                              ? 'bg-blue-500 text-white'
                              : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
                          }`}
                        >
                          Fixed
                        </button>
                        <button
                          onClick={() => setSeedContributionType('percentage')}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            seedContributionType === 'percentage'
                              ? 'bg-blue-500 text-white'
                              : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
                          }`}
                        >
                          Percentage
                        </button>
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
                              <BrightLabel htmlFor="frequency-min-wager-seed-percentage">Minimum Wager Amount</BrightLabel>
                              <CurrencyInput
                                id="frequency-min-wager-seed-percentage"
                                type="number"
                                placeholder="0"
                                defaultValue="0"
                                className="bg-neutral-800 border-neutral-700"
                              />
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
                          <div className="space-y-2">
                            <BrightLabel htmlFor="frequency-seed-contribution-fixed">Fixed Seed Contribution Amount</BrightLabel>
                            <div className="max-w-[400px]">
                              <CurrencyInput
                                id="frequency-seed-contribution-fixed"
                                type="number"
                                placeholder="0"
                                value={seedPercentageValue[0]}
                                onChange={(e) => setSeedPercentageValue([parseFloat(e.target.value) || 0])}
                                className="bg-neutral-800 border-neutral-700 w-full"
                              />
                            </div>
                          </div>

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
                              <BrightLabel htmlFor="frequency-min-wager-seed-fixed">Minimum Wager Amount</BrightLabel>
                              <CurrencyInput
                                id="frequency-min-wager-seed-fixed"
                                type="number"
                                placeholder="0"
                                className="bg-neutral-800 border-neutral-700"
                              />
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

              {/* Scheduling Section */}
              <section ref={schedulingRef} className="scroll-mt-20">
                <h2 className="text-xl font-semibold mb-6">Scheduling</h2>

                <div className="grid gap-6">
                  <Card className="p-6 bg-neutral-900/50 border-neutral-800">
                    <div className="space-y-6">
                      {/* Frequency Start Date */}
                      <div className="space-y-2">
                        <BrightLabel htmlFor="frequency-start-date">Frequency Start Date</BrightLabel>
                        <Input
                          id="frequency-start-date"
                          type="datetime-local"
                          className="bg-neutral-800 border-neutral-700 max-w-[700px]"
                        />
                      </div>

                      {/* Frequency End Date */}
                      <div className="space-y-2">
                        <BrightLabel htmlFor="frequency-end-date">Frequency End Date</BrightLabel>
                        <Input
                          id="frequency-end-date"
                          type="datetime-local"
                          className="bg-neutral-800 border-neutral-700 max-w-[700px]"
                        />
                      </div>

                      {/* Select a Display Frequency */}
                      <div className="space-y-3">
                        <BrightLabel className="text-sm font-medium">Select a Display Frequency:</BrightLabel>
                        <div className="flex gap-3">
                          <button
                            onClick={() => setDisplayFrequency('daily')}
                            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                              displayFrequency === 'daily'
                                ? 'bg-white text-neutral-900'
                                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200'
                            }`}
                          >
                            DAILY
                          </button>
                          <button
                            onClick={() => setDisplayFrequency('weekly')}
                            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                              displayFrequency === 'weekly'
                                ? 'bg-white text-neutral-900'
                                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200'
                            }`}
                          >
                            WEEKLY
                          </button>
                          <button
                            onClick={() => setDisplayFrequency('monthly')}
                            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                              displayFrequency === 'monthly'
                                ? 'bg-white text-neutral-900'
                                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200'
                            }`}
                          >
                            MONTHLY
                          </button>
                        </div>
                      </div>

                      {/* Weekly Frequency Day (only for weekly) */}
                      {displayFrequency === 'weekly' && (
                        <div className="space-y-2">
                          <BrightLabel htmlFor="weekly-frequency-day" className="text-red-400">WEEKLY-frequency-day</BrightLabel>
                          <Select value={weeklyFrequencyDay} onValueChange={setWeeklyFrequencyDay}>
                            <SelectTrigger id="weekly-frequency-day" className="bg-neutral-800 border-neutral-700 max-w-[700px] text-white">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent className="bg-neutral-800 border-neutral-700 text-white">
                              <SelectItem value="monday" className="text-white">Monday</SelectItem>
                              <SelectItem value="tuesday" className="text-white">Tuesday</SelectItem>
                              <SelectItem value="wednesday" className="text-white">Wednesday</SelectItem>
                              <SelectItem value="thursday" className="text-white">Thursday</SelectItem>
                              <SelectItem value="friday" className="text-white">Friday</SelectItem>
                              <SelectItem value="saturday" className="text-white">Saturday</SelectItem>
                              <SelectItem value="sunday" className="text-white">Sunday</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-red-400">this-is-required</p>
                        </div>
                      )}

                      {/* Monthly Frequency Day (only for monthly) */}
                      {displayFrequency === 'monthly' && (
                        <div className="space-y-2">
                          <BrightLabel htmlFor="monthly-frequency-day" className="text-red-400">MONTHLY-frequency-day</BrightLabel>
                          <Select value={monthlyFrequencyDay} onValueChange={setMonthlyFrequencyDay}>
                            <SelectTrigger id="monthly-frequency-day" className="bg-neutral-800 border-neutral-700 max-w-[700px] text-white">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent className="bg-neutral-800 border-neutral-700 text-white max-h-[300px]">
                              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                                <SelectItem key={day} value={day.toString()} className="text-white">
                                  {day}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-red-400">this-is-required</p>
                        </div>
                      )}

                      {/* Time of day to start */}
                      <div className="space-y-2">
                        <BrightLabel htmlFor="time-of-day-start" className="text-red-400">Time of day to start</BrightLabel>
                        <Input
                          id="time-of-day-start"
                          type="time"
                          className="bg-neutral-800 border-neutral-700 max-w-[700px]"
                        />
                        <p className="text-xs text-red-400">this-is-required</p>
                      </div>

                      {/* Time of day to end */}
                      <div className="space-y-2">
                        <BrightLabel htmlFor="time-of-day-end" className="text-red-400">Time of day to end</BrightLabel>
                        <Input
                          id="time-of-day-end"
                          type="time"
                          className="bg-neutral-800 border-neutral-700 max-w-[700px]"
                        />
                        <p className="text-xs text-red-400">this-is-required</p>
                      </div>

                      {/* Do you want to configure a separate contribution frequency? */}
                      <div className="space-y-3 pt-4">
                        <BrightLabel className="text-sm font-medium">Do you want to configure a separate contribution frequency?</BrightLabel>
                        <div className="flex gap-3">
                          <button
                            onClick={() => setSeparateContributionFrequency(false)}
                            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                              !separateContributionFrequency
                                ? 'bg-white text-neutral-900'
                                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200'
                            }`}
                          >
                            No
                          </button>
                          <button
                            onClick={() => setSeparateContributionFrequency(true)}
                            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                              separateContributionFrequency
                                ? 'bg-white text-neutral-900'
                                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200'
                            }`}
                          >
                            Yes
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </section>
            </>
          )}
        </div>

        {/* ── Engine Configuration: Multi-Level tiers + Timed lifespan ─────────── */}
        {(selectedType === 'multi_level' || selectedType === 'must_drop' || selectedType === 'frequency') && (
          <section className="mt-10 scroll-mt-20">
            <h2 className="text-xl font-semibold mb-2">Engine Configuration</h2>
            <p className="text-sm text-neutral-400 mb-6">
              These fields drive the simulator engine directly for{' '}
              {selectedType === 'multi_level' ? 'Multi-Level tier cascading' : 'time-decayed (Must-Drop / Frequency) hit logic'}.
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
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {(selectedType === 'must_drop' || selectedType === 'frequency') && (
              <Card className="p-6 bg-neutral-900/50 border-neutral-800">
                <BrightLabel className="text-base">Virtual Lifespan</BrightLabel>
                <p className="text-xs text-neutral-400 mt-1 mb-4">
                  Total simulated minutes mapped across iterations. Drives the time-decay hit chance:{' '}
                  <code className="text-neutral-300">pow(% into game, volatility × 5) × contribution + maximumHitChance</code>.
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {[
                    { label: 'Hourly', minutes: 60 },
                    { label: 'Daily', minutes: 1440 },
                    { label: 'Weekly', minutes: 10080 },
                    { label: 'Monthly', minutes: 43200 },
                  ].map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setLifespanMinutes(p.minutes)}
                      className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                        lifespanMinutes === p.minutes ? 'bg-blue-500 text-white' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                      }`}
                    >
                      {p.label} ({p.minutes.toLocaleString()}m)
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-6 max-w-xl">
                  <div className="space-y-2">
                    <BrightLabel htmlFor="lifespan-minutes">Lifespan (minutes)</BrightLabel>
                    <Input id="lifespan-minutes" type="number" min={1} value={lifespanMinutes} onChange={(e) => setLifespanMinutes(Math.max(1, parseInt(e.target.value) || 1))} className="bg-neutral-800 border-neutral-700" />
                  </div>
                  {selectedType === 'must_drop' && (
                    <div className="space-y-2">
                      <BrightLabel>Must-Drop Period</BrightLabel>
                      <Select value={String(mustDropPeriod)} onValueChange={(v) => setMustDropPeriod(Number(v) as 1 | 2 | 3 | 4)}>
                        <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-neutral-800 border-neutral-700 text-white">
                          <SelectItem value="1" className="text-white">Single</SelectItem>
                          <SelectItem value="2" className="text-white">Daily</SelectItem>
                          <SelectItem value="3" className="text-white">Weekly</SelectItem>
                          <SelectItem value="4" className="text-white">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </Card>
            )}
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