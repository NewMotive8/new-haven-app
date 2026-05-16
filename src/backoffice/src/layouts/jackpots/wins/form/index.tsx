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
import { winsI } from 'utils/services/api/requests/wins'

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

export default function WinsForm() {
    const { selectedItem, setSelectedItem, submitForm } = useContext(CrudContext)
    const { state } = useContext(GlobalContext)
    const { appSize } = state
    const [errors, setErrors] = useState<{ [key: string]: any }>({})

    // -----------------------
    // Update a single field
    // -----------------------
    function updateField(fieldName: string, value: any) {
        setErrors((prev) => ({ ...prev, [fieldName]: '' }))

        if (!selectedItem) return

        setSelectedItem({
            ...selectedItem,
            [fieldName]: value,
        })
    }

    // -----------------------
    // Handle form submit
    // -----------------------
    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()

        if (!selectedItem) return

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

    // -----------------------
    // Form tabs
    // -----------------------
    const formTabs: TabSelectorTabI[] = [
        {
            value: 'basic',
            label: <Typography translateGroup="forms-tabs-label" translateKey="wins-info" />,
            content: <BasicTab />,
        },
    ]

    const tabsHelper: { [key: string]: React.ReactNode } = {
        basic: textTranslated({
            group: 'forms-tabs-helpers',
            key: 'wins-basic-tab-help',
            returnDefault: 'nothing',
        }),
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
                updateField,
                currentTab,
                setCurrentTab,
                setCurrentInfo,
                errors,
            }}
        >
            <form onSubmit={handleSubmit} className="mt-5">
                <Grid wrap={largeApp ? 'nowrap' : 'wrap'} verticalAlgin="stretch" gap="0.5rem">
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
                        {currentTab.content}
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
