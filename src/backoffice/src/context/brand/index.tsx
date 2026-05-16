import React, { useContext, useState, useEffect } from 'react'
import BrandSelector from 'components/selectors/brand'
import AuthContext from 'context/auth'
import { externalDialogCall } from 'context/dialog'
import { globalData, queryClient } from 'pages/_app'
import { api } from 'utils/services/api'
import brandApi, { brandI } from 'utils/services/api/requests/brand'
import { useQuery } from 'react-query'
import { useAccountInfo } from 'utils/customHooks/useRole'
import { useRouter } from 'next/router'
import GlobalContext from 'context/global'

// Brand context interface definition for improved type accuracy
interface BrandContextI {
    brandId?: number;
    currentBrand?: brandI;
    setCurrentBrand: (brand: brandI) => void;
    refreshBrand: Function;
}

// Creating brand context with default values
const BrandContext = React.createContext<BrandContextI>({
    setCurrentBrand: () => { },
    refreshBrand: () => { },
})

interface Props {
    children: React.ReactNode
}

export function BrandProvider({ children }: Props) {
    const { isAuthenticated, token } = useContext(AuthContext)
    const { brands: userBrands } = useAccountInfo()
    const [currentBrand, setCurrentBrand] = useState<brandI>()
    const { data, refetch } = useQuery(['all-brands', token], () => brandApi.getItems({ page: 0, size: 1000 }), {
        enabled: !!isAuthenticated,
    })
    const router = useRouter()
    const { setState: setGlobalState } = React.useContext(GlobalContext)

    const updateBrandInfo = (newBrand: brandI) => {
        sessionStorage.setItem('jooba.bo.brand', JSON.stringify(newBrand))
        api.defaults.headers.common.brandId = newBrand?.id || null
        api.defaults.headers.brandId = newBrand?.id || null
        queryClient.refetchQueries()
    }

    const handleBrandChange = (newBrand: brandI) => {
        setCurrentBrand(newBrand)
        externalDialogCall.removeDialog('BRAND-SELECTOR')
        updateBrandInfo(newBrand)
        router.push('/')
        if (setGlobalState) {
            setGlobalState((old: any) => ({ ...old, sideMenuCollapseRequest: (old?.sideMenuCollapseRequest || 0) + 1 }))
        }
    }

    

    useEffect(() => {
        if (isAuthenticated && !currentBrand) {
            const savedBrand = sessionStorage.getItem('jooba.bo.brand')
            if (savedBrand) {
                const parsedBrand: brandI = JSON.parse(savedBrand)
                setCurrentBrand(parsedBrand)
                updateBrandInfo(parsedBrand)
            } else {
                externalDialogCall.displayDialog({
                    dialogId: 'BRAND-SELECTOR',
                    content: <BrandSelector onChange={handleBrandChange} />,
                    dialogProps: {
                        // disableOverlayClose: true,
                        displayClose: false,
                    },
                })
            }
        }
        if (!isAuthenticated) {
            setCurrentBrand(null as any)
        }
    }, [isAuthenticated, currentBrand])

    useEffect(() => {
        if (currentBrand) {
            globalData.brandId = currentBrand.id || 0
        }
    }, [currentBrand])

    useEffect(() => {
        const hasBrandOnData = (data?.content || [] as Array<brandI>)?.find((brand: brandI) => brand.id === currentBrand?.id)
        if (hasBrandOnData) {
            setCurrentBrand(hasBrandOnData)
        }
    }, [data])

    useEffect(() => {
        if (userBrands?.length && !currentBrand) {
            handleBrandChange(userBrands[0])
        }
    }, [userBrands])

    return (
        <BrandContext.Provider
            value={{
                currentBrand,
                setCurrentBrand: handleBrandChange,
                brandId: currentBrand?.id,
                refreshBrand: () => { refetch() },

            }}
        >
            {children}
        </BrandContext.Provider>
    )
}

export default BrandContext
