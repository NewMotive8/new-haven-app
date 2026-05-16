import Card from 'components/cards/card'
import Grid from 'components/uiKit/grid'
import AuthContext from 'context/auth'
import BrandContext from 'context/brand'
import GlobalContext from 'context/global'
import React, {
 createContext, useContext, useEffect, useState,
} from 'react'
import { useQuery } from 'react-query'
import { defaultTranslationsI } from 'utils/services/api/requests/defaultTranslations'
import jackpotsApi, { jackpotsI } from 'utils/services/api/requests/jackpots'
import translationsJPApi from 'utils/services/api/requests/translationsJP'
import JackpotsForm from './form'
import JackpotsCrudHeader from './header'
import ListCrud from './list'

interface CrudContextInterface {
  selectedItem: jackpotsI | any
  setSelectedItem: Function
  submitForm: Function
  deleteItem: Function
  refreshState?: number
  askRefresh?: Function
  loading?: boolean
  pushAction: (newAction: actionI) => void
  removeActionById: (actionId: string) => void
  jackpotTranslations: defaultTranslationsI[]
  setJackpotTranslations: React.Dispatch<
    React.SetStateAction<defaultTranslationsI[]>
  >
}

export const CrudContext = createContext<CrudContextInterface>({
  selectedItem: null,
  setSelectedItem: () => {},
  submitForm: () => {},
  deleteItem: () => {},
  refreshState: 0,
  askRefresh: () => {},
  loading: false,
  pushAction: () => {},
  removeActionById: () => {},
  jackpotTranslations: [],
  setJackpotTranslations: () => {},
})

interface actionI {
  id: string
  action: Function
}

export default function JackpotsCrud() {
  const [loading, setLoading] = useState(false)
  const [selectedItem, setSelectedItem] = useState<jackpotsI | null>(null)
  const [refreshState, setRefreshState] = useState(0)
  const [actionsAfterSubmit, setActionsAfterSubmit] = useState<actionI[]>()
  const { isAuthenticated, token } = React.useContext(AuthContext)
  const [jackpotTranslations, setJackpotTranslations] = useState<
    defaultTranslationsI[]
  >([])
  const { brandId } = useContext(BrandContext)
  const {
    data: defaultTranslations,
    isLoading,
    error,
  } = useQuery(
    [`default-translations-${brandId}`, token],
    () => translationsJPApi.getDefaultTranslations(),
    {
      enabled: !!isAuthenticated,
    },
  )
  // const storedDataTest = localStorage.getItem('simulator')
  // if (storedDataTest) {
  //   console.log(JSON.parse(storedDataTest))
  // }
  // useEffect(() => {
  //   const storedDataTest = localStorage.getItem('simulator')
  //   if (storedDataTest) {
  //     const value = JSON.parse(storedDataTest) as any
  //     console.log({ value })
  //     setSelectedItem(value)
  //   }
  // }, [])
  useEffect(() => {
    if (defaultTranslations?.length && !jackpotTranslations?.length) {
      setJackpotTranslations(
        defaultTranslations.map((item: any) => ({ ...item, id: null })),
      )
    }
  }, [defaultTranslations])

  function askRefresh() {
    setRefreshState((current) => 1 + current)
  }

  const pushAction = (newAction: actionI) => {
    setActionsAfterSubmit((prevActions: any) => [...prevActions, newAction])
  }

  const removeActionById = (actionId: string) => {
    setActionsAfterSubmit((prevActions: any) => prevActions.filter((action: actionI) => action.id !== actionId))
  }

  function deleteItem() {
    jackpotsApi.deleteItem({
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
    // localStorage.removeItem('simulator')
    jackpotsApi.submitForm(selectedItem as jackpotsI, {
      successCallBack: (res: any) => {
        askRefresh()
        if (!selectedItem?.id) {
          setSelectedItem((current: any) => ({ ...current, id: res.id }))
          translationsJPApi
            .submitForm(
              'post',
              jackpotTranslations.map((item) => ({ ...item, jackpot: res })),
              { silent: true },
            )
            .then(() => {
              setSelectedItem(null)
              setLoading(false)
            })
            .catch(() => {
              setSelectedItem(null)
              setLoading(false)
            })
        } else {
          setLoading(false)
        }
        actionsAfterSubmit?.forEach((action: actionI) => {
          if (typeof action?.action === 'function') {
            action.action(res)
          }
        })
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
        pushAction,
        removeActionById,
        jackpotTranslations,
        setJackpotTranslations,
      }}
    >
      <Grid>
        <Card color="secondary">
          <JackpotsCrudHeader />
          {selectedItem ? <JackpotsForm /> : <ListCrud />}
        </Card>
      </Grid>
    </CrudContext.Provider>
  )
}
