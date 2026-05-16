import React from 'react'
import Grid from 'components/uiKit/grid'
import { textTranslated } from 'components/TextTranslated'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import RangeInput from 'components/uiKit/inputs/inputGroup/variants/rangeInput'
import { FormContext } from '..'
import { CrudContext } from '../..'

export default function BasicTab() {
  const { selectedItem } = React.useContext(CrudContext)
  const { errors, updateField, setCurrentInfo } = React.useContext(FormContext)
  return (
    <Grid gap="1.5rem">
      <Grid
        responsiveWidth={{ sm: 100, md: 'calc(50% - 0.75rem)' }}
        gap="1.5rem"
      >
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
            onFocus={() => setCurrentInfo(
              textTranslated({
                group: 'forms-tabs-helpers',
                key: 'input-eventId-help',
                returnDefault: 'nothing',
              }),
            )}
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
            onFocus={() => setCurrentInfo(
              textTranslated({
                group: 'forms-tabs-helpers',
                key: 'input-name-help',
                returnDefault: 'nothing',
              }),
            )}
          />
        </Grid>
        <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.75rem)' }}>
          <RangeInput
            max={100}
            min={0}
            step={0.1}
            id="contributionWeight"
            name="contributionWeight"
            label="contributionWeight"
            feedback={errors?.contributionWeight}
            status={errors?.contributionWeight && 'error'}
            value={selectedItem.contributionWeight}
            onChange={({ target }) => { updateField(target.name, target.value) }}
            onFocus={() => setCurrentInfo(textTranslated({ group: 'forms-tabs-helpers', key: 'input-contributionWeight-help', returnDefault: 'nothing' }))}
          />
        </Grid>
      </Grid>
    </Grid>
  )
}
