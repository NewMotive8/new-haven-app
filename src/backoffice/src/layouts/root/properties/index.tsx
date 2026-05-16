import React, {
 createContext, useContext, useState, useEffect,
} from 'react'
import GlobalContext from 'context/global'
import Grid from 'components/uiKit/grid'
import Card from 'components/cards/card'
import propertiesApi, {
  propertiesI,
} from 'utils/services/api/requests/properties'
import ListCrud from './list'
import PropertiesForm from './form'
import PropertiesCrudHeader from './header'

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

export default function PropertiesCrud() {
  const [loading, setLoading] = useState(false)
  const [selectedItem, setSelectedItem] = useState<propertiesI | null>(null)
  const [refreshState, setRefreshState] = useState(0)

  function askRefresh() {
    setRefreshState((current) => 1 + current)
  }

  function deleteItem() {
    propertiesApi.deleteItem({
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
    propertiesApi.submitForm(selectedItem as propertiesI, {
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
          <PropertiesCrudHeader />
          {selectedItem ? <PropertiesForm /> : <ListCrud />}
        </Card>
      </Grid>
    </CrudContext.Provider>
  )
}
