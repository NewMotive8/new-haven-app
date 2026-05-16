import React, { createContext, useContext, useEffect, useState } from 'react'
import GlobalContext from 'context/global'
import Grid from 'components/uiKit/grid'
import Card from 'components/cards/card'
import widgetApi, { widgetI } from 'utils/services/api/requests/jackpot-race-api/widget'
import ListCrud from './list'
import WidgetForm from './form'
import InstanceCrudHeader from './header'
import validateForm from './form/formValidation'
import { toastError } from 'utils/functions/notifications'
import { textTranslated } from 'components/TextTranslated'

export const FormContext = createContext<{
  updateField: (key: keyof widgetI, value: any) => void
}>({
  updateField: () => {},
})

interface CrudContextInterface {
  selectedItem: widgetI | null
  setSelectedItem: React.Dispatch<React.SetStateAction<widgetI | null>>
  submitForm: () => void
  deleteItem: () => void
  refreshState: number
  askRefresh: () => void
  loading: boolean
  spinSprintId?: number
  errors: any
  setErrors: (e: any) => void
}

export const CrudContext = createContext<CrudContextInterface>(
  {} as CrudContextInterface,
)

interface WidgetCrudProps {
  spinSprintId: number
}

export default function WidgetCrud({ spinSprintId }: WidgetCrudProps) {
  const [selectedItem, setSelectedItem] = useState<widgetI | null>(null)
  const [refreshState, setRefreshState] = useState(0)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<any>({})

  const { setSideMenuListener } = useContext(GlobalContext)

  const askRefresh = () => setRefreshState(v => v + 1)

  const deleteItem = () => {
    if (!selectedItem?.id) return
    widgetApi.deleteItem({
      id: selectedItem.id,
      successCallBack: () => {
        askRefresh()
        setSelectedItem(null)
      },
    })
  }

  const submitForm = () => {
    if (!selectedItem) return

    const validation = validateForm(selectedItem)
    if (validation.count) {
      setErrors(validation)
      toastError(
        textTranslated({
          group: 'toast-notifications',
          key: 'something-wrong-with-your-data',
        }),
      )
      return
    }

    setLoading(true)

    const payload: widgetI = {
      ...selectedItem,
      spinSprint: { id: spinSprintId }, // ensure spinSprint id is always included
    }

    widgetApi.submitForm(payload, {
      successCallBack: (updatedWidget?: widgetI) => {
        if (!updatedWidget) return
        askRefresh()
        setSelectedItem({
      ...updatedWidget,
      ...payload
    })
        setLoading(false)
      },
      errorCallBack: () => setLoading(false),
    })
  }

  useEffect(() => {
    setSideMenuListener(
      selectedItem ? { function: () => setSelectedItem(null) } : null,
    )
  }, [selectedItem])

  // function to update a field in selectedItem
  const updateField = (key: keyof widgetI, value: any) => {
    setSelectedItem(prev => {
      if (!prev) return prev
      const updated = { ...prev, [key]: value }
      return updated
    })
  }

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
        spinSprintId,
        errors,
        setErrors,
      }}
    >
      <FormContext.Provider value={{ updateField }}>
        <Grid>
          <Card color="secondary">
            <InstanceCrudHeader />
            {selectedItem ? <WidgetForm /> : <ListCrud />}
          </Card>
        </Grid>
      </FormContext.Provider>
    </CrudContext.Provider>
  )
}
