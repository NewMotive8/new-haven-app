import { useEffect } from 'react'
import { useQuery } from 'react-query'
import poolsApi from 'utils/services/api/requests/pools'
import seedsApi from 'utils/services/api/requests/seeds'

// Custom hook for fetching pool by ID
export function usePoolById(poolId: number) {
    return useQuery(['pool', poolId], () => poolsApi.getItemsById(poolId), {
        enabled: !!poolId,
    })
}

// Custom hook for fetching seed by ID
export function useSeedById(seedId: number) {
    return useQuery(['seed', seedId], () => seedsApi.getItemsById(seedId), {
        enabled: !!seedId,
    })
}

export function useJackpotData({
    selectedItem,
    setSelectedItem,
    fetchInitialData,
    setFetchInitialData,
    currentBrand,
}: any): void {
    const poolId = selectedItem.pools?.[0]?.id
    const seedId = selectedItem.seeds?.[0]?.id

    const { data: poolResponse, isLoading: isPoolLoading } = usePoolById(poolId)
    const { data: seedResponse, isLoading: isSeedLoading } = useSeedById(seedId)

    async function getInitialData() {
        const model = selectedItem.id ? selectedItem.model || selectedItem.fixedWinAmount ? 1
            : selectedItem.averageWinAmount ? 2 : 3 : 1

        const updatedPools = poolId
            ? [poolResponse, ...selectedItem.pools.slice(1)]
            : [poolsApi.defaultItem]
        const updatedSeeds = seedId
            ? [seedResponse, ...selectedItem.seeds.slice(1)]
            : [seedsApi.defaultItem]

        const jackpotInfo = {
            ...selectedItem,
            pools: updatedPools,
            seeds: updatedSeeds,
            model,
            brand: currentBrand,
            pushDelay: currentBrand.pushDelay,
        }

        setSelectedItem(jackpotInfo)
        setFetchInitialData({
            initialData: jackpotInfo,
            isFetched: true,
            loading: false,
        })
    }

    useEffect(() => {
        if (!fetchInitialData.isFetched && !isPoolLoading && !isSeedLoading) {
            getInitialData()
        }
    }, [fetchInitialData, isPoolLoading, isSeedLoading, selectedItem, setSelectedItem, setFetchInitialData])
}
