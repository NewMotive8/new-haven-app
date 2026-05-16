import { textTranslated } from 'components/TextTranslated'
import Grid from 'components/uiKit/grid'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import RangeInput from 'components/uiKit/inputs/inputGroup/variants/rangeInput'
import React from 'react'
import { FormContext } from '../../..'
import { CrudContext } from '../../../..'
import { usePoolForm } from '../../pool/usePool'
import MinMaxContributionInputs from './MinMaxContributionInputs'

export default function MaximumTab() {
  const { selectedItem } = React.useContext(CrudContext)
  const { errors, updateField, setCurrentInfo } = React.useContext(FormContext)
  const { updatePool } = usePoolForm()

  return (
    <Grid gap="2rem">
      <Grid hidden={selectedItem?.type === 'MULTI_LEVEL'} gap="1rem" responsiveWidth={{ sm: 100, md: 'calc(50% - 1rem)' }}>
        <InputGroup
          inputType="number"
          id="maximumWinAmount"
          name="maximumWinAmount"
          label="maximumWinAmount"
          feedback={errors?.maximumWinAmount}
          status={errors?.maximumWinAmount && 'error'}
          value={selectedItem.maximumWinAmount}
          onChange={({ target }) => {
            updateField(target.name, target.value)
          }}
          onFocus={() => setCurrentInfo(
              textTranslated({
                group: 'forms-tabs-helpers',
                key: 'input-maximumWinAmount-help',
                returnDefault: 'nothing',
              }),
            )}
          inputProps={{ readOnly: !!selectedItem.id }}
        />
      </Grid>
      <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 1rem)' }}>
        <InputGroup
          inputType="number"
          id="minimumWinAmount"
          name="minimumWinAmount"
          label="minimumWinAmount"
          feedback={errors?.minimumWinAmount}
          status={errors?.minimumWinAmount && 'error'}
          value={selectedItem.minimumWinAmount}
          onChange={({ target }) => {
            updateField(target.name, target.value)
          }}
          onFocus={() => setCurrentInfo(
              textTranslated({
                group: 'forms-tabs-helpers',
                key: 'input-minimumWinAmount-help',
                returnDefault: 'nothing',
              }),
            )}
          inputProps={{ readOnly: !!selectedItem.id }}
        />
      </Grid>
      <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 1rem)' }}>
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
      <Grid>
        <MinMaxContributionInputs
          errors={errors}
          selectedItem={selectedItem}
          setCurrentInfo={setCurrentInfo}
          readOnly={!!selectedItem.id}
          updateField={updateField}
        />
      </Grid>
    </Grid>
  )
}
