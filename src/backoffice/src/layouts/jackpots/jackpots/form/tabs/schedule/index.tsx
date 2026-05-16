import React, { useEffect } from 'react'
import { JackpotI } from 'utils/services/api/requests/jackpots/types'
import { FormContext } from '../..'
import { CrudContext } from '../../..'
import ClassicScheduleTab from './variants/classic'
import FrequencyScheduleTab from './variants/frequency'
import MustDropScheduleTab from './variants/mustDrop'

interface thisCrudContext {
  selectedItem: JackpotI
}

export default function ScheduleTab() {
  const { selectedItem } = React.useContext(CrudContext) as thisCrudContext
  const { validateTab } = React.useContext(FormContext)
  useEffect(() => {
    validateTab('schedule')
  }, [selectedItem])

  if (selectedItem.type === 'MUST_DROP') {
    return <MustDropScheduleTab />
  }

  if (selectedItem.type === 'FREQUENCY') {
    return <FrequencyScheduleTab />
  }
  // type CLASSIC like default
  return <ClassicScheduleTab />
}
