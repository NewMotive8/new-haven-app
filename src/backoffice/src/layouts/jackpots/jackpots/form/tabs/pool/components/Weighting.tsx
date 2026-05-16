import { textTranslated } from 'components/TextTranslated'
import Grid from 'components/uiKit/grid'
import RangeInput from 'components/uiKit/inputs/inputGroup/variants/rangeInput'

export function Weighting({
  errors,
  updatePool,
  setCurrentInfo,
  readOnly,
  currentPool,
  index,
}: any) {
  return (
    <Grid>
        <RangeInput
          min={0.1}
          max={0.99}
          step={0.01}
          id="multiLevelWeight"
          name="multiLevelWeight"
          label="pool-multiLevelWeight"
          feedback={errors?.multiLevelWeight}
          status={errors?.multiLevelWeight && 'error'}
          value={(Number(currentPool?.multiLevelWeight) || 0).toFixed(2)}
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
  )
}
