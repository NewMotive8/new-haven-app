import React, {
 createContext, useContext, useState, useEffect,
} from 'react'
import GlobalContext from 'context/global'
import Grid from 'components/uiKit/grid'
import Card from 'components/cards/card'
import playersApi, { playersI } from 'utils/services/api/requests/players'
import ListCrud from './list'
import PlayersForm from './form'
import PlayersCrudHeader from './header'

export interface FooterStatus {
  isDelete: boolean;
  isCancel: boolean;
  isSave: boolean;
}
interface CrudContextInterface {
  selectedItem: any;
  setSelectedItem: Function;
  submitForm: Function;
  deleteItem: Function;
  refreshState?: number;
  askRefresh?: Function;
  loading?: boolean;
  optionsFooter?: FooterStatus;
  handelerOptionSet: (option: FooterStatus) => void;
}

export const CrudContext = createContext<CrudContextInterface>({
  selectedItem: null,
  setSelectedItem: () => {},
  submitForm: () => {},
  deleteItem: () => {},
  refreshState: 0,
  askRefresh: () => {},
  loading: false,
  optionsFooter: {
    isDelete: true,
    isCancel: true,
    isSave: true,
  },
  handelerOptionSet: () => {},
})

export default function PlayersCrud() {
  const [loading, setLoading] = useState(false)
  const [selectedItem, setSelectedItem] = useState<playersI | null>(null)
  const [refreshState, setRefreshState] = useState(0)
  const [optionsFooter, setOptionsFooter] = useState<FooterStatus>({
    isDelete: true,
    isCancel: true,
    isSave: true,
  })

  function askRefresh() {
    setRefreshState((current) => 1 + current)
  }
  function handelerOptionSet(option: FooterStatus) {
    setOptionsFooter({ ...optionsFooter, ...option })
  }
  function deleteItem() {
    playersApi.deleteItem({
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
    playersApi.submitForm(selectedItem as playersI, {
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
        optionsFooter,
        handelerOptionSet,
      }}
    >
      <Grid>
        <Card color="secondary">
          <PlayersCrudHeader />
          {selectedItem ? <PlayersForm /> : <ListCrud />}
        </Card>
      </Grid>
    </CrudContext.Provider>
  )
}
