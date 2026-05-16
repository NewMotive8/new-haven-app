import React, { createContext, useContext, useState, useEffect } from 'react'
import GlobalContext from 'context/global'
import Grid from 'components/uiKit/grid'
import Card from 'components/cards/card'
import winsApi, { winsI } from 'utils/services/api/requests/wins'
import ListCrud from './list'
import WinsForm from './form'
import WinsCrudHeader from './header'
import FullPageSpinner from 'components/uiKit/spinner'

interface CrudContextInterface {
  selectedItem: winsI | null
  setSelectedItem: (item: winsI | null) => void
  submitForm: () => void
  deleteItem: () => void
  refreshState: number
  askRefresh: () => void
  loading: boolean
  setLoading: (value: boolean) => void
}

export const CrudContext = createContext<CrudContextInterface>({
  selectedItem: null,
  setSelectedItem: () => {},
  submitForm: () => {},
  deleteItem: () => {},
  refreshState: 0,
  askRefresh: () => {},
  loading: false,
  setLoading: () => {},
})

export default function WinsCrud() {
  const [loading, setLoading] = useState(false)
  const [selectedItem, setSelectedItem] = useState<winsI | null>(null)
  const [refreshState, setRefreshState] = useState(0)

  const askRefresh = () => setRefreshState((prev) => prev + 1)

  const deleteItem = () => {
    if (!selectedItem) return
    setLoading(true)
    winsApi.deleteItem({
      id: selectedItem.id,
      successCallBack: () => {
        askRefresh()
        setSelectedItem(null)
        setLoading(false)
      },
      errorCallBack: () => setLoading(false),
    })
  }

  const submitForm = () => {
    if (!selectedItem) return
    setLoading(true)
    winsApi.submitForm(selectedItem, {
      successCallBack: () => {
        askRefresh()
        setSelectedItem(null)
        setLoading(false)
      },
      errorCallBack: () => setLoading(false),
    })
  }

  const { setSideMenuListener } = useContext(GlobalContext)

  useEffect(() => {
    if (selectedItem) {
      setSideMenuListener({ function: () => setSelectedItem(null) })
    } else {
      setSideMenuListener(null)
    }
  }, [selectedItem, setSideMenuListener])

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
        setLoading, // ✅ provide setLoading so child components can use it
      }}
    >
      <Grid>
        <Card color="secondary">
          <WinsCrudHeader />
          {selectedItem ? <WinsForm /> : <ListCrud />}
        </Card>
      </Grid>

      {/* Full-page blocking spinner */}
      <FullPageSpinner show={loading} />
    </CrudContext.Provider>
  )
}
