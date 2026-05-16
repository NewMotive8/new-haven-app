import React from 'react'
import Grid from 'components/uiKit/grid'
import { textTranslated } from 'components/TextTranslated'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import { CrudContext } from '../..'
import { FormContext } from '..'
import Typography from 'components/uiKit/typography'
import Toggle from 'components/uiKit/inputs/Toggle'

export default function BasicTab() {
    const {
        selectedItem,
    } = React.useContext(CrudContext)
    const {
        errors,
        updateField,
        setCurrentInfo
    } = React.useContext(FormContext)
    return (
        <Grid gap="0.5rem" verticalAlgin='flex-start'>
            <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
                <InputGroup
                    id="brandPlayerId"
                    name="brandPlayerId"
                    label="brandPlayerId"
                    feedback={<Typography {...errors?.brandPlayerId} />}
                    status={errors?.brandPlayerId && 'error'}
                    value={selectedItem?.brandPlayerId}
                    onChange={({ target }) => { updateField(target.name, target.value) }}
                />
            </Grid>
            <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
                <Toggle
                    onChange={({ target }: any) => {
                        updateField(target.name, target.value)
                    }}
                    value={selectedItem.enabled}
                    id="enabled"
                    name="enabled"
                    label="enabled"
                />
            </Grid>
        </Grid>
    )
}
