import Grid from 'components/uiKit/grid'
import TypeButton from 'components/uiKit/inputs/TypeButton'
import React from 'react'
import { FormContext } from '../../..'
import { CrudContext } from '../../../..'

import { options } from './optionSettings'

export default function MustDropScheduleTab() {
  const { selectedItem } = React.useContext(CrudContext)
  const { updateField, setCurrentInfo, validateTab } = React.useContext(FormContext)

  function updateMustDrop(field: string, value: any) {
    updateField(field, value)
    validateTab('recurrence')
  }

  return (
    <Grid gap="1rem">
      <Grid gap="0.5rem">
        <TypeButton
          // readOnly={selectedItem?.id} // let users edit to keep old jackpot compatible, this will be removed in few releases
          name="mustDropPeriod"
          onChange={({ target }) => updateMustDrop('mustDropPeriod', target.value)}
          options={options({ setCurrentInfo })}
          value={selectedItem.mustDropPeriod}
        />
      </Grid>
    </Grid>
  )
}
