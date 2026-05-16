import React, {
 createContext, useContext, useState, useEffect,
} from 'react'
import GlobalContext from 'context/global'
import Grid from 'components/uiKit/grid'
import Card from 'components/cards/card'
import usersApi, { usersI } from 'utils/services/api/requests/users'
import { useQuery } from 'react-query'
import brandApi from 'utils/services/api/requests/brand'
import ListCrud from './list'
import UsersForm from './form'
import UsersCrudHeader from './header'

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

export default function UsersCrud() {
  const [loading, setLoading] = useState(false)
  const [selectedItem, setSelectedItem] = useState<usersI | null>(null)
  const [refreshState, setRefreshState] = useState(0)
  const { data } = useQuery('brands', () => brandApi.getItems(), {})
  function askRefresh() {
    setRefreshState((current) => 1 + current)
  }

  function deleteItem() {
    usersApi.deleteItem({
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
    const updatedList = selectedItem?.brands?.map((brand: any) => {
      const correspondingItem = data?.content.find(
        (itemContent: any) => itemContent.id === brand.value,
      )

      if (correspondingItem) {
        return correspondingItem
      }

      return brand
    })
    const formData = {
      ...selectedItem,
      brands: updatedList,
    }
    usersApi.submitForm(formData as usersI, {
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
          <UsersCrudHeader />
          {selectedItem ? <UsersForm /> : <ListCrud />}
        </Card>
      </Grid>
    </CrudContext.Provider>
  )
}
