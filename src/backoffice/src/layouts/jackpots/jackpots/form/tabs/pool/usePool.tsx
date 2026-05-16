// ...existing code...
import { useContext, useEffect } from 'react'
import { CrudContext } from 'layouts/jackpots/jackpots'
import poolsApi, { poolsI } from 'utils/services/api/requests/pools'
import { FormContext } from '../..'

export function usePoolForm() {
  const { setErrors } = useContext(FormContext)
  const { selectedItem, setSelectedItem } = useContext(CrudContext)
 
  function updatePool(field: string, value: any, position?: number) {
    setSelectedItem((current: any) => {
      if (
        position !== undefined
        && position >= 0
        && position < current?.pools.length
      ) {
        const updatedPools = [...current.pools]

        updatedPools[position][field] = value
        // name should reflect the tier index
        updatedPools[position].name = `pool-${position}`
        updatedPools[position].multiLevelTier = position

        return {
          ...current,
          pools: updatedPools,
        }
      }
      return {
        ...current,
        pools: current.pools.map((poolItem: any, index: number) => (index === 0 ? { ...poolItem, [field]: value } : poolItem)),
      }
    })
    setErrors((errors: any) => ({ ...errors, [field]: '' }))
  }

  function updatePoolsCommonFields(field: string, value: any) {
    selectedItem?.pools.map((p: poolsI, index: number) => updatePool(field, value, index))
  }

  function addPool() {
    setSelectedItem((current: any) => ({
      ...current,
      pools: [...current.pools, poolsApi.defaultItem],
    }))
  }

  function removePool(index: number) {
    setSelectedItem((current: any) => {
      const newPools = [...current.pools]
      newPools.splice(index, 1)
      return {
        ...current,
        pools: newPools,
      }
    })
  }

  function updateName() {
    setSelectedItem((current: any) => {
      const currentPools = current?.pools
      if (currentPools.length) {
        const newPools = currentPools.map((itenPool: any, index: number) => ({
          ...itenPool,
          // set name from tier index
          name: `pool-${index}`,
          multiLevelTier: index,
        }))
        return {
          ...current,
          pools: newPools,
        }
      }
      return current
    })
  }

  useEffect(() => {
    updateName()
  }, [selectedItem?.id, selectedItem?.internalName])

  return {
    updatePool,
    updatePoolsCommonFields,
    addPool,
    removePool,
  }
}
