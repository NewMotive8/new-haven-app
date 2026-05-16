import { JackpotI } from 'utils/services/api/requests/jackpots/types'
import { TabSelectorTabI } from 'components/selectors/tabSelector'
import Grid from 'components/uiKit/grid'
import { BsCheckSquare, BsExclamationSquare, BsSquare } from 'react-icons/bs'
import Typography from 'components/uiKit/typography'
import { errorI } from './formValidation'
import {
    FormTabValidation, TabsKeysT, createTabConfigI, tabValidationStatus,
} from './types'

interface setupTabsValidationI {
    selectedItem: JackpotI | any,
    errors: errorI,
    current?: FormTabValidation,
}

export function setupTabsValidation({ selectedItem, errors, current }: setupTabsValidationI): FormTabValidation {
    function returnErrorStatus(key: TabsKeysT): tabValidationStatus {
        return errors?.tabsStatus?.find((item) => item.key === key)?.status || current?.[key].status || 'not-filled'
    }

    return (
        {
            type: {
                status: returnErrorStatus('type'),
                dependencies: current?.type?.dependencies || [],
                order: 0,
                hidden: selectedItem.id,
            },
            basic: {
                status: returnErrorStatus('basic'),
                dependencies: current?.basic?.dependencies || ['type'],
                order: 1,
            },
            model: {
                status: returnErrorStatus('model'),
                dependencies: current?.model?.dependencies || ['basic'],
                order: 2,
            },
            pool: {
                status: returnErrorStatus('pool'),
                dependencies: current?.pool?.dependencies || ['model'],
                order: 3,
            },
            seed: {
                status: returnErrorStatus('seed'),
                dependencies: current?.seed?.dependencies || ['pool'],
                order: 4,
            },
            recurrence: {
                status: returnErrorStatus('recurrence'),
                dependencies: current?.recurrence?.dependencies || ['seed'],
                hidden: selectedItem.type !== 'MUST_DROP',
                order: 5,
            },
            schedule: {
                status: returnErrorStatus('schedule'),
                dependencies: selectedItem.type !== 'MUST_DROP' ? current?.schedule?.dependencies || ['seed'] : current?.schedule?.dependencies || ['seed', 'recurrence'],
                order: 6,
            },
            widget: {
                status: returnErrorStatus('widget'),
                dependencies: current?.widget?.dependencies || ['schedule'],
                order: 7,
            },
            events: {
                status: returnErrorStatus('events'),
                dependencies: () => !!selectedItem?.id,
                hidden: !selectedItem.id,
                order: 8,
            },
            segments: {
                status: returnErrorStatus('segments'),
                dependencies: () => !!selectedItem?.id,
                hidden: !selectedItem.id,
                order: 9,
            },
            community: {
                status: returnErrorStatus('community'),
                dependencies: () => !!selectedItem?.id,
                hidden: !selectedItem.id,
                order: 10,
            },
            simulator: {
                status: returnErrorStatus('simulator'),
                dependencies: current?.simulator?.dependencies || ['type', 'basic', 'model', 'pool', 'schedule', 'widget'],
                order: 11,

            },
            summary: {
                status: returnErrorStatus('summary'),
                dependencies: current?.summary?.dependencies || ['type', 'basic', 'model', 'pool', 'schedule', 'widget'],
                order: 12,
                hidden: selectedItem.id,
            },
        }
    )
}
export function isTabEnabledE(tabKey: TabsKeysT, formTabsValidation: FormTabValidation) {
    const tab = formTabsValidation[tabKey]
    if (typeof tab.dependencies === 'function') {
        return tab.dependencies()
    }
    return tab.dependencies.every((dependencyKey) => formTabsValidation[dependencyKey].status === 'valid')
}
export function goPreviousTabE({
    currentTab,
    formTabsValidation,
    formTabs,
    setCurrentTab,
}: {
    currentTab: TabSelectorTabI,
    formTabsValidation: FormTabValidation,
    formTabs: Array<TabSelectorTabI>,
    setCurrentTab: (tab: TabSelectorTabI) => void,
}) {
    const currentOrder = formTabsValidation[currentTab.value as TabsKeysT].order
    const sortedTabs = Object.entries(formTabsValidation)
        .filter(([key, value]) => !value.hidden && isTabEnabledE(key as TabsKeysT, formTabsValidation))
        .sort((a, b) => b[1].order - a[1].order)

    const prevTab = sortedTabs.find(([key, value]) => value.order < currentOrder)
    if (prevTab) {
        const prevTabKey = prevTab[0]
        const prevTabConfig = formTabs.find((tab) => tab.value === prevTabKey)
        if (prevTabConfig) setCurrentTab(prevTabConfig)
    }
}
export function goNextTabE({
    currentTab,
    formTabsValidation,
    formTabs,
    setCurrentTab,
}: {
    currentTab: TabSelectorTabI,
    formTabsValidation: FormTabValidation,
    formTabs: Array<TabSelectorTabI>,
    setCurrentTab: (tab: TabSelectorTabI) => void,
}) {
    const currentOrder = formTabsValidation[currentTab.value as TabsKeysT].order
    const sortedTabs = Object.entries(formTabsValidation)
        .filter(([key, value]) => !value.hidden && isTabEnabledE(key as TabsKeysT, formTabsValidation))
        .sort((a, b) => a[1].order - b[1].order)

    const nextTab = sortedTabs.find(([key, value]) => value.order > currentOrder)
    if (nextTab) {
        const nextTabKey = nextTab[0]
        const nextTabConfig = formTabs.find((tab) => tab.value === nextTabKey)
        if (nextTabConfig) setCurrentTab(nextTabConfig)
    }
}

export function createTabConfig({ key, content, formTabsValidation }: createTabConfigI) {
    return ({
        value: key,
        label: (
            <Grid gap="0.5rem" verticalAlgin="center">
                {formTabsValidation[key].status === 'invalid'
                    ? <BsExclamationSquare fill="var(--danger)" />
                    : formTabsValidation[key].status === 'valid'
                        ? <BsCheckSquare fill="var(--success)" />
                        : <BsSquare />}
                <Typography weight={500} translateGroup="forms-tabs-label" translateKey={`jackpot-${key}`} />
            </Grid>
        ),
        content,
        hidden: formTabsValidation[key].hidden,
        disabled: typeof formTabsValidation[key].dependencies === 'function'
            ? !((formTabsValidation[key].dependencies as Function)())
            : (formTabsValidation[key]?.dependencies as TabsKeysT[])?.some((dependency: TabsKeysT) => ['not-filled', 'invalid'].includes(formTabsValidation[dependency].status)),
    })
}
