import { poolsI } from '../pools'
import { seedsI } from '../seeds'

interface Brand {
  id: number | null
  name: string
  logo: string
  colour: string
  brandId: string
  enabled: boolean
  hasWorkflow: boolean
  hasWithdrawApproval: boolean
  hasManualWins: boolean
  hasOperatorContributionOnly: boolean | null
  defaultLocale: string
  pushDelay: number
  salt: string | null
  currency: string
  operator: Operator
  plan: Plan
  tier: Tier
}

interface Operator {
  id: number | null
  operatorId?: string
  name: string
  enabled: boolean
  secret: string
  logo: string
  applicationKey: string
  idempotentTransactions: boolean
  returnAmountResponse: boolean;
}

interface Plan {
  id: number | null
  level: number
  name: string
  maximumEvents: number
  currentEvents: number
  resetTime: string
  allowed?: boolean
}

interface Tier {
  id: number | null
  name: string
  level: number
  maximumEvents: number
  enabled: boolean
}

interface State {
  id: number | null
  currentState: string | number
  currentStatus: string | number
  approvedBy: string | null
  approvedDate: string | null
  pendingDate: string
  rejectedBy: string | null
  rejectedDate: string | null
  requestorId: number
  isActive: boolean
}

export interface Widget {
  id: number | null
  description: string | null
  termsAndConditions: string | null
  tcsIsLink: boolean | null
  headerLabel: string | null
  optInLabel: string | null
  optOutLabel: string | null
  optInType: string
  widgetDesign: number
  widgetAnimation: number
  widgetMediaType: string | null
  widgetMediaUrl: string | null
  customAnimationLottie: string | null
  customAnimationCss: string | null
  widgetCustomCss: string | null
  brand: Brand | null
}
export interface WinFrequency {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | ''
  day: string | number
  startTimeOfDay: string
  endTimeOfDay: string
}
export interface ContributionFrequency {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | ''
  day: string | number
  startTimeOfDay: string
  endTimeOfDay: string
}
export interface TournamentI {
  id: number
  model: number // this is FE only to control the models tab
  mustScheduleDropType?: 'single' | 'many' // this is FE only to control the schedule tab
  externalId: string
  internalName: string
  internalDescription: string
  currency: string
  startDate: string | null
  endDate: string | null
  maximumWins: number
  type: 'CLASSIC' | 'FREQUENCY' | 'MUST_DROP' | 'MULTI_LEVEL' | ''
  winStartTime: string | null
  winEndTime: string | null
  winFrequency?: WinFrequency
  contributionStartTime: string | null
  contributionEndTime: string | null
  contributionFrequency?: ContributionFrequency
  averageWinAmount: number
  fixedWinAmount: number
  minimumWinAmount: number | null
  maximumWinAmount: number | null
  volatility: number | null
  minimumWagerAmount: number | null
  maximumWagerAmount: number | null
  mustDropPeriod: number | null
  optInType: number | null
  global: boolean
  enabled: boolean
  timedStart: string | null
  timedEnd: string | null
  template: boolean
  templateFrom: string | null
  hasCommunity: boolean | null
  hasInformWins: boolean | null
  pushDelay: number | null
  events: any[]
  pools: poolsI[]
  seeds: seedsI[]
  brand?: Brand | null
  widget: Widget
  community: any | null
  segments: any[]
  states: State[]
  firstPool?: poolsI | null
  firstSeed?: seedsI | null
}

export const defaultTournament: TournamentI = {
  id: 0,
  model: 0,
  externalId: '',
  internalName: '',
  internalDescription: '',
  currency: '',
  startDate: null,
  endDate: null,
  maximumWins: 0,
  type: '',
  winStartTime: null,
  winEndTime: null,
  winFrequency: {
    frequency: '',
    day: 0,
    startTimeOfDay: '',
    endTimeOfDay: '',
  },
  contributionStartTime: null,
  contributionEndTime: null,
  contributionFrequency: {
    frequency: '',
    day: 0,
    startTimeOfDay: '',
    endTimeOfDay: '',
  },
  averageWinAmount: 0.0,
  fixedWinAmount: 0.0,
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
    headerLabel: null,
    optInLabel: null,
    optOutLabel: null,
    optInType: '',
    widgetDesign: 0,
    widgetAnimation: 0,
    widgetMediaType: null,
    widgetMediaUrl: null,
    customAnimationLottie: null,
    customAnimationCss: null,
    widgetCustomCss: null,
    brand: null,
  },
  community: null,
  segments: [],
  states: [],
  firstPool: null,
  firstSeed: null,
}