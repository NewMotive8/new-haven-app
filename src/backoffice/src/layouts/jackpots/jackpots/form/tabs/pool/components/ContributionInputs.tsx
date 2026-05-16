import { textTranslated } from 'components/TextTranslated'
import Grid from 'components/uiKit/grid'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import RangeInput from 'components/uiKit/inputs/inputGroup/variants/rangeInput'
import { PoolType } from 'utils/services/api/requests/pools'

export default function ContributionInputs({
  selectedType,
  errors,
  selectedItem,
  updatePool,
  setCurrentInfo,
  readOnly,
  index,
  isMultiLevel,
}: any) {
  return (
    <Grid gap="0.5rem">
      <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.5rem/2)' }}>
        {selectedType === PoolType.Fixed ? (
          <InputGroup
            id="contributionAmount"
            name="contributionAmount"
            label="pool-contribution-amount-fixed"
            feedback={errors?.contributionAmount}
            status={errors?.contributionAmount && 'error'}
            value={selectedItem?.pools[index]?.contributionAmount || 0}
            onChange={({ target }) => updatePool('contributionAmount', target.value, index)}
            inputType="number"
            onFocus={() => setCurrentInfo(
                textTranslated({
                  group: 'forms-tabs-helpers',
                  key: 'pool-input-contribution-amount-fixed-help',
                  returnDefault: 'nothing',
                }),
              )}
            inputProps={{ readOnly }}
          />
        ) : (
          <RangeInput
            max={100}
            min={0}
            step={0.01}
            id="contributionAmount"
            name="contributionAmount"
            label="pool-contribution-amount-in-percent"
            feedback={errors?.contributionAmount}
            status={errors?.contributionAmount && 'error'}
            value={selectedItem?.pools[index]?.contributionAmount || 0}
            onChange={({ target }) => updatePool('contributionAmount', target.value, index)}
            onFocus={() => setCurrentInfo(
                textTranslated({
                  group: 'forms-tabs-helpers',
                  key: 'pool-input-contribution-amount-percentage-help',
                  returnDefault: 'nothing',
                }),
              )}
            inputProps={{ readOnly }}
          />
        )}
      </Grid>
      <Grid hidden={isMultiLevel} responsiveWidth={{ sm: 100, md: 'calc(50% - 0.5rem/2)' }}>
        <InputGroup
          inputType="number"
          id="currentAmount"
          name="currentAmount"
          label="initial-jackpot-amount"
          feedback={errors?.currentAmount}
          status={errors?.currentAmount && 'error'}
          value={selectedItem?.pools[index]?.currentAmount || 0}
          onChange={({ target }) => {
            updatePool(target.name, target.value)
          }}
          onFocus={() => setCurrentInfo(
              textTranslated({
                group: 'forms-tabs-helpers',
                key: 'input-currentAmount-help',
                returnDefault: 'nothing',
              }),
            )}
          inputProps={{ readOnly: !!selectedItem?.pools[index]?.id }}
        />
      </Grid>
    </Grid>
  )
}
