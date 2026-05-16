import React from 'react'
import Grid from 'components/uiKit/grid'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import { textTranslated } from 'components/TextTranslated'

export default function MinMaxContributionInputs(
    {
        errors, selectedItem, updateSeed, setCurrentInfo, readOnly, index,
    }: any,
) {
    return (
        <Grid gap="0.5rem">
            <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
                <InputGroup
                    id="minimumWagerAmount"
                    name="minimumWagerAmount"
                    label="seed-minimumWagerAmount"
                    feedback={errors?.minimumWagerAmount}
                    status={errors?.minimumWagerAmount && 'error'}
                    value={selectedItem?.seeds[index]?.minimumWagerAmount || 0}
                    inputType="number"
                    onChange={({ target }) => updateSeed('minimumWagerAmount', target.value, index)}
                    onFocus={() => setCurrentInfo(textTranslated({ group: 'forms-tabs-helpers', key: 'seed-input-minimumWagerAmount-help', returnDefault: 'nothing' }))}
                    inputProps={{ readOnly }}
                />
            </Grid>
            <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
                <InputGroup
                    id="targetAmount"
                    name="targetAmount"
                    label="max-seed-amount"
                    feedback={errors?.targetAmount}
                    status={errors?.targetAmount && 'error'}
                    value={selectedItem?.seeds[index]?.targetAmount || 0}
                    inputType="number"
                    onChange={({ target }) => updateSeed('targetAmount', target.value, index)}
                    onFocus={() => setCurrentInfo(textTranslated({ group: 'forms-tabs-helpers', key: 'seed-input-targetAmount-help', returnDefault: 'nothing' }))}
                    inputProps={{ readOnly }}
                />
            </Grid>
        </Grid>
    )
}
