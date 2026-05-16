import TabSelector, { TabSelectorTabI } from 'components/selectors/tabSelector'
import { buttonColors } from 'components/uiKit/buttons/types'
import Grid from 'components/uiKit/grid'
import { gridBaseProps } from 'components/uiKit/grid/types'
import React, { ReactNode, useState } from 'react'

interface items {
    title: ReactNode,
    content: ReactNode,
}

interface Props extends Omit<gridBaseProps, 'label' | 'value' | 'children'> {
    color?: buttonColors | 'root' | 'section' | 'transparent',
    items: items[],
    initialIndex?: number
}

export default function MultiTabCard(props: Props) {
    const {
        color,
        items,
        initialIndex,
        ...cProps
    } = props
    const tabOptions = items.map(({ title, content }, index: number) => ({ value: index, label: title, content }))
    const [currentTab, setCurrentTab] = useState<TabSelectorTabI>(tabOptions[initialIndex || 0])

    return (
        <Grid {...cProps}>
            <TabSelector
                setCurrentTab={setCurrentTab}
                currentTab={currentTab}
                tabs={tabOptions}
                orientation="horizontal"
                color={color}
            />
            <Grid>
                {currentTab.content}
            </Grid>
        </Grid>
    )
}
