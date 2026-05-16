import React, {
 createContext, useContext, useState, useEffect,
} from 'react'
import GlobalContext from 'context/global'
import Grid from 'components/uiKit/grid'
import Card from 'components/cards/card'
import exchangeRatesApi, {
  exchangeRatesI,
} from 'utils/services/api/requests/exchangeRates'
import ListCrud from './list'
import ExchangeRatesForm from './form'
import ExchangeRatesCrudHeader from './header'

interface CrudContextInterface {
  selectedItem: any;
  setSelectedItem: Function;
  submitForm: Function;
  deleteItem: Function;
  refreshState?: number;
  askRefresh?: Function;
  loading?: boolean;
}

export const CrudContext = createContext<CrudContextInterface>({
  selectedItem: null,
  setSelectedItem: () => {},
  submitForm: () => {},
  deleteItem: () => {},
  refreshState: 0,
  askRefresh: () => {},
  loading: false,
})

export default function ExchangeRatesCrud() {
  const [loading, setLoading] = useState(false)
  const [selectedItem, setSelectedItem] = useState<exchangeRatesI | null>(null)
  const [refreshState, setRefreshState] = useState(0)

  function askRefresh() {
    setRefreshState((current) => 1 + current)
  }

  function deleteItem() {
    exchangeRatesApi.deleteItem({
      id: selectedItem?.id as number,
      successCallBack: () => {
        askRefresh()
        setSelectedItem(null)
      },
      errorCallBack: () => {},
    })
  }

  function submitForm() {
    setLoading(true)
    exchangeRatesApi.submitForm(selectedItem as exchangeRatesI, {
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
          <ExchangeRatesCrudHeader />
          {selectedItem ? <ExchangeRatesForm /> : <ListCrud />}
        </Card>
      </Grid>
    </CrudContext.Provider>
  )
}
