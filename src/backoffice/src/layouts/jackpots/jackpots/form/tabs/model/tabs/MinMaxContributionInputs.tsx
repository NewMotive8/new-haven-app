import React from 'react'
import Grid from 'components/uiKit/grid'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import { textTranslated } from 'components/TextTranslated'

export default function MinMaxContributionInputs(
    {
        errors, selectedItem, setCurrentInfo, readOnly,
        updateField,
    }: any,
) {
    return (
        <Grid gap="0.5rem">
            <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
                <InputGroup
                    id="minimumWagerAmount"
                    name="minimumWagerAmount"
                    label="minimumWagerAmount"
                    feedback={errors?.minimumWagerAmount}
                    status={errors?.minimumWagerAmount && 'error'}
                    value={selectedItem?.minimumWagerAmount}
                    inputType="number"
                    onChange={({ target }) => { updateField(target.name, ((target.value))) }}
                    onFocus={() => setCurrentInfo(textTranslated({ group: 'forms-tabs-helpers', key: 'input-minimumWagerAmount-help', returnDefault: 'nothing' }))}
                    inputProps={{ readOnly }}
                />
            </Grid>
            <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
                <InputGroup
                    id="maximumWagerAmount"
                    name="maximumWagerAmount"
                    label="maximumWagerAmount"
                    inputType="number"
                    feedback={errors?.maximumWagerAmount}
                    status={errors?.maximumWagerAmount && 'error'}
                    value={selectedItem?.maximumWagerAmount}
                    onChange={({ target }) => { updateField(target.name, ((target.value))) }}
                    onFocus={() => setCurrentInfo(textTranslated({ group: 'forms-tabs-helpers', key: 'input-maximumWagerAmount-help', returnDefault: 'nothing' }))}
                    inputProps={{ readOnly }}
                />
            </Grid>
        </Grid>
    )
}
