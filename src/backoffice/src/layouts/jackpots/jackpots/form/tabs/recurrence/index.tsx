import React, { useEffect } from 'react'
import { JackpotI } from 'utils/services/api/requests/jackpots/types'
import { FormContext } from '../..'
import { CrudContext } from '../../..'
import MustDropScheduleTab from './variants/mustDrop'

interface thisCrudContext {
    selectedItem: JackpotI
}

export default function RecurrenceTab() {
    const { selectedItem } = React.useContext(CrudContext) as thisCrudContext
    const { validateTab, errors } = React.useContext(FormContext)

    useEffect(() => {
        validateTab('recurrence')
    }, [selectedItem.mustDropPeriod])

    return <MustDropScheduleTab />
}
