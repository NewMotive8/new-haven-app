import { textTranslated } from 'components/TextTranslated'
import { TabSelectorTabI } from 'components/selectors/tabSelector'
import Grid from 'components/uiKit/grid'
import TypeButton from 'components/uiKit/inputs/TypeButton'
import Typography from 'components/uiKit/typography'
import React, { useEffect, useState } from 'react'
import { FormContext } from '../..'
import { CrudContext } from '../../..'
import AverageTab from './tabs/average'
import FixedTab from './tabs/fixed'
import MaximumTab from './tabs/maximum'

export default function ModelTab() {
  const { selectedItem } = React.useContext(CrudContext)
  const {
    updateField, setCurrentInfo, validateTab,
  } = React.useContext(FormContext)
  const isMustDrop = selectedItem.type === 3 || selectedItem.type === 'MUST_DROP'
  const isMultiLevel = selectedItem.type === 4 || selectedItem.type === 'MULTI_LEVEL'
  const formTabs: Array<TabSelectorTabI> = [
    {
      value: 1,
      label: (
        <Typography
          translateGroup="forms-tabs-label"
          translateKey="jackpot-model-fixed-info"
          weight={600}
        />
      ),
      content: <FixedTab />,
      hidden: isMustDrop || isMultiLevel,
      disabled: !!selectedItem.id,
    },
    {
      value: 2,
      label: (
        <Typography
          translateGroup="forms-tabs-label"
          translateKey="jackpot-model-average-info"
          weight={600}
        />
      ),
      content: <AverageTab />,
      hidden: isMustDrop,
      disabled: !!selectedItem.id,
    },
    {
      value: 3,
      label: (
        <Typography
          translateGroup="forms-tabs-label"
          translateKey="jackpot-model-maximum-info"
          weight={600}
        />
      ),
      hidden: isMustDrop,
      content: <MaximumTab />,
      disabled: !!selectedItem.id,
    },
  ]

  const tabsHelper: { [key in any]: React.ReactNode } = {
    1: textTranslated({
      group: 'forms-tabs-helpers',
      key: 'jackpot-model-maximum-tab-help',
      returnDefault: 'nothing',
    }),
    2: textTranslated({
      group: 'forms-tabs-helpers',
      key: 'jackpot-model-average-tab-help',
      returnDefault: 'nothing',
    }),
    3: textTranslated({
      group: 'forms-tabs-helpers',
      key: 'jackpot-model-fixed-tab-help',
      returnDefault: 'nothing',
    }),
  }

  const [currentTab, setCurrentTab] = useState<TabSelectorTabI | undefined>()
  function defineModel(target: any) {
    updateField('model', target.value)
    updateField('fixedWinAmount', 0)
    updateField('averageWinAmount', 0)
    updateField('maximumWinAmount', 0)
  }
  useEffect(() => {
    if (currentTab && tabsHelper[currentTab?.value]) {
      setCurrentInfo(tabsHelper[currentTab?.value])
    } else {
      setCurrentInfo('')
    }
  }, [currentTab])

  useEffect(() => {
    validateTab('model')
  }, [
    selectedItem.model,
    selectedItem.fixedWinAmount,
    selectedItem.averageWinAmount,
    selectedItem.maximumWinAmount,
  ])
  useEffect(() => {
    if ((!selectedItem.id && !selectedItem.model) || (selectedItem.type === 'MULTI_LEVEL' && selectedItem.model === 1)) {
      if (selectedItem.type === 3 || selectedItem.type === 'MUST_DROP') {
        defineModel({ value: 3 })
      } else if (selectedItem.type === 4 || selectedItem.type === 'MULTI_LEVEL') {
        defineModel({ value: 2 })
      } else {
        defineModel({ value: 1 })
      }
    }
  }, [selectedItem.type])
  useEffect(() => {
    if (selectedItem.model === 2) {
      setCurrentTab(formTabs[1])
    }
    if (selectedItem.model === 3) {
      setCurrentTab(formTabs[2])
    }
    if (!currentTab) {
      setCurrentTab(formTabs.find((tab) => tab.value === selectedItem.model))
    }
  }, [selectedItem.model])

  return (
    <Grid gap="0.5rem">
      <Grid gap="0.5rem">
        <Grid>
          <Typography
            translateGroup="global"
            translateKey="select-a-jackpot-model"
            size="md"
            weight={600}
          />
        </Grid>
        <TypeButton
          name="model"
          value={currentTab?.value}
          onChange={({ target }: any) => {
            defineModel(target)
            setCurrentTab(formTabs.find((tab) => tab.value === target.value))
          }}
          options={formTabs}
          orientation="horizontal"
          readOnly={!!selectedItem.id}
        />
      </Grid>
      <Grid padding={['p-3']}>{currentTab?.content}</Grid>
    </Grid>
  )
}
