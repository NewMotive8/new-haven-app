import React from 'react'
import Grid from 'components/uiKit/grid'
import RangeInput from 'components/uiKit/inputs/inputGroup/variants/rangeInput'
import { textTranslated } from 'components/TextTranslated'

export default function OperatorContributionInputs({
  pool,
  errors,
  updatePool,
  setCurrentInfo,
  readOnly,
  index,
}: any) {
  return (
    <Grid gap="0.5rem">
      <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
        <RangeInput
          min={0}
          max={100}
          step={0.01}
          id="playerContributionPercent"
          name="playerContributionPercent"
          label="pool-playerContributionPercent"
          feedback={errors?.playerContributionPercent}
          status={errors?.playerContributionPercent && 'error'}
          value={Number(pool?.playerContributionPercent) || 0.0}
          onChange={({ target }) => {
            const { name, value } = target
            if (/^\d+(\.\d{0,2})?$/.test(value)) {
              const parsedValue = parseFloat(value) || 0
              const reactValue = (100 - parsedValue).toFixed(2)

              updatePool(name, value, index)
              updatePool('operatorContribution', reactValue, index)
            }
          }}
          onFocus={() => setCurrentInfo(
              textTranslated({
                group: 'forms-tabs-helpers',
                key: 'pool-input-playerContributionPercent-help',
                returnDefault: 'nothing',
              }),
            )}
          inputProps={{ readOnly }}
        />
      </Grid>
      <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
        <RangeInput
          min={0.1}
          max={100}
          step={0.01}
          id="operatorContribution"
          name="operatorContribution"
          label="pool-operatorContribution"
          feedback={errors?.operatorContribution}
          status={errors?.operatorContribution && 'error'}
          value={
            pool?.operatorContribution
            || (100 - parseFloat(pool?.playerContributionPercent)).toFixed(2)
          }
          onChange={({ target }) => {
            const { name, value } = target
            if (/^\d+(\.\d{0,2})?$/.test(value)) {
              const parsedValue = parseFloat(value) || 0
              const reactValue = (100 - parsedValue).toFixed(2)

              updatePool(name, value, index)
              updatePool('playerContributionPercent', reactValue, index)
            }
          }}
          onFocus={() => setCurrentInfo(
              textTranslated({
                group: 'forms-tabs-helpers',
                key: 'pool-input-operatorContribution-help',
                returnDefault: 'nothing',
              }),
            )}
          inputProps={{ readOnly }}
        />
      </Grid>
    </Grid>
  )
}
