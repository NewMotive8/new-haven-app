import React from 'react'
import Grid from 'components/uiKit/grid'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import RangeInput from 'components/uiKit/inputs/inputGroup/variants/rangeInput'
import { SeedType } from 'utils/services/api/requests/seeds'
import { textTranslated } from 'components/TextTranslated'

export default function ContributionInputs({
    selectedType, errors, selectedItem, updateSeed, setCurrentInfo, readOnly, index,
}: any) {
    return (
        <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
            {selectedType === SeedType.Fixed ? (
                <InputGroup
                    id="contributionAmount"
                    name="contributionAmount"
                    label="seed-contribution-amount-fixed"
                    feedback={errors?.contributionAmount}
                    status={errors?.contributionAmount && 'error'}
                    value={selectedItem?.seeds[index]?.contributionAmount}
                    inputType="number"
                    onChange={({ target }) => updateSeed(target.name, ((target.value)), index)}
                    onFocus={() => setCurrentInfo(textTranslated({ group: 'forms-tabs-helpers', key: 'seed-input-contribution-amount-fixed-help', returnDefault: 'nothing' }))}
                    inputProps={{ readOnly }}
                />
            ) : (
                <RangeInput
                    max={100}
                    min={0}
                    step={0.1}
                    id="contributionAmount"
                    name="contributionAmount"
                    label="seed-contribution-amount-in-percent"
                    feedback={errors?.contributionAmount}
                    status={errors?.contributionAmount && 'error'}
                    value={selectedItem?.seeds[index]?.contributionAmount}
                    onChange={({ target }) => updateSeed(target.name, ((target.value)), index)}
                    onFocus={() => setCurrentInfo(textTranslated({ group: 'forms-tabs-helpers', key: 'seed-input-contribution-amount-percentage-help', returnDefault: 'nothing' }))}
                    inputProps={{ readOnly }}
                />
            )}
        </Grid>
    )
}
