import React, { useContext, useEffect, useState } from 'react'
import Typography from 'components/uiKit/typography'
import { textTranslated } from 'components/TextTranslated'
import Grid from 'components/uiKit/grid'
import { toastError } from 'utils/functions/notifications'
import TabSelector, { TabSelectorTabI } from 'components/selectors/tabSelector'
import GlobalContext from 'context/global'
import Card from 'components/cards/card'
import { CrudContext } from '..'
import validateForm from './formValidation'
import FooterForm from '../footer'
import BasicTab from './tabs/basicTab'

interface FormContextI {
  updateField: (fieldName: string, value: any) => void;
  currentTab: TabSelectorTabI;
  setCurrentTab: (tab: TabSelectorTabI) => void;
  setCurrentInfo: (info: React.ReactNode) => void;
  errors: { [key: string]: any };
}

export const FormContext = React.createContext<FormContextI>({
  updateField: (fieldName: string, value: any) => {},
  currentTab: { value: '', label: '', content: '' },
  setCurrentTab: (tab: TabSelectorTabI) => {},
  setCurrentInfo: (info: React.ReactNode) => {},
  errors: {},
})

export default function BoTranslationsForm() {
  const { selectedItem, setSelectedItem, submitForm } = useContext(CrudContext)
  const { state } = React.useContext(GlobalContext)
  const { appSize } = state
  const [errors, setErrors] = useState<any>({ count: 0 })

  function updateField(fieldName: string, value: any) {
    setErrors((d: any) => {
      return { ...d, [fieldName]: '' }
    })

    setSelectedItem((d: any) => {
      return { ...d, [fieldName]: value }
    })
  }

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
    {
      value: 'basic',
      label: (
        <Typography
          translateGroup="forms-tabs-label"
          translateKey="boTranslations-info"
        />
      ),
      content: <BasicTab />,
    },
  ]

  const tabsHelper: { [key in any]: React.ReactNode } = {
    basic: textTranslated({
      group: 'forms-tabs-helpers',
      key: 'boTranslations-basic-tab-help',
      returnDefault: 'nothing',
    }),
  }

  const [currentTab, setCurrentTab] = useState<TabSelectorTabI>(formTabs[0])
  const [currentInfo, setCurrentInfoDate] = useState<React.ReactNode>('')

  function setCurrentInfo(value: any) {
    if (value !== '') {
      setCurrentInfoDate(value)
    }
  }

  useEffect(() => {
    if (tabsHelper[currentTab.value]) {
      setCurrentInfo(tabsHelper[currentTab.value])
    } else {
      setCurrentInfo('')
    }
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
                tabs={formTabs}
                orientation={largeApp ? 'vertical' : 'horizontal'}
              />
            </Grid>
          )}
          <Grid>
            {currentTab?.content}
            <FooterForm />
          </Grid>
          {currentInfo && (
            <Card
              color="info"
              width="300px"
              animateOnScroll
              animation="flip-left"
            >
              {currentInfo}
            </Card>
          )}
        </Grid>
      </form>
    </FormContext.Provider>
  )
}
