import { textTranslated } from 'components/TextTranslated'
import { TabSelectorTabI } from 'components/selectors/tabSelector'
import React from 'react'
import { errorI } from './formValidation'

export type TabsKeysT = 'type'
    | 'basic'
    | 'model'
    | 'pool'
    | 'seed'
    | 'recurrence'
    | 'schedule'
    | 'widget'
    | 'events'
    | 'segments'
    | 'community'
    | 'simulator'
    | 'summary'

export type tabValidationStatus = 'not-filled' | 'valid' | 'invalid'
export interface tabValidationI {
    status: tabValidationStatus,
    dependencies: TabsKeysT[] | Function,
    hidden?: boolean,
    order: number,
}

export interface createTabConfigI {
    key: TabsKeysT,
    content: React.ReactNode,
    formTabsValidation: FormTabValidation
}

export type FormTabValidation = { [key in TabsKeysT]: tabValidationI }
export interface FormContextI {
    updateField: (fieldName: string, value: any) => void
    currentTab: TabSelectorTabI,
    tabs: TabSelectorTabI[],
    setCurrentTab: (tab: TabSelectorTabI) => void
    setCurrentInfo: (info: React.ReactNode) => void,
    errors: { [key: string]: any },
    setErrors: React.Dispatch<React.SetStateAction<errorI>>,
    formTabsValidation: FormTabValidation,
    setFormTabsValidation: (item: FormTabValidation) => void,
    validateTab: (tab: TabsKeysT) => void,
    goNextTab: () => void,
    goPreviousTab: () => void,
    goNextTabCustom?: Function | null,
    setGoNextTabCustom?: Function | null,
    goPreviousTabCustom?: Function | null,
    setGoPreviousTabCustom?: Function | null,
}

export const tabsHelper: { [key in any]: () => React.ReactNode } = {
    type: () => textTranslated({ group: 'forms-tabs-helpers', key: 'jackpot-type-tab-help', returnDefault: 'nothing' }),
    basic: () => textTranslated({ group: 'forms-tabs-helpers', key: 'jackpots-basic-tab-help', returnDefault: 'nothing' }),
    model: () => textTranslated({ group: 'forms-tabs-helpers', key: 'jackpots-model-tab-help', returnDefault: 'nothing' }),
    pool: () => textTranslated({ group: 'forms-tabs-helpers', key: 'jackpots-pool-tab-help', returnDefault: 'nothing' }),
    seed: () => textTranslated({ group: 'forms-tabs-helpers', key: 'jackpots-seed-tab-help', returnDefault: 'nothing' }),
    schedule: () => textTranslated({ group: 'forms-tabs-helpers', key: 'jackpots-schedule-tab-help', returnDefault: 'nothing' }),
    recurrence: () => textTranslated({ group: 'forms-tabs-helpers', key: 'jackpots-recurrence-tab-help', returnDefault: 'nothing' }),
    widget: () => textTranslated({ group: 'forms-tabs-helpers', key: 'jackpots-widget-tab-help', returnDefault: 'nothing' }),
    events: () => textTranslated({ group: 'forms-tabs-helpers', key: 'jackpots-events-tab-help', returnDefault: 'nothing' }),
    segments: () => textTranslated({ group: 'forms-tabs-helpers', key: 'jackpots-segments-tab-help', returnDefault: 'nothing' }),
    community: () => textTranslated({ group: 'forms-tabs-helpers', key: 'jackpots-community-tab-help', returnDefault: 'nothing' }),
    simulator: () => textTranslated({ group: 'forms-tabs-helpers', key: 'jackpots-simulator-tab-help', returnDefault: 'nothing' }),
    summary: () => textTranslated({ group: 'forms-tabs-helpers', key: 'jackpots-summary-tab-help', returnDefault: 'nothing' }),
}
