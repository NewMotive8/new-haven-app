// ...existing code...
import { useContext, useEffect } from 'react'
import seedsApi, { seedsI } from 'utils/services/api/requests/seeds'
import { SimulatorCrudContext } from '../..'

export function useSeedForm(data: any, handlerData: any) {
  const { setErrors } = useContext(SimulatorCrudContext)

  function updateSeed(field: string, value: any, position?: number) {
    handlerData((current: any) => {
      if (
        position !== undefined
        && position >= 0
        && position < current?.seeds.length
      ) {
        const updatedSeeds = [...current.seeds]

        updatedSeeds[position] = {
          ...updatedSeeds[position],
          [field]: value,
          // name must reflect the tier index
          name: `seed-${position}`,
          multiLevelTier: position,
        }

        return {
          ...current,
          seeds: updatedSeeds,
        }
      }

      // preserve prior behavior for no-position case
      return {
        ...current,
        seeds: current.seeds.map((seedItem: any, index: number) => (index === 0 ? { ...seedItem, [field]: value } : seedItem)),
      }
    })
    setErrors((err: any) => ({ ...err, [field]: '' }))
  }

  function addSeed() {
    handlerData((current: any) => ({
      ...current,
      seeds: [...current.seeds, seedsApi.defaultItem],
    }))
  }

  function removeSeed(index: number) {
    handlerData((current: any) => {
      const newSeeds = [...current.seeds]
      newSeeds.splice(index, 1)
      return {
        ...current,
        seeds: newSeeds,
      }
    })
  }

  function updateSeedsCommonFields(field: string, value: any) {
    data?.seeds?.forEach((p: seedsI, index: number) => updateSeed(field, value, index))
  }

  function updateName() {
    handlerData((current: any) => {
      const currentSeeds = current?.seeds
      if (currentSeeds?.length) {
        const newSeeds = currentSeeds.map((itemSeed: any, index: number) => ({
          ...itemSeed,
          name: `seed-${index}`,
          multiLevelTier: index,
        }))
        return {
          ...current,
          seeds: newSeeds,
        }
      }
      return current
    })
  }

  useEffect(() => {
    if (data?.pools?.length > (data?.seeds?.length ?? 0)) {
      handlerData((current: any) => {
        const newSeeds = [...(current.seeds || [])]
        for (let i = 0; i < (data?.pools?.length ?? 0); i += 1) {
          if (!newSeeds[i]) {
            newSeeds[i] = {
              ...seedsApi.defaultItem,
              name: `seed-${i}`,
              multiLevelTier: i,
            }
          }
        }
        return {
          ...current,
          seeds: newSeeds,
        }
      })
    }
  }, [data?.pools?.length])

  useEffect(() => {
    updateName()
  }, [data?.id])

  return {
    updateSeed,
    updateSeedsCommonFields,
    addSeed,
    removeSeed,
  }
}
