import React from 'react'
import Grid from 'components/uiKit/grid'
import { textTranslated } from 'components/TextTranslated'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import EditorGroup from 'components/uiKit/inputs/Editor'
import { FormContext } from '..'
import { CrudContext } from '../..'

export default function BasicTab() {
  const { selectedItem } = React.useContext(CrudContext)
  const { errors, updateField, setCurrentInfo } = React.useContext(FormContext)
  return (
    <Grid gap="0.5rem">
      <Grid responsiveWidth={{ sm: 100, md: 'calc(100% - 0.25rem)' }}>
        <Grid
          responsiveWidth={{ sm: 100, md: 'calc(100% - 0.25rem)' }}
          gap="0.5rem"
        >
          <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
            <InputGroup
              id="name"
              name="name"
              label="segment-name"
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
          <EditorGroup
            id="description"
            name="description"
            label="description"
            value={selectedItem.description}
            onChange={({ target }: any) => { updateField('description', target.value) }}
          />
        </Grid>
      </Grid>
    </Grid>
  )
}
