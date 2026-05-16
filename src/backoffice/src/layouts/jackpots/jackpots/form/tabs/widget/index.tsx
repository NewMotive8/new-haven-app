import React, { useEffect, useState } from 'react'
import Grid from 'components/uiKit/grid'
import { textTranslated } from 'components/TextTranslated'
import Typography from 'components/uiKit/typography'
import TabSelector, { TabSelectorTabI } from 'components/selectors/tabSelector'
import { FormContext } from '../..'
import { CrudContext } from '../../..'
import BasicTab from './tabs/basic'
import StyleTab from './tabs/style'
import AnimationTab from './tabs/animation'
import ContentTab from './tabs/content'
import DefaultContentTab from './tabs/defaultContent'

export default function WidgetTab() {
  const { selectedItem } = React.useContext(CrudContext)
  const {
    setCurrentInfo,
    validateTab,
    setGoNextTabCustom,
    setGoPreviousTabCustom,
  } = React.useContext(FormContext)

  const formTabs: Array<TabSelectorTabI> = [
    {
      value: 1,
      label: (
        <Typography
          translateGroup="forms-tabs-label"
          translateKey="jackpot-widget-basic"
        />
      ),
      content: <BasicTab />,
    },
    {
      value: 2,
      label: (
        <Typography
          translateGroup="forms-tabs-label"
          translateKey="jackpot-widget-style"
        />
      ),
      content: <StyleTab />,
    },
    {
      value: 3,
      label: (
        <Typography
          translateGroup="forms-tabs-label"
          translateKey="jackpot-widget-animation"
        />
      ),
      content: <AnimationTab />,
    },
    {
      value: 4,
      label: (
        <Typography
          translateGroup="forms-tabs-label"
          translateKey="jackpot-widget-content"
        />
      ),
      content: selectedItem.id ? <ContentTab /> : <DefaultContentTab />,
    },
  ]

  const tabsHelper: { [key in any]: React.ReactNode } = {
    1: textTranslated({
      group: 'forms-tabs-helpers',
      key: 'jackpot-widget-basic-tab-help',
      returnDefault: 'nothing',
    }),
    2: textTranslated({
      group: 'forms-tabs-helpers',
      key: 'jackpot-widget-style-tab-help',
      returnDefault: 'nothing',
    }),
    3: textTranslated({
      group: 'forms-tabs-helpers',
      key: 'jackpot-widget-animation-tab-help',
      returnDefault: 'nothing',
    }),
    4: textTranslated({
      group: 'forms-tabs-helpers',
      key: 'jackpot-widget-content-tab-help',
      returnDefault: 'nothing',
    }),
  }

  const [currentTab, setCurrentTab] = useState<TabSelectorTabI | undefined>(
    formTabs[0],
  )

  useEffect(() => {
    if (currentTab && tabsHelper[currentTab?.value]) {
      setCurrentInfo(tabsHelper[currentTab?.value])
    } else {
      setCurrentInfo('')
    }
    if (setGoNextTabCustom && setGoPreviousTabCustom && !selectedItem.id) {
      if (currentTab?.value === 1) {
        setGoNextTabCustom(() => {
          return () => setCurrentTab(formTabs[1])
        })
        setGoPreviousTabCustom(null)
      }
      if (currentTab?.value === 2) {
        setGoNextTabCustom(() => {
          return () => setCurrentTab(formTabs[2])
        })
        setGoPreviousTabCustom(() => {
          return () => setCurrentTab(formTabs[0])
        })
      }
      if (currentTab?.value === 3) {
        setGoNextTabCustom(() => {
          return () => setCurrentTab(formTabs[3])
        })
        setGoPreviousTabCustom(() => {
          return () => setCurrentTab(formTabs[1])
        })
      }
      if (currentTab?.value === 4) {
        setGoNextTabCustom(null)
        setGoPreviousTabCustom(() => {
          return () => setCurrentTab(formTabs[2])
        })
      }
    }
  }, [currentTab])

  useEffect(() => {
    validateTab('widget')
  }, [selectedItem.widget])

  return (
    <Grid gap="0.5rem" verticalAlgin="flex-start">
      <Grid>
        <TabSelector
          currentTab={currentTab}
          setCurrentTab={(v) => {
            setCurrentTab(v)
          }}
          tabs={formTabs}
          orientation="horizontal"
        />
      </Grid>
      <Grid padding={['p-3']}>{currentTab?.content}</Grid>
    </Grid>
  )
}
