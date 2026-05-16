import React, {
 createContext, useContext, useState, useEffect,
} from 'react'
import GlobalContext from 'context/global'
import Grid from 'components/uiKit/grid'
import Card from 'components/cards/card'
import alertsApi, { alertsI } from 'utils/services/api/requests/alerts'
import ListCrud from './list'
import AlertsForm from './form'
import AlertsCrudHeader from './header'

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

export default function AlertsCrud() {
  const [loading, setLoading] = useState(false)
  const [selectedItem, setSelectedItem] = useState<alertsI | null>(null)
  const [refreshState, setRefreshState] = useState(0)

  function askRefresh() {
    setRefreshState((current) => 1 + current)
  }

  function deleteItem() {
    alertsApi.deleteItem({
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
    alertsApi.submitForm(selectedItem as alertsI, {
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
          <AlertsCrudHeader />
          {selectedItem ? <AlertsForm /> : <ListCrud />}
        </Card>
      </Grid>
    </CrudContext.Provider>
  )
}
