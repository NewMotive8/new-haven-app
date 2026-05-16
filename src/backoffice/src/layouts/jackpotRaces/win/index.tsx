import React, {
    createContext, useContext, useState, useEffect,
} from 'react'
import GlobalContext from 'context/global'
import Grid from 'components/uiKit/grid'
import Card from 'components/cards/card'
import winApi, { winI } from 'utils/services/api/requests/jackpot-race-api/win'
import ListCrud from './list'
import WinForm from './form'
import WinCrudHeader from './header'

interface CrudContextInterface {
    selectedItem: any,
    setSelectedItem: Function,
    submitForm: Function,
    deleteItem: Function,
    refreshState?: number,
    askRefresh?: Function,
    loading?: boolean,
}

export const CrudContext = createContext<CrudContextInterface>({
    selectedItem: null,
    setSelectedItem: () => { },
    submitForm: () => { },
    deleteItem: () => { },
    refreshState: 0,
    askRefresh: () => { },
    loading: false,
})

export default function WinCrud() {
    const [loading, setLoading] = useState(false)
    const [selectedItem, setSelectedItem] = useState<winI | null>(null)
    const [refreshState, setRefreshState] = useState(0)

    function askRefresh() {
        setRefreshState((current) => (1 + current))
    }

    function deleteItem() {
        winApi.deleteItem({
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
        winApi.submitForm(
            selectedItem as winI, {
            successCallBack: () => {
                askRefresh()
                setSelectedItem(null)
                setLoading(false)
            },
            errorCallBack: () => {
                setLoading(false)
            },
        })
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
            }}
        >
            <Grid>
                <Card color='secondary'>
                    <WinCrudHeader />
                    {
                        selectedItem
                            ? <WinForm />
                            : <ListCrud />
                    }
                </Card>
            </Grid>
        </CrudContext.Provider>
    )
}
