import React, {
    createContext, useContext, useState, useEffect,
} from 'react'
import GlobalContext from 'context/global'
import Grid from 'components/uiKit/grid'
import Card from 'components/cards/card'
import instanceApi, { instanceI } from 'utils/services/api/requests/raffle-api/instance'
import ListCrud from './list'
import InstanceForm from './form'
import InstanceCrudHeader from './header'
import validateForm from './form/formValidation'
import { toastError } from 'utils/functions/notifications'
import { textTranslated } from 'components/TextTranslated'

interface CrudContextInterface {
    selectedItem: any,
    setSelectedItem: Function,
    submitForm: Function,
    deleteItem: Function,
    refreshState?: number,
    askRefresh?: Function,
    loading?: boolean,
    raffleId?: number,
    errors: any,
    setErrors: Function,
}

export const CrudContext = createContext<CrudContextInterface>({
    selectedItem: null,
    setSelectedItem: () => { },
    submitForm: () => { },
    deleteItem: () => { },
    refreshState: 0,
    askRefresh: () => { },
    loading: false,
    errors: {},
    setErrors: () => { }
})

interface InstanceCrudProps {
    raffleId?: number,
}


export default function InstanceCrud({ raffleId }: InstanceCrudProps) {
    const [loading, setLoading] = useState(false)
    const [selectedItem, setSelectedItem] = useState<instanceI | null>(null)
    const [refreshState, setRefreshState] = useState(0)
    const [errors, setErrors] = useState<any>({ count: 0 })


    function askRefresh() {
        setRefreshState((current) => (1 + current))
    }

    function deleteItem() {
        instanceApi.deleteItem({
            id: selectedItem?.id as number,
            successCallBack: () => {
                askRefresh()
                setSelectedItem(null)
            },
            errorCallBack: () => { },
        })
    }

    function submitForm() {
        setLoading(true)
        const validationFormResult = validateForm(selectedItem as instanceI)
        if (validationFormResult?.count) {
            setErrors(validationFormResult)
            toastError(textTranslated({ group: 'toast-notifications', key: 'something-wrong-with-your-data' }))
        } else {
            instanceApi.submitForm(
                selectedItem as instanceI, {
                successCallBack: (newSelectedItem: instanceI) => {
                    askRefresh()
                    setSelectedItem(newSelectedItem)
                    setLoading(false)
                },
                errorCallBack: () => {
                    setLoading(false)
                },
            })
        }
    }

    const { setSideMenuListener } = useContext(GlobalContext)

    useEffect(() => {
        if (selectedItem) {
            setSideMenuListener({
                function: () => setSelectedItem(null),
            })
        } else {
            setSideMenuListener(null)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedItem])

    return (
        <CrudContext.Provider
            value={{
                selectedItem,
                setSelectedItem,
                submitForm,
                deleteItem,
                askRefresh,
                refreshState,
                loading,
                raffleId,
                errors,
                setErrors,
            }}
        >
            <Grid>
                <Card color='secondary'>
                    {
                        !raffleId && (
                            <InstanceCrudHeader />
                        )
                    }
                    {
                        selectedItem
                            ? <InstanceForm />
                            : <ListCrud />
                    }
                </Card>
            </Grid>
        </CrudContext.Provider>
    )
}
