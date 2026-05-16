import React from 'react'
import Grid from 'components/uiKit/grid'
import { textTranslated } from 'components/TextTranslated'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import { CrudContext } from '../..'
import { FormContext } from '..'
import Typography from 'components/uiKit/typography'

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
        <Grid gap="0.5rem">
            <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
                <InputGroup
                    id="playerId"
                    name="playerId"
                    label="playerId"
                    feedback={<Typography {...errors?.playerId} />}
                    status={errors?.playerId && 'error'}
                    value={selectedItem?.playerId}
                    onChange={({ target }) => { updateField(target.name, target.value) }}
                    readOnly={true}
                />
            </Grid>
            <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
                <InputGroup
                    id="payoutAmount"
                    name="payoutAmount"
                    label="payoutAmount"
                    feedback={<Typography {...errors?.payoutAmount} />}
                    status={errors?.payoutAmount && 'error'}
                    value={selectedItem?.payoutAmount}
                    onChange={({ target }) => { updateField(target.name, target.value) }}
                />
            </Grid>
        </Grid>
    )
}
