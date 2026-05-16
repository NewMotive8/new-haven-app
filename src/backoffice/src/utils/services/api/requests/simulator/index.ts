import { api } from '../..'
import urls from '../../urls'
import { JackpotI } from '../jackpots/types'

export interface SimulatorData {
  wagerAmount: number
  iterations: number
  averageWinAmount: number
  fixedWinAmount: number
  minimumWagerAmount: number
  maximumWagerAmount: number
  minimumWinAmount: number
  maximumWinAmount: number
  jackpotType: 'CLASSIC' | 'MUST_DROP' | 'MULTI_LEVEL'
  volatility: number
  maximumWins: number
  poolContributionType: string | number
  contributionAmount: number
  seedContributionAmount: number
  seedTargetAmount: number
  startingPoolAmount: number
  minimumAmount: number
  maximumAmount: number
  startingSeedAmount: number
  seedContributionType: string | number
  poolPlayerContributionPercent: number
  seedPlayerContributionPercent: number
  model: number
  durationInMinutes?: number
  intervalInMinutes?: number
  mustDropPeriod?: 1 | 2 | 3 | 4
  startDate?: string
  endDate?: string
  maximumPayoutAmount?: number
}
export interface OperatorReq {
  applicationKey: string
  enabled: boolean
  id: number | undefined
  idempotentTransactions: boolean
  logo: string
  name: string
  operatorId: string
  plan: PlanReq
  secret: string
  tier: Tier
  returnAmountResponse: boolean;
}

export interface PlanReq {
  currentEvents: number
  id: number | undefined
  level: number
  maximumEvents: number
  name: string
  resetTime: string
}

export interface Tier {
  enabled: boolean
  id: number | undefined
  level: number
  maximumEvents: number
  name: string
}

export interface BrandReq {
  brandId: string
  colour: string
  currency: string
  defaultLocale: string
  enabled: boolean
  hasWithdrawApproval: boolean
  hasWorkflow: boolean
  id: number | undefined
  logo: string
  maximumPayoutSafeguard: number
  name: string
  numberOfWinsSafeguard: number
  operator: OperatorReq
  operatorOnly: boolean
  pushDelay: number
}
export interface CommunityReq {
  id: number | undefined
  jackpot: any
  maximumNumberOfPlayers: number
  maximumWinAmount: number
  payoutInterval: number
  split: number
}
export interface WidgetReq {
  brand: BrandReq | null
  customAnimationCss: string | null
  customAnimationLottie: string | null
  description: string | null
  headerLabel: string | null
  id: number | undefined | null
  optInLabel: string | null
  optInType: string | null
  optOutLabel: string | null
  tcsIsLink: boolean | null
  termsAndConditions: string | null
  widgetAnimation: number | null
  widgetCustomCss: string | null
  widgetDesign: number | null
  widgetMediaType: string | null
  widgetMediaUrl: string | null
}
export interface SimulatorJackpot {
  averageWinAmount: number
  brand: BrandReq
  community: CommunityReq | null
  contributionEndTime: string
  contributionFrequency: string
  contributionStartTime: string
  currency: string
  enabled: boolean
  endDate: string | null
  events: any[]
  externalId: string
  fixedWinAmount: number
  global: boolean
  hasCommunity: boolean | null
  hasInformWins: boolean | null
  id: number | undefined
  internalDescription: string
  internalName: string
  maximumPayoutAmount: number
  maximumWagerAmount: number
  maximumWinAmount: number | null
  maximumWins: number
  minimumWagerAmount: number
  minimumWinAmount: number
  mustDropPeriod: number | null
  model: number
  optInType: number
  pools: any[]
  pushDelay: number
  seeds: any[]
  segments: any[]
  startDate: string | null
  states: any[]
  template: boolean
  templateFrom: number | null
  timedEnd: string | null
  timedStart: string | null
  type: 'CLASSIC' | 'FREQUENCY' | 'MUST_DROP' | 'MULTI_LEVEL'
  volatility: number
  widget: WidgetReq
  winEndTime: string | null
  winFrequency: any
  winStartTime: string | null
}

export interface SimulatorDataProps {
  data: {
    wagerAmount: number
    iterations: number
    averageWinAmount: number
    fixedWinAmount: number
    minimumWagerAmount: number
    maximumWagerAmount: number
    minimumWinAmount: number
    maximumWinAmount: number
    jackpotType: 'CLASSIC' | 'MUST_DROP'
    volatility: number
    maximumWins: number
    poolContributionType: string | number
    contributionAmount: number
    seedContributionAmount: number
    seedTargetAmount: number
    startingPoolAmount: number
    minimumAmount: number
    maximumAmount: number
    startingSeedAmount: number
    seedContributionType: string | number
    poolPlayerContributionPercent: number
    seedPlayerContributionPercent: number
    model: number
    durationInMinutes?: number
    intervalInMinutes?: number
    mustDropPeriod?: 1 | 2 | 3 | 4
    startDate?: string
    endDate?: string
  }
  query: {
    iterations: number
    wager: number
  }
}
export interface SimulateBet {
  data: JackpotI
  query: {
    iterations: number
    wager: number
  }
}
export interface WinEvents {
  winningAmount: number
  currentPoolAmount: number
  currentSeedAmount: number
  winningIteration: number
  winningTier: number
}

export interface SimulatorResponse {
  iterations: number
  winCounter: number
  winAmountCounter: number
  contributionCounter: number
  poolContribution: number
  maxWin: number
  finalPoolAmount: number
  rtp: number
  winEvents: WinEvents[]
  averageWinAmount: number
  targetAmount: number
}
export async function buildJackpotSimulation(props: SimulatorData) {
  return api.post(urls.simulator.simulate, props)
}
export async function buildJackpotSimulationBet(props: SimulateBet) {
  return api.post(
    `${urls.simulator.bet}?wager=${props.query.wager}&iterations=${props.query.iterations}`,
    props.data,
  )
}

export function defineContributionType(v: any, key: any) {
  const { playerContributionPercent } = v

  if (
    parseInt(v[key], 10) === 1
    && parseInt(playerContributionPercent, 10) === 100
  ) {
    return 1
  }
  if (
    parseInt(v[key], 10) === 2
    && parseInt(playerContributionPercent, 10) === 100
  ) {
    return 2
  }
  if (
    parseInt(v[key], 10) === 1
    && parseInt(playerContributionPercent, 10) < 100
  ) {
    return 3
  }
  if (
    parseInt(v[key], 10) === 2
    && parseInt(playerContributionPercent, 10) < 100
  ) {
    return 4
  }
  return null
}

export const initialSimulatorData: SimulatorData = {
  wagerAmount: 10,
  iterations: 1000000,
  averageWinAmount: 0,
  fixedWinAmount: 0,
  minimumWagerAmount: 0,
  maximumWagerAmount: 0,
  minimumWinAmount: 0,
  maximumWinAmount: 0,
  jackpotType: 'CLASSIC',
  volatility: 5,
  maximumWins: 0,
  poolContributionType: 1,
  contributionAmount: 0,
  seedContributionAmount: 0,
  seedTargetAmount: 0,
  startingPoolAmount: 0,
  minimumAmount: 0,
  maximumAmount: 0,
  startingSeedAmount: 0,
  seedContributionType: 1,
  poolPlayerContributionPercent: 100,
  seedPlayerContributionPercent: 100,
  model: 1,
  durationInMinutes: 0,
  intervalInMinutes: 0,
}
export const defaultSimulator: SimulatorJackpot = {
  id: 0,
  externalId: '',
  internalName: '',
  internalDescription: '',
  currency: '',
  startDate: null,
  endDate: null,
  maximumWins: 0,
  model: 1,
  type: 'CLASSIC',
  winStartTime: null,
  winEndTime: null,
  winFrequency: {
    frequency: '',
    day: 0,
    startTimeOfDay: '',
    endTimeOfDay: '',
  },
  contributionStartTime: '',
  contributionEndTime: '',
  contributionFrequency: '',
  averageWinAmount: 0,
  fixedWinAmount: 0,
  minimumWinAmount: 0,
  maximumWinAmount: null,
  volatility: 5,
  minimumWagerAmount: 0,
  maximumWagerAmount: 0,
  mustDropPeriod: null,
  optInType: 1,
  global: false,
  enabled: true,
  timedStart: null,
  timedEnd: null,
  template: false,
  templateFrom: null,
  hasCommunity: null,
  hasInformWins: null,
  pushDelay: 0,
  events: [],
  pools: [],
  seeds: [],
  widget: {
    id: null,
    description: null,
    termsAndConditions: null,
    tcsIsLink: null,
    customAnimationCss: null,
    headerLabel: null,
    optInLabel: null,
    optOutLabel: null,
    optInType: '',
    widgetDesign: 0,
    widgetAnimation: 0,
    widgetMediaType: null,
    widgetMediaUrl: null,
    customAnimationLottie: null,
    widgetCustomCss: null,
    brand: null,
  },
  community: null,
  segments: [],
  states: [],
  maximumPayoutAmount: 0,
  brand: {
    brandId: '',
    colour: '',
    currency: '',
    defaultLocale: '',
    enabled: false,
    hasWithdrawApproval: false,
    hasWorkflow: false,
    id: 0,
    logo: '',
    maximumPayoutSafeguard: 0,
    name: '',
    numberOfWinsSafeguard: 0,
    operator: {
      applicationKey: '',
      enabled: false,
      id: 0,
      idempotentTransactions: false,
      logo: '',
      name: '',
      operatorId: '',
      plan: {
        currentEvents: 0,
        id: 0,
        level: 0,
        maximumEvents: 0,
        name: '',
        resetTime: '',
      },
      secret: '',
      tier: {
        enabled: false,
        id: 0,
        level: 0,
        maximumEvents: 0,
        name: '',
      },
      returnAmountResponse: false,
    },
    operatorOnly: false,
    pushDelay: 0,
  },
}