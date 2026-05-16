import React, {
    createContext, useContext, useState, useEffect,
} from 'react'
import GlobalContext from 'context/global'
import Grid from 'components/uiKit/grid'
import Card from 'components/cards/card'
import brandApi, { brandI } from 'utils/services/api/requests/brand'
import { queryClient } from 'pages/_app'
import BrandContext from 'context/brand'
import ListCrud from './list'
import BrandForm from './form'
import BrandCrudHeader from './header'

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

export default function BrandCrud() {
    const [loading, setLoading] = useState(false)
    const [selectedItem, setSelectedItem] = useState<brandI | null>(null)
    const [refreshState, setRefreshState] = useState(0)
    const { refreshBrand } = useContext(BrandContext)

    function askRefresh() {
        setRefreshState((current) => (1 + current))
    }

    function deleteItem() {
        brandApi.deleteItem({
            id: selectedItem?.id as number,
            successCallBack: () => {
                askRefresh()
                refreshBrand()
                setSelectedItem(null)
            },
            errorCallBack: () => { },
        })
    }

    function submitForm() {
        setLoading(true)
        brandApi.submitForm(selectedItem as brandI, {
            successCallBack: () => {
                askRefresh()
                refreshBrand()
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
                <Card color="secondary">
                    <BrandCrudHeader />
                    {
                        selectedItem
                            ? <BrandForm />
                            : <ListCrud />
                    }
                </Card>
            </Grid>
        </CrudContext.Provider>
    )
}
