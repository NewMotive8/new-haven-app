import React, { useContext } from 'react'
import Grid from 'components/uiKit/grid'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import { CrudContext } from '../..'
import { FormContext } from '../index'
import Toggle from 'components/uiKit/inputs/Toggle'

export default function BasicTab() {
  const { selectedItem } = useContext(CrudContext)
  const { updateField } = useContext(FormContext)

  if (!selectedItem) return null

  return (
    <Grid gap="1rem">
      <InputGroup
        label="Locale"
        value={selectedItem.locale ?? ''}
        onChange={e => updateField('locale', e.target.value)}
        name="locale"
        id="locale"
      />

      <InputGroup
        label="Header Text"
        value={selectedItem.headerText ?? ''}
        onChange={e => updateField('headerText', e.target.value)}
        name="headerText"
        id="headerText"
      />

      <InputGroup
        label="Header Style"
        value={selectedItem.headerStyle ?? ''}
        onChange={e => updateField('headerStyle', e.target.value)}
        name="headerStyle"
        id="headerStyle"
        inputType='textarea'
      />

      <InputGroup
        label="Start Text"
        value={selectedItem.startText ?? ''}
        onChange={e => updateField('startText', e.target.value)}
        name="startText"
        id="startText"
      />

      <InputGroup
        label="End Text"
        value={selectedItem.endText ?? ''}
        onChange={e => updateField('endText', e.target.value)}
        name="endText"
        id="endText"
      />

      <InputGroup
        label="Background RGB"
        value={selectedItem.backgroundRGB ?? ''}
        onChange={e => updateField('backgroundRGB', e.target.value)}
        name="backgroundRGB"
        id="backgroundRGB"
      />

      <InputGroup
        label="Winning Background RGB"
        value={selectedItem.winningBackgroundRGB ?? ''}
        onChange={e => updateField('winningBackgroundRGB', e.target.value)}
        name="winningBackgroundRGB"
        id="winningBackgroundRGB"
      />

      <InputGroup
        label="Winning Animation"
        value={selectedItem.winningAnimation ?? ''}
        onChange={e => updateField('winningAnimation', e.target.value)}
        name="winningAnimation"
        id="winningAnimation"
      />

     <InputGroup
  label="Terms & Conditions"
  value={selectedItem.termsAndConditions ?? ''}
  onChange={e => updateField('termsAndConditions', e.target.value)}
  name="termsAndConditions"
        id="termsAndConditions"
        inputType='textarea'
/>
  <Toggle
        label="T&C is link"
        value={!!selectedItem.tcsIsLink}
        id="tcsIsLink"
        name="tcsIsLink"
        onChange={({ target }) => updateField(target.name, target.value)}
      />
    </Grid>
  )
}
