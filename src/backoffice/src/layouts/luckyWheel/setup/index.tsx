import Card from 'components/cards/card'
import React, { createContext, useState } from 'react'
import { WheelDTO } from 'utils/services/api/requests/luckWheel/wheel'
import LWSetupHeader from './header'
import ListCrud from './list'
import LWSetupForm from './form'

export interface LWSetupContextI {
    selectedItem: WheelDTO,
    setSelectedItem: Function,
}

export const LWSetupContext = createContext<LWSetupContextI>({
    selectedItem: null as any,
    setSelectedItem: () => { },
})

export default function LWSetupLayout() {
    const [selectedItem, setSelectedItem] = useState<WheelDTO>()

    return (
        <LWSetupContext.Provider value={{
            selectedItem: selectedItem as WheelDTO,
            setSelectedItem,
        }}
        >
            <Card color="secondary">
                <LWSetupHeader />
                {selectedItem ? <LWSetupForm /> : <ListCrud />}
            </Card>
        </LWSetupContext.Provider>
    )
}
