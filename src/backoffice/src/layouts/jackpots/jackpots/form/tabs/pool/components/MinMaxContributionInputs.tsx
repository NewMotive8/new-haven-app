import React from 'react'
import Grid from 'components/uiKit/grid'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import { textTranslated } from 'components/TextTranslated'

export default function MinMaxContributionInputs(
    {
        errors, selectedItem, updatePool, setCurrentInfo, readOnly, index,
    }: any,
) {
    return (
        <Grid gap="0.5rem">
            <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
                <InputGroup
                    id="minimumWagerAmount"
                    name="minimumWagerAmount"
                    label="pool-minimumWagerAmount"
                    feedback={errors?.minimumWagerAmount}
                    status={errors?.minimumWagerAmount && 'error'}
                    value={selectedItem?.pools[index]?.minimumWagerAmount}
                    inputType="number"
                    onChange={({ target }) => { updatePool(target.name, ((target.value))) }}
                    onFocus={() => setCurrentInfo(textTranslated({ group: 'forms-tabs-helpers', key: 'pool-input-minimumWagerAmount-help', returnDefault: 'nothing' }))}
                    inputProps={{ readOnly }}
                />
            </Grid>
            <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
                <InputGroup
                    id="maximumWagerAmount"
                    name="maximumWagerAmount"
                    label="pool-maximumWagerAmount"
                    inputType="number"
                    feedback={errors?.maximumWagerAmount}
                    status={errors?.maximumWagerAmount && 'error'}
                    value={selectedItem?.pools[index]?.maximumWagerAmount}
                    onChange={({ target }) => { updatePool(target.name, ((target.value))) }}
                    onFocus={() => setCurrentInfo(textTranslated({ group: 'forms-tabs-helpers', key: 'pool-input-maximumWagerAmount-help', returnDefault: 'nothing' }))}
                    inputProps={{ readOnly }}
                />
            </Grid>
        </Grid>
    )
}
