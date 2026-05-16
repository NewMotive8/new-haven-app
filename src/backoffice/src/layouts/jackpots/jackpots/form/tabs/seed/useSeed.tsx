// ...existing code...
import { useContext, useEffect } from 'react'
import { CrudContext } from 'layouts/jackpots/jackpots'
import seedsApi, { seedsI } from 'utils/services/api/requests/seeds'
import { FormContext } from '../..'

export function useSeedForm() {
  const { setErrors } = useContext(FormContext)
  const { selectedItem, setSelectedItem } = useContext(CrudContext)

  function updateSeed(field: string, value: any, position?: number) {
    setSelectedItem((current: any) => {
      if (
        position !== undefined
        && position >= 0
        && position < current?.seeds.length
      ) {
        const updatedSeeds = [...current.seeds]

        updatedSeeds[position] = {
          ...updatedSeeds[position],
          [field]: value,
          // name should reflect the tier index
          name: `seed-${position}`,
          multiLevelTier: position,
        }

        return {
          ...current,
          seeds: updatedSeeds,
        }
      }
      return {
        ...current,
        seeds: current.seeds.map((seedItem: any, index: number) => (index === 0 ? { ...seedItem, [field]: value } : seedItem)),
      }
    })
    setErrors((errors: any) => ({ ...errors, [field]: '' }))
  }

  function updateSeedsCommonFields(field: string, value: any) {
    selectedItem?.seeds?.forEach((s: seedsI, index: number) => updateSeed(field, value, index))
  }

  function addSeed() {
    setSelectedItem((current: any) => ({
      ...current,
      seeds: [...current.seeds, seedsApi.defaultItem],
    }))
  }

  function removeSeed(index: number) {
    setSelectedItem((current: any) => {
      const newSeeds = [...current.seeds]
      newSeeds.splice(index, 1)
      return {
        ...current,
        seeds: newSeeds,
      }
    })
  }

  function updateName() {
    setSelectedItem((current: any) => {
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
    if (selectedItem?.pools?.length > (selectedItem?.seeds?.length ?? 0)) {
      setSelectedItem((current: any) => {
        const newSeeds = [...(current.seeds || [])]
        for (let i = 0; i < (selectedItem?.pools?.length ?? 0); i += 1) {
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
  }, [selectedItem?.pools?.length])

  useEffect(() => {
    updateName()
  }, [selectedItem?.pools?.length, selectedItem?.id])

  return {
    updateSeed,
    updateSeedsCommonFields,
    addSeed,
    removeSeed,
  }
}
