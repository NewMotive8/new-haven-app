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
import WinsTab from './tabs/winsTab'

interface FormContextI {
    updateField: (fieldName: string, value: any) => void
    currentTab: TabSelectorTabI,
    setCurrentTab: (tab: TabSelectorTabI) => void
    setCurrentInfo: (info: React.ReactNode) => void,
    errors: { [key: string]: any }
}

export const FormContext = React.createContext<FormContextI>({
    updateField: (fieldName: string, value: any) => { },
    currentTab: { value: '', label: '', content: '' },
    setCurrentTab: (tab: TabSelectorTabI) => { },
    setCurrentInfo: (info: React.ReactNode) => { },
    errors: {}
})

export default function InstanceForm() {
    const {
        setSelectedItem,
        raffleId,
        errors,
        setErrors
    } = useContext(CrudContext)
    const { state } = React.useContext(GlobalContext)
    const { appSize } = state

    function updateField(fieldName: string, value: any) {
        setErrors((d: any) => {
            return { ...d, [fieldName]: '' }
        })

        setSelectedItem((d: any) => {
            return { ...d, [fieldName]: value }
        })
    }

  

    const formTabs: Array<TabSelectorTabI> = [
        {
            value: 'basic',
            label: <Typography translateGroup="forms-tabs-label" translateKey="instance-info" />,
            content: <BasicTab />,
        },
        {
            value: 'wins',
            label: <Typography translateGroup="forms-tabs-label" translateKey="instance-wins" />,
            content: <WinsTab />,
        }
    ]

    const tabsHelper: { [key in any]: React.ReactNode } = {
        basic: textTranslated({ group: 'forms-tabs-helpers', key: 'instance-basic-tab-help', returnDefault: 'nothing' }),
        wins: textTranslated({ group: 'forms-tabs-helpers', key: 'instance-wins-tab-help', returnDefault: 'nothing' }),
    }

    const [currentTab, setCurrentTab] = useState<TabSelectorTabI>(formTabs[0])
    const [currentInfo, setCurrentInfo] = useState<React.ReactNode>('')

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
            <form  className="mt-5">
                <Grid wrap={!!raffleId ? 'wrap' :largeApp ? 'nowrap' : 'wrap'} verticalAlgin='stretch' gap="0.5rem">
                    {formTabs.length > 1 && (
                        <Grid responsiveWidth={{ sm: 100, lg: !!raffleId ? 100 : '300px', xl: !!raffleId ? 100 : '400px' }}>
                            <TabSelector
                                currentTab={currentTab}
                                setCurrentTab={setCurrentTab}
                                tabs={formTabs}
                                orientation={raffleId ? 'horizontal' : largeApp ? 'vertical' : 'horizontal'}
                            />
                        </Grid>
                    )}
                    <Grid>
                        {currentTab?.content}
                        <FooterForm />
                    </Grid>
                    {currentInfo && (
                        <Card color='info' width={"300px"} animateOnScroll animation='flip-left'>
                            {currentInfo}
                        </Card>
                    )}
                </Grid>
            </form>
        </FormContext.Provider>
    )
}
