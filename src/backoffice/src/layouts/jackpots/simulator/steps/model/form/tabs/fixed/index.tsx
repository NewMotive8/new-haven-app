import { textTranslated } from 'components/TextTranslated'
import Grid from 'components/uiKit/grid'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import RangeInput from 'components/uiKit/inputs/inputGroup/variants/rangeInput'
import { SimulatorCrudContext } from 'layouts/jackpots/simulator'
import { useContext } from 'react'

export default function FixedTab() {
  const {
 selectedItem, errors, updateField, setCurrentInfo,
} = useContext(SimulatorCrudContext)
  return (
    <Grid gap="1rem">
      <Grid gap="1rem" responsiveWidth={{ sm: 100, md: 'calc(50% - 0.5rem)' }}>
        <InputGroup
          inputType="number"
          id="fixedWinAmount"
          name="fixedWinAmount"
          label="fixedWinAmount"
          feedback={errors?.fixedWinAmount}
          status={errors?.fixedWinAmount && 'error'}
          value={selectedItem.fixedWinAmount}
          onChange={({ target }) => {
            updateField(target.name, target.value)
          }}
          onFocus={() => setCurrentInfo(
              textTranslated({
                group: 'forms-tabs-helpers',
                key: 'input-fixedWinAmount-help',
                returnDefault: 'nothing',
              }),
            )}
          inputProps={{ readOnly: !!selectedItem.id }}
        />
      </Grid>
      <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.5rem)' }}>
        <RangeInput
          min={0}
          max={10}
          step={1}
          id="volatility"
          name="volatility"
          label="volatility"
          feedback={errors?.volatility}
          status={errors?.volatility && 'error'}
          value={selectedItem.volatility}
          onChange={({ target }) => {
            updateField(target.name, target.value)
          }}
          onFocus={() => setCurrentInfo(
              textTranslated({
                group: 'forms-tabs-helpers',
                key: 'input-volatility-help',
                returnDefault: 'nothing',
              }),
            )}
          inputProps={{ readOnly: !!selectedItem.id }}
        />
      </Grid>
      <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.5rem)' }}>
        <InputGroup
          id="minimumWagerAmount"
          name="minimumWagerAmount"
          label="minimumWagerAmount"
          feedback={errors?.minimumWagerAmount}
          status={errors?.minimumWagerAmount && 'error'}
          value={selectedItem?.minimumWagerAmount}
          inputType="number"
          onChange={({ target }) => {
            updateField(target.name, target.value)
          }}
          onFocus={() => setCurrentInfo(
              textTranslated({
                group: 'forms-tabs-helpers',
                key: 'input-minimumWagerAmount-help',
                returnDefault: 'nothing',
              }),
            )}
          inputProps={{ readOnly: !!selectedItem.id }}
        />
      </Grid>
      <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.5rem)' }}>
        <InputGroup
          id="maximumWagerAmount"
          name="maximumWagerAmount"
          label="maximumWagerAmount"
          inputType="number"
          feedback={errors?.maximumWagerAmount}
          status={errors?.maximumWagerAmount && 'error'}
          value={selectedItem?.maximumWagerAmount}
          onChange={({ target }) => {
            updateField(target.name, target.value)
          }}
          onFocus={() => setCurrentInfo(
              textTranslated({
                group: 'forms-tabs-helpers',
                key: 'input-maximumWagerAmount-help',
                returnDefault: 'nothing',
              }),
            )}
          inputProps={{ readOnly: !!selectedItem.id }}
        />
      </Grid>
    </Grid>
  )
}
