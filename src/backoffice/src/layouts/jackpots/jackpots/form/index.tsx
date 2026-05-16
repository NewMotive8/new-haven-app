import React, { useContext, useEffect, useState } from 'react'
import Typography from 'components/uiKit/typography'
import { textTranslated } from 'components/TextTranslated'
import Grid from 'components/uiKit/grid'
import { toastError } from 'utils/functions/notifications'
import TabSelector, { TabSelectorTabI } from 'components/selectors/tabSelector'
import GlobalContext from 'context/global'
import Card from 'components/cards/card'
import Loading from 'assets/loading'
import { useJackpotData } from 'utils/customHooks/jackpots'
import Button from 'components/uiKit/buttons'
import BrandContext from 'context/brand'
import { globalData } from 'pages/_app'
import { CrudContext } from '..'
import validateForm, { errorI, mapTabValidation } from './formValidation'
import FooterForm from '../footer'
import BasicTab from './tabs/basicTab'
import TypeTab from './tabs/typeTab'
import ModelTab from './tabs/model'
import PoolTab from './tabs/pool'
import SeedTab from './tabs/seed'
import ScheduleTab from './tabs/schedule'
import WidgetTab from './tabs/widget'
import EventsTab from './tabs/events'
import SegmentsTab from './tabs/segments'
import CommunityTab from './tabs/community'
import SummaryTab from './tabs/summary'
import SimulatorTab from './tabs/simulator'
import {
  FormContextI, FormTabValidation, TabsKeysT, tabsHelper,
} from './types'
import {
  createTabConfig,
  goNextTabE,
  goPreviousTabE,
  setupTabsValidation,
} from './functions'
import RecurrenceTab from './tabs/recurrence'

export const FormContext = React.createContext<FormContextI>({
  updateField: (fieldName: string, value: any) => { },
  currentTab: { value: '', label: '', content: '' },
  setCurrentTab: (tab: TabSelectorTabI) => { },
  setCurrentInfo: (info: React.ReactNode) => { },
  errors: {},
  setErrors: (errors: any) => { },
  formTabsValidation: {} as any,
  setFormTabsValidation: (item: FormTabValidation) => { },
  validateTab: (tab: TabsKeysT) => { },
  goNextTab: () => { },
  goPreviousTab: () => { },
  tabs: [],
})

export default function JackpotsForm() {
  const { currentBrand } = useContext(BrandContext)

  const { selectedItem, setSelectedItem, submitForm } = useContext(CrudContext)
  const { state } = React.useContext(GlobalContext)
  const { appSize } = state
  const [errors, setErrors] = useState<errorI>({
    count: 0,
    tabsStatus: [],
  })
  const [formTabsValidation, setFormTabsValidation] = useState<FormTabValidation>(setupTabsValidation({ selectedItem, errors }))
  const [fetchInitialData, setFetchInitialData] = useState({
    loading: true,
    isFetched: false,
    initialData: null,
  })
  const [goNextTabCustom, setGoNextTabCustom] = useState<Function | null>()
  const [goPreviousTabCustom, setGoPreviousTabCustom] = useState<Function | null>()
  useJackpotData({
    selectedItem,
    setSelectedItem,
    setFetchInitialData,
    fetchInitialData,
    currentBrand,
  })

  function updateField(fieldName: string, value: any) {
    setErrors((d: any) => {
      return { ...d, [fieldName]: '' }
    })
    setSelectedItem((d: any) => {
      return { ...d, [fieldName]: value }
    })
  }

  function validateTab(tab: TabsKeysT) {
    setErrors((d: any) => {
      const newErro = { ...d, ...mapTabValidation[tab](selectedItem) }
      return newErro
    })
  }

  useEffect(() => {
    setFormTabsValidation((current) => setupTabsValidation({ selectedItem, errors, current }))
  }, [errors, selectedItem])

  useEffect(() => {
    if (selectedItem.id) {
      setErrors((d: any) => ({ ...validateForm(selectedItem) }))
    }
  }, [selectedItem.id])
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const validationFormResult = validateForm(selectedItem)
    if (validationFormResult?.count) {
      setErrors(validationFormResult)
      toastError(
        textTranslated({
          group: 'toast-notifications',
          key: 'something-wrong-with-your-data',
        }),
      )
    } else {
      await submitForm()
    }
  }

  const formTabs: Array<TabSelectorTabI> = [
    createTabConfig({ key: 'type', content: <TypeTab />, formTabsValidation }),
    createTabConfig({
      key: 'basic',
      content: <BasicTab />,
      formTabsValidation,
    }),
    createTabConfig({
      key: 'model',
      content: <ModelTab />,
      formTabsValidation,
    }),
    createTabConfig({ key: 'pool', content: <PoolTab />, formTabsValidation }),
    createTabConfig({ key: 'seed', content: <SeedTab />, formTabsValidation }),
    createTabConfig({
      key: 'recurrence',
      content: <RecurrenceTab />,
      formTabsValidation,
    }),
    createTabConfig({
      key: 'schedule',
      content: <ScheduleTab />,
      formTabsValidation,
    }),
    createTabConfig({
      key: 'widget',
      content: <WidgetTab />,
      formTabsValidation,
    }),
    createTabConfig({
      key: 'events',
      content: <EventsTab />,
      formTabsValidation,
    }),
    createTabConfig({
      key: 'segments',
      content: <SegmentsTab />,
      formTabsValidation,
    }),
    createTabConfig({
      key: 'community',
      content: <CommunityTab />,
      formTabsValidation,
    }),
    createTabConfig({
      key: 'simulator',
      content: <SimulatorTab />,
      formTabsValidation,
    }),
    createTabConfig({
      key: 'summary',
      content: <SummaryTab />,
      formTabsValidation,
    }),
  ]

  const [currentTab, setCurrentTab] = useState<TabSelectorTabI>(
    formTabs.filter((tab) => !tab.hidden)[0],
  )
  const [currentInfo, setCurrentInfo] = useState<React.ReactNode>('')

  useEffect(() => {
    setCurrentInfo(tabsHelper[currentTab.value]())
    if (currentTab.value !== 'widget') {
      setGoNextTabCustom(null)
      setGoPreviousTabCustom(null)
    }
  }, [currentTab, globalData.editTranslations])

  function goNextTab() {
    if (goNextTabCustom && typeof goNextTabCustom === 'function') {
      goNextTabCustom()
    } else {
      goNextTabE({
        currentTab,
        formTabs,
        formTabsValidation,
        setCurrentTab,
      })
    }
  }

  function goPreviousTab() {
    if (goPreviousTabCustom && typeof goPreviousTabCustom === 'function') {
      goPreviousTabCustom()
    } else {
      goPreviousTabE({
        currentTab,
        formTabs,
        formTabsValidation,
        setCurrentTab,
      })
    }
  }

  const largeApp = ['lg', 'xl', 'xxl'].includes(appSize)

  if (fetchInitialData.loading) {
    return (
      <Grid
        padding={['pt-5', 'pb-5']}
        gap="1rem"
        horizontalAlgin="center"
        verticalAlgin="center"
      >
        <Loading size={50} />
        <Grid gap="1.5rem" horizontalAlgin="center" size={20}>
          <Typography
            translateGroup="jackpot-form"
            translateKey="loading-jackpot-data..."
            style={{ width: '100%', textAlign: 'center' }}
          />
          <Button id="loading-cancel" onClick={() => setSelectedItem(null)}>
            <Typography translateGroup="global" translateKey="cancel" />
          </Button>
        </Grid>
      </Grid>
    )
  }

  return (
    <FormContext.Provider
      value={{
        currentTab,
        setCurrentTab,
        setCurrentInfo,
        updateField,
        errors,
        setErrors,
        formTabsValidation,
        setFormTabsValidation,
        validateTab,
        goNextTab,
        goPreviousTab,
        tabs: formTabs,
        goNextTabCustom,
        setGoNextTabCustom,
        goPreviousTabCustom,
        setGoPreviousTabCustom,
      }}
    >
      <form onSubmit={(e) => handleSubmit(e)} className="mt-5">
        <Grid
          wrap={largeApp ? 'nowrap' : 'wrap'}
          verticalAlgin="stretch"
          gap="0.5rem"
        >
          {formTabs.length > 1 && (
            <Grid responsiveWidth={{ sm: 100, lg: '300px', xl: '400px' }}>
              <TabSelector
                currentTab={currentTab}
                setCurrentTab={setCurrentTab}
                tabs={formTabs.map((tab) => ({
                  ...tab,
                  disabled:
                    tab.value === currentTab.value ? false : tab.disabled,
                }))}
                orientation={largeApp ? 'vertical' : 'horizontal'}
              />
            </Grid>
          )}
          <Grid verticalAlgin="space-between">
            {currentTab?.content}
            <Grid>
              <FooterForm />
            </Grid>
          </Grid>
          <Grid
            responsiveWidth={{
              sm: 100,
              lg: '300px',
              xl: '400px',
              xxl: '450px',
            }}
          >
            {currentInfo && (
              <Card
                color="info"
                animateOnScroll
                animation="flip-left"
              >
                {currentInfo}
              </Card>
            )}
          </Grid>
        </Grid>
      </form>
    </FormContext.Provider>
  )
}
