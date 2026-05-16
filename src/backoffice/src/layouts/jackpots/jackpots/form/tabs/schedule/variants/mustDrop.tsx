import { textTranslated } from 'components/TextTranslated'
import { Clock } from 'components/clock'
import Grid from 'components/uiKit/grid'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import SelectGroup from 'components/uiKit/inputs/selectGroup'
import React, { useEffect, useState } from 'react'
import { FormContext } from '../../..'
import { CrudContext } from '../../../..'
import { daysOptions, weeklyOptions } from './frequencyOptions'
import { DropTypesT } from './optionSettings'

export default function MustDropScheduleTab() {
  const { selectedItem, setSelectedItem } = React.useContext(CrudContext)
  const {
 errors, updateField, setCurrentInfo, setErrors, validateTab,
} = React.useContext(FormContext)
  const initialType = selectedItem?.minutesInterval ? 'many' : 'single'
  const [mustDropType, setMustDropType] = useState<DropTypesT>(initialType)
  const readyOnlyData = selectedItem?.id && selectedItem?.mustDropPeriod === 1

  function updateFieldDate(field: string, value: any) {
    updateField(field, value)
  }
  function updateWinFrequency(field: string, value: any) {
    setSelectedItem((current: any) => ({
      ...current,
      winFrequency: {
        ...current.winFrequency,
        day:
          field === 'frequency' && value === 'DAILY'
            ? 0
            : current.winFrequency.day,
        [field]: value,
      },
    }))
  }

  useEffect(() => {
    validateTab('recurrence')
  }, [selectedItem])
  return (
    <Grid gap="1rem">
      <Clock />
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
              updateFieldDate(target.name, target.value)
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
              updateFieldDate(target.name, target.value)
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
              updateFieldDate(target.name, target.value)
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

        <Grid
          hidden={
            !(
              selectedItem.mustDropPeriod === 4
              || selectedItem.mustDropPeriod === 3
            )
          }
          responsiveWidth={{ sm: 100, md: 'calc(50% - 0.75rem)' }}
        >
          <Grid>
            <SelectGroup
              label={`frequency-day-mustDrop-${selectedItem.mustDropPeriod}`}
              id="frequency-day"
              name="frequency-day"
              onChange={({ target }) => updateWinFrequency('day', target.value)}
              options={
                selectedItem.mustDropPeriod !== 4 ? weeklyOptions : daysOptions
              }
              value={(
                (selectedItem.mustDropPeriod !== 4
                  ? weeklyOptions
                  : daysOptions) as any
              )?.find((o: any) => o?.value === selectedItem?.winFrequency?.day)}
              feedback={errors?.['winFrequency-day']}
              status={errors?.['winFrequency-day'] && 'error'}
              onFocus={() => setCurrentInfo(
                  textTranslated({
                    group: 'forms-tabs-helpers',
                    key: 'input-contribution-frequency-day-help',
                    returnDefault: 'nothing',
                  }),
                )}
            />
          </Grid>
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
              updateFieldDate(target.name, target.value)
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
              updateFieldDate(target.name, target.value)
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
  )
}
