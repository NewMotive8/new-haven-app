// ...existing code...
import { useContext, useEffect } from 'react'
import poolsApi, { poolsI } from 'utils/services/api/requests/pools'
import { SimulatorCrudContext } from '../..'

export function usePoolForm(data: any, handlerData: any) {
  const { setErrors } = useContext(SimulatorCrudContext)

 function updatePool(field: string, value: any, position?: number) {
  handlerData((current: any) => {
    if (
      position !== undefined &&
      position >= 0 &&
      position < current?.pools.length
    ) {
      const updatedPools = [...current.pools]

      updatedPools[position] = {
        ...updatedPools[position],
        [field]: value,
        // Automatically copy to targetAmount if it's averageAmount or maximumAmount
        ...(field === 'maximumAmount' || field === 'averageAmount'
          ? { targetAmount: Number(value) }
          : {}),
        // name must be pool-{tier}
        name: `pool-${position}`,
        multiLevelTier: position,
      }

      return {
        ...current,
        pools: updatedPools,
      }
    }

    // If no position is specified, update all pools (common fields)
    return {
      ...current,
      pools: current.pools.map((poolItem: any) => ({
        ...poolItem,
        [field]: value,
        ...(field === 'maximumAmount' || field === 'averageAmount'
          ? { targetAmount: Number(value) }
          : {}),
      })),
    }
  })

  setErrors((err: any) => ({ ...err, [field]: '' }))
}


  function updatePoolsCommonFields(field: string, value: any) {
    data?.pools?.forEach((p: poolsI, index: number) => updatePool(field, value, index))
  }

  function addPool() {
    handlerData((current: any) => ({
      ...current,
      pools: [...current.pools, poolsApi.defaultItem],
    }))
  }

  function removePool(index: number) {
    handlerData((current: any) => {
      const newPools = [...current.pools]
      newPools.splice(index, 1)
      return {
        ...current,
        pools: newPools,
      }
    })
  }

  function updateName() {
    handlerData((current: any) => {
      const currentPools = current?.pools
      if (currentPools?.length) {
        const newPools = currentPools.map((itenPool: any, index: number) => ({
          ...itenPool,
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
  }, [data?.id])

  return {
    updatePool,
    updatePoolsCommonFields,
    addPool,
    removePool,
  }
}
