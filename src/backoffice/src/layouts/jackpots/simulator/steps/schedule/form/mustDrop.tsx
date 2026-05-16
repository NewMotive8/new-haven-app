import { textTranslated } from 'components/TextTranslated'
import Grid from 'components/uiKit/grid'
import InputGroup from 'components/uiKit/inputs/inputGroup'

import TypeButton from 'components/uiKit/inputs/TypeButton'
import { SimulatorCrudContext } from 'layouts/jackpots/simulator'
import { useContext, useState } from 'react'

import { Clock } from 'components/clock'
import { mustDropPeriodOptions } from './functionsAndOptions'
import { DropTypesT } from './optionSettings'

export default function MustDropForm() {
  const {
 selectedItem, setCurrentInfo, errors, updateField,
} = useContext(SimulatorCrudContext)
  const readyOnlyData = selectedItem?.id && selectedItem?.mustDropPeriod === 1
  const initialType = selectedItem?.minutesInterval ? 'many' : 'single'
  const [mustDropType, setMustDropType] = useState<DropTypesT>(initialType)
  return (
    <>
      <Grid gap="1rem">
        <Clock />
        <Grid>
          <TypeButton
            name="mustDropPeriod"
            label="mustDropPeriod"
            feedback={errors?.mustDropPeriod}
            status={errors?.mustDropPeriod && 'error'}
            value={selectedItem.mustDropPeriod}
            options={mustDropPeriodOptions}
            onChange={({ target }) => {
              updateField('mustDropPeriod', target.value)
            }}
            onFocus={() => setCurrentInfo(
                textTranslated({
                  group: 'forms-tabs-helpers',
                  key: 'input-mustDropPeriod-help',
                  returnDefault: 'nothing',
                }),
              )}
          />
        </Grid>
        <Grid gap="1rem">
          <Grid hidden={mustDropType !== 'many'} gap="0.5rem">
            <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
              <InputGroup
                id="minutesInterval"
                name="minutesInterval"
                label="minutesInterval"
                inputType="number"
                feedback={errors?.minutesInterval}
                status={errors?.minutesInterval && 'error'}
                value={selectedItem.minutesInterval}
                onChange={({ target }) => {
                  updateField(target.name, target.value)
                }}
                onFocus={() => setCurrentInfo(
                    textTranslated({
                      group: 'forms-tabs-helpers',
                      key: 'input-minutesInterval-help',
                      returnDefault: 'nothing',
                    }),
                  )}
              />
            </Grid>
          </Grid>

          <Grid gap="0.5rem">
            <Grid>
              <InputGroup
                id="startDate"
                name="startDate"
                label="must-drop-startDate"
                inputType="datetime-local"
                feedback={errors?.startDate}
                status={errors?.startDate && 'error'}
                value={selectedItem?.startDate}
                inputProps={{
                  readOnly: readyOnlyData,
                }}
                onChange={({ target }) => {
                  updateField(target.name, target.value)
                }}
                onFocus={() => setCurrentInfo(
                    textTranslated({
                      group: 'forms-tabs-helpers',
                      key: 'input-startDate-must-drop-help',
                      returnDefault: 'nothing',
                    }),
                  )}
              />
            </Grid>

            <Grid>
              <InputGroup
                id="endDate"
                name="endDate"
                label="must-drop-endDate"
                inputType="datetime-local"
                inputProps={{
                  readOnly: readyOnlyData,
                }}
                feedback={errors?.endDate}
                status={errors?.endDate && 'error'}
                value={selectedItem.endDate}
                onChange={({ target }) => {
                  updateField(target.name, target.value)
                }}
                onFocus={() => setCurrentInfo(
                    textTranslated({
                      group: 'forms-tabs-helpers',
                      key: 'input-must-drop-endDate-help',
                      returnDefault: 'nothing',
                    }),
                  )}
              />
            </Grid>
          </Grid>
          <Grid gap="0.5rem">
            <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
              <InputGroup
                id="maximumWins"
                name="maximumWins"
                label="maximumWins"
                feedback={errors?.maximumWins}
                status={errors?.maximumWins && 'error'}
                value={selectedItem.maximumWins || 0}
                onChange={({ target }) => {
                  updateField(target.name, target.value)
                }}
                onFocus={() => setCurrentInfo(
                    textTranslated({
                      group: 'forms-tabs-helpers',
                      key: 'input-maximumWins-help',
                      returnDefault: 'nothing',
                    }),
                  )}
              />
            </Grid>
            <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
              <InputGroup
                id="maximumPayoutAmount"
                name="maximumPayoutAmount"
                label="maximumPayoutAmount"
                feedback={errors?.maximumPayoutAmount}
                status={errors?.maximumPayoutAmount && 'error'}
                value={selectedItem.maximumPayoutAmount || 0}
                onChange={({ target }) => {
                  updateField(target.name, target.value)
                }}
                onFocus={() => setCurrentInfo(
                    textTranslated({
                      group: 'forms-tabs-helpers',
                      key: 'input-maximumPayoutAmount-help',
                      returnDefault: 'nothing',
                    }),
                  )}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  )
}
