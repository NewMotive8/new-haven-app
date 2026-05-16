import { breakPointsType } from 'utils/globalTypes'

export type globalStateInterface = {
    appSize: breakPointsType,
    locale: 'EN' | 'ES'
    sideMenuCollapsed: boolean
    sideMenuCollapseRequest?: number
}

interface sideMenuListener {
    function: Function | null
}

export interface globalContextInterface {
    state: globalStateInterface,
    setState: Function
    sideMenuListener: sideMenuListener | null,
    setSideMenuListener: Function
}
