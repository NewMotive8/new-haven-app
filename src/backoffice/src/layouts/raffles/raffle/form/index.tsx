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
import RacePayouts from './tabs/payouts'
import SegmentsTab from './tabs/segments'
import EventsTab from './tabs/events'
import InstanceCrud from 'layouts/raffles/instance'
import WidgetSettingsTab from 'layouts/raffles/raffle/form/tabs/widget'
import TicketMechanicsTab from './tabs/ticketMechanics'

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

export default function JackpotraceForm() {
    const {
        selectedItem,
        setSelectedItem, submitForm,
    } = useContext(CrudContext)
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
            toastError(textTranslated({ group: 'toast-notifications', key: 'something-wrong-with-your-data' }))
        } else {
            await submitForm()
        }
    }

    const formTabs: Array<TabSelectorTabI> = [
        {
            value: 'basic',
            label: <Typography translateGroup="forms-tabs-label" translateKey="raffle-info" />,
            content: <BasicTab />,
        },
        {
            value: 'instances',
            label: <Typography translateGroup="forms-tabs-label" translateKey="raffle-instances" />,
            content: <InstanceCrud raffleId={selectedItem.id} />,
            hidden: !selectedItem.id,
        },
        {
            value: 'payouts',
            label: <Typography translateGroup="forms-tabs-label" translateKey="raffle-payouts" />,
            content: <RacePayouts />,
            hidden: !selectedItem.id,
        },
        {
            value: 'ticket-mechanics',
            label: <Typography>Ticket Mechanics</Typography>,
            content: <TicketMechanicsTab />,
        },
        {
            value: 'segments',
            label: <Typography translateGroup="forms-tabs-label" translateKey="raffle-segments" />,
            content: <SegmentsTab />,
            hidden: !selectedItem.id,
        },
        {
            value: 'events',
            label: <Typography translateGroup="forms-tabs-label" translateKey="raffle-events" />,
            content: <EventsTab />,
            hidden: !selectedItem.id,
        },
         {
            value: 'widget-settings',
            label: <Typography translateGroup="forms-tabs-label" translateKey="raffle-widget-settings" />,
            content: <WidgetSettingsTab />,
            hidden: false,
        }
    ]

    const tabsHelper: { [key in any]: React.ReactNode } = {
        basic: textTranslated({ group: 'forms-tabs-helpers', key: 'raffle-basic-tab-help', returnDefault: 'nothing' }),
        instances: textTranslated({ group: 'forms-tabs-helpers', key: 'raffle-instances-tab-help', returnDefault: 'nothing' }),
        payouts: textTranslated({ group: 'forms-tabs-helpers', key: 'raffle-payouts-tab-help', returnDefault: 'nothing' }),
        'ticket-mechanics': 'Configure how tickets are awarded across all events in this raffle.',
        segments: textTranslated({ group: 'forms-tabs-helpers', key: 'raffle-segments-tab-help', returnDefault: 'nothing' }),
        events: textTranslated({ group: 'forms-tabs-helpers', key: 'raffle-events-tab-help', returnDefault: 'nothing' }),
        widgets: textTranslated({ group: 'forms-tabs-helpers', key: 'raffle-widget-settings-tab-help', returnDefault: 'nothing' }),
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
            <form onSubmit={(e) => handleSubmit(e)} className="mt-5">
                <Grid wrap={largeApp ? 'nowrap' : 'wrap'} verticalAlgin='stretch' gap="0.5rem">
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
                        <Grid  style={{ minHeight: '68vh' }} >{currentTab?.content}</Grid>
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
