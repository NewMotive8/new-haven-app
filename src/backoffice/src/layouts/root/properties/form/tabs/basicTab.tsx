import React from 'react'
import Grid from 'components/uiKit/grid'
import { textTranslated } from 'components/TextTranslated'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import Toggle from 'components/uiKit/inputs/Toggle'
import { CrudContext } from '../..'
import { FormContext } from '..'

export default function BasicTab() {
  const { selectedItem } = React.useContext(CrudContext)
  const { errors, updateField, setCurrentInfo } = React.useContext(FormContext)
  return (
    <Grid gap="0.5rem" verticalAlgin="flex-start">
      <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
        <InputGroup
          id="name"
          name="name"
          label="property-name"
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
      <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
        <InputGroup
          id="value"
          name="value"
          label="value"
          feedback={errors?.value}
          status={errors?.value && 'error'}
          value={selectedItem.value}
          onChange={({ target }) => {
            updateField(target.name, target.value)
          }}
          onFocus={() => setCurrentInfo(
              textTranslated({
                group: 'forms-tabs-helpers',
                key: 'input-value-help',
                returnDefault: 'nothing',
              }),
            )}
        />
      </Grid>
      <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
        <InputGroup
          id="startDate"
          name="startDate"
          label="property-startDate"
          inputType="date"
          readOnly
          feedback={errors?.startDate}
          status={errors?.startDate && 'error'}
          value={selectedItem.startDate?.substring(0, 10) || ''}
          onChange={({ target }) => {
            updateField(target.name, target.value)
          }}
          onFocus={() => setCurrentInfo(
              textTranslated({
                group: 'forms-tabs-helpers',
                key: 'input-startDate-property-help',
                returnDefault: 'nothing',
              }),
            )}
        />
      </Grid>
      <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
        <InputGroup
          id="endDate"
          name="endDate"
          label="property-endDate"
          inputType="date"
          readOnly
          feedback={errors?.endDate}
          status={errors?.endDate && 'error'}
          value={selectedItem.endDate?.substring(0, 10) || ''}
          onChange={({ target }) => {
            updateField(target.name, target.value)
          }}
          onFocus={() => setCurrentInfo(
              textTranslated({
                group: 'forms-tabs-helpers',
                key: 'input-property-endDate-help',
                returnDefault: 'nothing',
              }),
            )}
        />
      </Grid>
      <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
        <Toggle
          label="enabled"
          name="enabled"
          id="enabled"
          value={selectedItem.enabled}
          onChange={({ target }) => {
            updateField(target.name, target.value)
          }}
        />
      </Grid>
    </Grid>
  )
}
