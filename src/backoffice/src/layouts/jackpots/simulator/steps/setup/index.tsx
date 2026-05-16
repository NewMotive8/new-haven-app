import { textTranslated } from 'components/TextTranslated'
import Grid from 'components/uiKit/grid'
import TypeButton from 'components/uiKit/inputs/TypeButton'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import RangeInput from 'components/uiKit/inputs/inputGroup/variants/rangeInput'
import { useContext } from 'react'
import poolsApi from 'utils/services/api/requests/pools'
import seedsApi from 'utils/services/api/requests/seeds'
import { SimulatorCrudContext } from '../..'
import { options } from './options'

export default function SetupSteps() {
  const {
    selectedItem,
    errors,
    updateField,
    setCurrentInfo,
    rageSimulator,
    setRageSimulator,
  } = useContext(SimulatorCrudContext)
  return (
    <>
      <Grid responsiveWidth={{ sm: 100 }} wrap="nowrap" verticalAlgin="center">
        <TypeButton
          name="type"
          label="jackpot-type"
          value={selectedItem.type}
          onChange={({ target }) => {
            updateField('type', target.value)
            if (target.value === 'MUST_DROP') {
              updateField('model', 3)
              updateField('fixedWinAmount', 0)
              updateField('averageWinAmount', 0)
            }
            if (target.value === 'MULTI_LEVEL') {
              updateField('pools', [poolsApi.defaultItem, poolsApi.defaultItem])
              updateField('seeds', [seedsApi.defaultItem, seedsApi.defaultItem])
            } else {
              updateField('pools', [poolsApi.defaultItem])
              updateField('seeds', [seedsApi.defaultItem])
            }
          }}
          feedback={errors?.jackpotType}
          status={errors?.jackpotType && 'error'}
          options={options}
          onFocus={() => setCurrentInfo(
              textTranslated({
                group: 'forms-tabs-helpers',
                key: 'input-jackpot-type-help',
                returnDefault: 'nothing',
              }),
            )}
        />

        <Grid gap="0.5rem" wrap="wrap">
          <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
            <InputGroup
              id="wager"
              name="wager"
              label="wager"
              feedback={errors?.wager}
              status={errors?.wager && 'error'}
              value={rageSimulator.wager}
              onChange={({ target }) => {
                setRageSimulator((current: any) => ({
                  ...current,
                  wager: target.value,
                }))
              }}
              onFocus={() => setCurrentInfo(
                  textTranslated({
                    group: 'forms-tabs-helpers',
                    key: 'input-wagerAmount-help',
                    returnDefault: 'nothing',
                  }),
                )}
            />
          </Grid>
          <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
            <RangeInput
              min={1000}
              max={10000000}
              step={1}
              id="iterations"
              name="iterations"
              label="iterations"
              feedback={errors?.iterations}
              status={errors?.iterations && 'error'}
              value={rageSimulator.iterations}
              onChange={({ target }) => {
                setRageSimulator((current: any) => ({
                  ...current,
                  iterations: target.value,
                }))
              }}
              onFocus={() => setCurrentInfo(
                  textTranslated({
                    group: 'forms-tabs-helpers',
                    key: 'input-iterations-help',
                    returnDefault: 'nothing',
                  }),
                )}
            />
          </Grid>
        </Grid>
      </Grid>
    </>
  )
}
