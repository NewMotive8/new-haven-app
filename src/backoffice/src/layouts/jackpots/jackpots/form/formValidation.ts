import { textTranslated } from 'components/TextTranslated'
import { jackpotsI } from 'utils/services/api/requests/jackpots'
import { JackpotI } from 'utils/services/api/requests/jackpots/types'
import { seedsI } from 'utils/services/api/requests/seeds'
import { poolsI } from 'utils/services/api/requests/pools'
import { TabsKeysT, tabValidationStatus } from './types'

const errorMessages = () => ({
  required: textTranslated({
    group: 'validate-messages',
    key: 'this-is-required',
  }),
  type: {},
  basic: {},
  model: {
    minTarget2: textTranslated({
      group: 'validate-messages',
      key: 'this-has-a-min-target-of-2',
    }),
  },
})
interface errorTabStatus {
  key: TabsKeysT
  status: tabValidationStatus
}
export interface errorI {
  tabsStatus: errorTabStatus[]
  count: number
  [key: string]: any
}

export function validateTypeTab(data: jackpotsI): errorI {
  const errors: errorI = {
    tabsStatus: [{ key: 'type', status: 'valid' }],
    count: 0,
  }

  if (!data.type) {
    errors.type = errorMessages().required
    errors.count += 1
    errors.tabsStatus = [{ key: 'type', status: 'invalid' }]
  }

  return errors
}

export function validateBasicTab(data: jackpotsI): errorI {
  const errors: errorI = {
    tabsStatus: [{ key: 'basic', status: 'valid' }],
    count: 0,
  }
  function addError(field: keyof jackpotsI, message: string) {
    if (!errors[field]) {
      errors[field] = message
      errors.count += 1
      errors.tabsStatus = [{ key: 'basic', status: 'invalid' }]
    }
  }

  if (!data.internalName) {
    addError('internalName', errorMessages().required)
  }
  if (!data.internalDescription) {
    addError('internalDescription', errorMessages().required)
  }

  return errors
}
export function validateCommunityTab(data: JackpotI): errorI {
  const errors: errorI = {
    count: 0,
    tabsStatus: [{ key: 'community', status: 'valid' }],
  }
  if (!data.hasCommunity) {
    return errors
  }

  function addError(field: string, message: string) {
    if (!errors[field]) {
      errors[field] = message
      errors.count += 1
      errors.tabsStatus = [{ key: 'community', status: 'invalid' }]
    }
  }
  if (!data?.community?.split) {
    addError('split', errorMessages().required)
  }
  if (
    data?.community?.payoutInterval < 0
    || data?.community?.payoutInterval > 9999
  ) {
    addError('payoutInterval', errorMessages().required)
  }
  return errors
}
export function validateEventsTab(data: JackpotI): errorI {
  const errors: errorI = {
    count: 0,
    tabsStatus: [{ key: 'events', status: 'valid' }],
  }
  return errors
}
export function validateModelTab(data: JackpotI): errorI {
  const errors: errorI = {
    count: 0,
    tabsStatus: [{ key: 'model', status: 'valid' }],
  }
  function addError(field: keyof jackpotsI, message: string) {
    if (!errors[field]) {
      errors[field] = message
      errors.count += 1
      errors.tabsStatus = [{ key: 'model', status: 'invalid' }]
    }
  }
  if (data.model === 1 && (!data.fixedWinAmount || data.fixedWinAmount <= 0)) {
    addError('fixedWinAmount', errorMessages().required)
  }
  if (data.model === 1 && (!data.fixedWinAmount || data.fixedWinAmount < 2)) {
    addError('fixedWinAmount', errorMessages().model.minTarget2)
  }
  if (
    data.type !== 'MULTI_LEVEL'
    && data.model === 2
    && (!data.averageWinAmount || data.averageWinAmount <= 0)
  ) {
    addError('averageWinAmount', errorMessages().required)
  }
  if (
    data.type !== 'MULTI_LEVEL'
    && data.model === 2
    && (!data.averageWinAmount || data.averageWinAmount < 2)
  ) {
    addError('averageWinAmount', errorMessages().model.minTarget2)
  }
  if (
    data.type !== 'MULTI_LEVEL'
    && data.model === 3
    && (!data.maximumWinAmount || data.maximumWinAmount <= 0)
  ) {
    addError('maximumWinAmount', errorMessages().required)
  }
  if (
    data.type !== 'MULTI_LEVEL'
    && data.model === 3
    && (!data.maximumWinAmount || data.maximumWinAmount < 2)
  ) {
    addError('maximumWinAmount', errorMessages().model.minTarget2)
  }

  return errors
}
export function validatePoolTab(data: JackpotI): errorI {
  const errors: errorI = {
    count: 0,
    tabsStatus: [{ key: 'pool', status: 'valid' }],
  }
  function addError(field: keyof poolsI, message: string) {
    if (!errors[field]) {
      errors[field] = message
      errors.count += 1
      errors.tabsStatus = [{ key: 'pool', status: 'invalid' }]
    }
  }
  const statusContributionAmount = data?.pools?.some((pool) => pool?.contributionAmount > 0)
  if (!statusContributionAmount) {
    addError('contributionAmount', errorMessages().required)
  }
  const statusContributionType = data?.pools?.some((pool) => pool?.contributionType > 0)
  if (!statusContributionType) {
    addError('contributionType', errorMessages().required)
  }
  return errors
}
export function validateSeedTab(data: JackpotI): errorI {
  const errors: errorI = {
    count: 0,
    tabsStatus: [{ key: 'seed', status: 'valid' }],
  }
  const statusMinimumAmount = data?.pools?.some((pool) => parseFloat(`${pool?.minimumAmount}`))
  if (!statusMinimumAmount) {
    // no seed required
    return errors
  }

  function addError(field: keyof seedsI, message: string) {
    if (!errors[field]) {
      errors[field] = message
      errors.count += 1
      errors.tabsStatus = [{ key: 'seed', status: 'invalid' }]
    }
  }
  const statusContributionAmount = data.seeds.some((seed) => parseFloat(`${seed?.contributionAmount}`))

  if (!statusContributionAmount) {
    addError('contributionAmount', errorMessages().required)
  }

  data?.seeds?.forEach((element) => {
    if (!element?.contributionAmount) {
      addError('contributionAmount', errorMessages().required)
    }
    if (!element?.type) {
      addError('type', errorMessages().required)
    }
  })
  return errors
}

export function validateScheduleTab(data: JackpotI): errorI {
  const errors: errorI = {
    count: 0,
    tabsStatus: [{ key: 'schedule', status: 'valid' }],
  }
  function addError(field: keyof jackpotsI, message: string) {
    if (!errors[field]) {
      errors[field] = message
      errors.count += 1
      errors.tabsStatus = [{ key: 'schedule', status: 'invalid' }]
    }
  }
  if (data.type === 'MUST_DROP') {
    if (data?.mustDropPeriod === 1) {
      if (!data?.endDate) {
        addError('endDate' as any, errorMessages().required)
      }
      if (!data?.startDate) {
        addError('startDate' as any, errorMessages().required)
      }
      return errors
    }
  }
  if (data.type !== 'FREQUENCY') {
    return errors
  }

  if (!data.winFrequency?.frequency) {
    addError('winFrequency-frequency' as any, errorMessages().required)
  }
  if (
    ['WEEKLY', 'MONTHLY'].includes(data?.winFrequency?.frequency || '')
    && !data.winFrequency?.day
  ) {
    addError('winFrequency-day' as any, errorMessages().required)
  }
  if (!data.winFrequency?.startTimeOfDay) {
    addError('winFrequency-startTimeOfDay' as any, errorMessages().required)
  }
  if (!data.winFrequency?.endTimeOfDay) {
    addError('winFrequency-endTimeOfDay' as any, errorMessages().required)
  }

  if (!data.contributionFrequency?.frequency) {
    addError('contributionFrequency-frequency' as any, errorMessages().required)
  }
  if (
    ['WEEKLY', 'MONTHLY'].includes(
      data?.contributionFrequency?.frequency || '',
    )
    && !data.contributionFrequency?.day
  ) {
    addError('contributionFrequency-day' as any, errorMessages().required)
  }
  if (!data.contributionFrequency?.startTimeOfDay) {
    addError(
      'contributionFrequency-startTimeOfDay' as any,
      errorMessages().required,
    )
  }
  if (!data.contributionFrequency?.endTimeOfDay) {
    addError(
      'contributionFrequency-endTimeOfDay' as any,
      errorMessages().required,
    )
  }
  return errors
}
export function validateSegmentsTab(data: JackpotI): errorI {
  const errors: errorI = {
    count: 0,
    tabsStatus: [{ key: 'segments', status: 'valid' }],
  }
  return errors
}
export function validateRecurrenceTab(data: JackpotI): errorI {
  const errors: errorI = {
    count: 0,
    tabsStatus: [{ key: 'recurrence', status: 'valid' }],
  }
  if (data.type !== 'MUST_DROP') {
    return errors
  }
  function addError(field: keyof jackpotsI, message: string) {
    if (!errors[field]) {
      errors[field] = message
      errors.count += 1
      errors.tabsStatus = [{ key: 'recurrence', status: 'invalid' }]
    }
  }
  if (!data?.mustDropPeriod) {
    addError('mustDropPeriod' as any, errorMessages().required)
  }
  return errors
}
export function validateSimulatorTab(data: JackpotI): errorI {
  const errors: errorI = {
    count: 0,
    tabsStatus: [{ key: 'simulator', status: 'valid' }],
  }
  return errors
}
export function validateSummaryTab(data: JackpotI): errorI {
  const errors: errorI = {
    count: 0,
    tabsStatus: [{ key: 'summary', status: 'valid' }],
  }
  return errors
}
export function validateWidgetTab(data: JackpotI): errorI {
  const errors: errorI = {
    count: 0,
    tabsStatus: [{ key: 'widget', status: 'valid' }],
  }
  return errors
}

function validateForm(data: jackpotsI): errorI {
  let errors: errorI = {
    tabsStatus: [{ key: 'basic', status: 'valid' }],
    count: 0,
  }

  function mergeErrors(newErrors: errorI) {
    const updatedTabsStatus = [...errors.tabsStatus]

    newErrors.tabsStatus.forEach((newTabStatus) => {
      const existingTabIndex = updatedTabsStatus.findIndex(
        (tab) => tab.key === newTabStatus.key,
      )

      if (existingTabIndex !== -1) {
        if (newTabStatus.status === 'invalid') {
          updatedTabsStatus[existingTabIndex].status = 'invalid'
        }
      } else {
        updatedTabsStatus.push(newTabStatus)
      }
    })

    errors = {
      ...errors,
      ...newErrors,
      tabsStatus: updatedTabsStatus,
      count: errors.count + newErrors.count,
    }
  }

  const typeErrors = validateTypeTab(data)
  mergeErrors(typeErrors)

  const basicErrors = validateBasicTab(data)
  mergeErrors(basicErrors)

  const communityErrors = validateCommunityTab(data)
  mergeErrors(communityErrors)

  const eventsErrors = validateEventsTab(data)
  mergeErrors(eventsErrors)

  const modelErrors = validateModelTab(data)
  mergeErrors(modelErrors)

  const poolErrors = validatePoolTab(data)
  mergeErrors(poolErrors)

  const seedErrors = validateSeedTab(data)
  mergeErrors(seedErrors)

  const recurrenceErrors = validateRecurrenceTab(data)
  mergeErrors(recurrenceErrors)

  const scheduleErrors = validateScheduleTab(data)
  mergeErrors(scheduleErrors)

  const segmentsErrors = validateSegmentsTab(data)
  mergeErrors(segmentsErrors)

  const simulatorErrors = validateSimulatorTab(data)
  mergeErrors(simulatorErrors)

  const summaryErrors = validateSummaryTab(data)
  mergeErrors(summaryErrors)

  const widgetErrors = validateWidgetTab(data)
  mergeErrors(widgetErrors)

  return {
    ...errors,
  }
}

export default validateForm

export const mapTabValidation: {
  [key in TabsKeysT]: (data: jackpotsI) => errorI
} = {
  type: validateTypeTab,
  basic: validateBasicTab,
  community: validateCommunityTab,
  events: validateEventsTab,
  model: validateModelTab,
  pool: validatePoolTab,
  recurrence: validateRecurrenceTab,
  schedule: validateScheduleTab,
  seed: validateSeedTab,
  segments: validateSegmentsTab,
  simulator: validateSimulatorTab,
  summary: validateSummaryTab,
  widget: validateWidgetTab,
}
