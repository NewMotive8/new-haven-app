import React from 'react'
import Grid from 'components/uiKit/grid'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import { FormContext } from '..'
import { CrudContext } from '../..'

export default function BasicTab() {
  const { selectedItem } = React.useContext(CrudContext)
  const { errors, updateField } = React.useContext(FormContext)

  return (
    <Grid gap="1.5rem">
      <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.75rem)' }} gap="1.5rem">
        <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.75rem)' }}>
          <InputGroup
            id="eventId"
            name="eventId"
            label="eventId"
            feedback={errors?.eventId}
            status={errors?.eventId && 'error'}
            value={selectedItem.eventId}
            onChange={({ target }) => {
              updateField(target.name, target.value)
            }}
          />
        </Grid>
        <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.75rem)' }}>
          <InputGroup
            id="name"
            name="name"
            label="event-name"
            feedback={errors?.name}
            status={errors?.name && 'error'}
            value={selectedItem.name}
            onChange={({ target }) => {
              updateField(target.name, target.value)
            }}
          />
        </Grid>
      </Grid>
    </Grid>
  )
}
