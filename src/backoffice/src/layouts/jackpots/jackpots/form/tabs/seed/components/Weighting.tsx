import { textTranslated } from 'components/TextTranslated'
import Grid from 'components/uiKit/grid'
import RangeInput from 'components/uiKit/inputs/inputGroup/variants/rangeInput'

export function Weighting({
  errors,
  updatePool,
  setCurrentInfo,
  readOnly,
  currentSeed,
  index,
}: any) {
  return (
    <Grid gap="0.5rem">
      <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
        <RangeInput
          min={0.1}
          max={0.99}
          step={0.01}
          id="multiLevelWeight"
          name="multiLevelWeight"
          label="pool-multiLevelWeight"
          feedback={errors?.multiLevelWeight}
          status={errors?.multiLevelWeight && 'error'}
          value={currentSeed?.multiLevelWeight || 0}
          onChange={({ target }) => {
            updatePool(target.name, target.value, index)
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
    </Grid>
  )
}
