import React, { useContext, useEffect, useState } from 'react'
import Typography from 'components/uiKit/typography'
import { textTranslated } from 'components/TextTranslated'
import Grid from 'components/uiKit/grid'
import Card from 'components/cards/card'
import TabSelector, { TabSelectorTabI } from 'components/selectors/tabSelector'
import GlobalContext from 'context/global'
import { CrudContext } from '..'
import FooterForm from '../footer'
import BasicTab from './tabs/basicTab'

interface FormContextI {
  updateField: (fieldName: string, value: any) => void
  currentTab: TabSelectorTabI
  setCurrentTab: (tab: TabSelectorTabI) => void
  setCurrentInfo: (info: React.ReactNode) => void
  errors: { [key: string]: any }
}

export const FormContext = React.createContext<FormContextI>({
  updateField: () => {},
  currentTab: { value: '', label: '', content: '' },
  setCurrentTab: () => {},
  setCurrentInfo: () => {},
  errors: {},
})

export default function WidgetForm() {
  const {
    selectedItem,
    setSelectedItem,
    raffleId,
    errors,
    setErrors,
  } = useContext(CrudContext)

  const { state } = useContext(GlobalContext)
  const { appSize } = state

  /**
   * ✅ SINGLE SOURCE OF TRUTH
   * Updates selectedItem.config
   * Works for CREATE and EDIT
   */
 function updateField(fieldName: string, value: any) {
  setErrors((prev: any) => ({ ...prev, [fieldName]: '' }))

  setSelectedItem((prev: any) => {
    if (!prev) return prev
    return {
      ...prev,
      [fieldName]: value, // directly update fields on selectedItem
    }
  })
}

  const formTabs: TabSelectorTabI[] = [
    {
      value: 'basic',
      label: (
        <Typography
          translateGroup="forms-tabs-label"
          translateKey="instance-info"
        />
      ),
      content: <BasicTab />,
    },
  ]

  const tabsHelper: { [key: string]: React.ReactNode } = {
    basic: textTranslated({
      group: 'forms-tabs-helpers',
      key: 'instance-basic-tab-help',
      returnDefault: 'nothing',
    }),
  }

  const [currentTab, setCurrentTab] = useState<TabSelectorTabI>(formTabs[0])
  const [currentInfo, setCurrentInfo] = useState<React.ReactNode>('')

  useEffect(() => {
    setCurrentInfo(tabsHelper[currentTab.value] || '')
  }, [currentTab])

  const largeApp = ['lg', 'xl', 'xxl'].includes(appSize)

  return (
    <FormContext.Provider
      value={{
        currentTab,
        setCurrentTab,
        setCurrentInfo,
        updateField,
        errors,
      }}
    >
      <form className="mt-5">
        <Grid
          wrap={!!raffleId ? 'wrap' : largeApp ? 'nowrap' : 'wrap'}
          verticalAlgin="stretch"
          gap="0.5rem"
        >
          {formTabs.length > 1 && (
            <Grid
              responsiveWidth={{
                sm: 100,
                lg: !!raffleId ? 100 : '300px',
                xl: !!raffleId ? 100 : '400px',
              }}
            >
              <TabSelector
                currentTab={currentTab}
                setCurrentTab={setCurrentTab}
                tabs={formTabs}
                orientation={
                  raffleId
                    ? 'horizontal'
                    : largeApp
                    ? 'vertical'
                    : 'horizontal'
                }
              />
            </Grid>
          )}

          <Grid>
            {currentTab?.content}
            <FooterForm />
          </Grid>

          {currentInfo && (
            <Card color="info" width="300px" animateOnScroll animation="flip-left">
              {currentInfo}
            </Card>
          )}
        </Grid>
      </form>
    </FormContext.Provider>
  )
}
