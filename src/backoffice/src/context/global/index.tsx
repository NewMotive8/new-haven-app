import React, { createContext, useEffect, useState } from 'react'
import { updateAppSizeVersion } from 'utils/functions/styles'
import { locales } from 'utils/globalTypes'
import { globalContextInterface, globalStateInterface } from './types'

const initialState: globalStateInterface = {
    appSize: 'lg', // default mobile view
    locale: 'EN',
    sideMenuCollapsed: false,
    sideMenuCollapseRequest: 0,
}

const GlobalContext = createContext<globalContextInterface>({
    state: initialState,
    setState: () => { },
    sideMenuListener: null,
    setSideMenuListener: () => { },
})
interface Props {
    children: React.ReactNode,
    locale: locales,
}

export function GlobalProvider({ children, locale }: Props) {
    const [state, setState] = useState(initialState)
    const [sideMenuListener, setSideMenuListener]: any = useState()
    useEffect(() => {
        updateAppSizeVersion({ setState, currentSize: state.appSize })
    }, [state.appSize])

    useEffect(() => {
        setState((old: any) => ({ ...old, locale }))
    }, [locale])
   
    return (
        <GlobalContext.Provider value={{
            state,
            setState,
            sideMenuListener,
            setSideMenuListener,
        }}
        >
            {children}
        </GlobalContext.Provider>
    )
}

export default GlobalContext
