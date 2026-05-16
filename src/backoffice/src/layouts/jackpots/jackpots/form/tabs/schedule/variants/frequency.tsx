import { textTranslated } from 'components/TextTranslated'
import { Clock } from 'components/clock'
import Grid from 'components/uiKit/grid'
import TypeButton from 'components/uiKit/inputs/TypeButton'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import SelectGroup from 'components/uiKit/inputs/selectGroup'
import Typography from 'components/uiKit/typography'
import React, { useState } from 'react'
import { JackpotI } from 'utils/services/api/requests/jackpots/types'
import { FormContext } from '../../..'
import { CrudContext } from '../../../..'
import {
    daysOptions,
    frequencyOptions,
    weeklyOptions,
} from './frequencyOptions'

function areFrequenciesEqual({
  winFrequency,
  contributionFrequency,
}: JackpotI): boolean {
  if (
    !winFrequency
    || !contributionFrequency
    || !winFrequency.frequency
    || !contributionFrequency.frequency
  ) {
    return false
  }

  const frequencyCheck = winFrequency.frequency === contributionFrequency.frequency
  const dayCheck = winFrequency.day === contributionFrequency.day
  const startTimeOfDayCheck = winFrequency.startTimeOfDay === contributionFrequency.startTimeOfDay
  const endTimeOfDayCheck = winFrequency.endTimeOfDay === contributionFrequency.endTimeOfDay

  return frequencyCheck && dayCheck && startTimeOfDayCheck && endTimeOfDayCheck
}
export default function FrequencyScheduleTab() {
  const { selectedItem, setSelectedItem } = React.useContext(CrudContext)
  const {
 errors, setErrors, updateField, setCurrentInfo,
} = React.useContext(FormContext)
  const [individualContributionSetup, setIndividualContributionSetup] = useState(selectedItem.id ? !areFrequenciesEqual(selectedItem) : false)

  function updateContributionFrequency(field: string, value: any) {
    setSelectedItem((current: any) => ({
      ...current,
      contributionFrequency: {
        ...current.contributionFrequency,
        day:
          field === 'frequency' && value === 'DAILY'
            ? 0
            : current.contributionFrequency.day,
        [field]: value,
      },
    }))
    setErrors((err: any) => ({
      ...err,
      [`contributionFrequency-${field}`]: '',
    }))
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
    setErrors((err: any) => ({ ...err, [`winFrequency-${field}`]: '' }))
    if (!individualContributionSetup) {
      updateContributionFrequency(field, value)
    }
  }
  return (
    <>
      <Grid gap="1.5rem" verticalAlgin="flex-start">
        <Clock />
        <Grid>
          <Grid gap="1.5rem">
            <Grid>
              <InputGroup
                id="startDate"
                name="startDate"
                label="frequency-startDate"
                inputType="datetime-local"
                feedback={errors?.startDate}
                status={errors?.startDate && 'error'}
                value={selectedItem?.startDate}
                onChange={({ target }) => {
                  updateField(target.name, target.value)
                }}
                onFocus={() => setCurrentInfo(
                    textTranslated({
                      group: 'forms-tabs-helpers',
                      key: 'input-startDate-frequency-help',
                      returnDefault: 'nothing',
                    }),
                  )}
              />
            </Grid>
            <Grid>
              <InputGroup
                id="endDate"
                name="endDate"
                label="frequency-endDate"
                inputType="datetime-local"
                feedback={errors?.endDate}
                status={errors?.endDate && 'error'}
                value={selectedItem.endDate}
                onChange={({ target }) => {
                  updateField(target.name, target.value)
                }}
                onFocus={() => setCurrentInfo(
                    textTranslated({
                      group: 'forms-tabs-helpers',
                      key: 'input-frequency-endDate-help',
                      returnDefault: 'nothing',
                    }),
                  )}
              />
            </Grid>
          </Grid>
        </Grid>
        <Grid padding={['pt-5']}>
          <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.75rem)' }}>
            <TypeButton
              options={frequencyOptions}
              name="frequency"
              onChange={({ target }) => {
                updateWinFrequency(target.name, target.value)
              }}
              value={selectedItem.winFrequency.frequency}
              label="frequency"
              feedback={errors?.['winFrequency-frequency']}
              status={errors?.['winFrequency-frequency'] && 'error'}
              onFocus={() => setCurrentInfo(
                  textTranslated({
                    group: 'forms-tabs-helpers',
                    key: 'input-winFrequency-frequency-help',
                    returnDefault: 'nothing',
                  }),
                )}
            />
          </Grid>
          <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.75rem)' }}>
            <Grid
              hidden={
                !['WEEKLY', 'MONTHLY'].includes(
                  selectedItem.winFrequency.frequency,
                )
              }
            >
              <SelectGroup
                label={`${selectedItem.winFrequency.frequency}-frequency-day`}
                id="frequency-day"
                name="frequency-day"
                onChange={({ target }) => updateWinFrequency('day', target.value)}
                options={
                  selectedItem.winFrequency.frequency === 'WEEKLY'
                    ? weeklyOptions
                    : daysOptions
                }
                value={(
                  (selectedItem.winFrequency.frequency === 'WEEKLY'
                    ? weeklyOptions
                    : daysOptions) as any
                )?.find(
                  (o: any) => o?.value === selectedItem?.winFrequency?.day,
                )}
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
      </Grid>
      <Grid padding={['pt-5']} gap="1.5rem">
        <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.75rem)' }}>
          <InputGroup
            id="startTimeOfDay"
            name="startTimeOfDay"
            label="startTimeOfDay"
            feedback={errors?.['winFrequency-startTimeOfDay']}
            status={errors?.['winFrequency-startTimeOfDay'] && 'error'}
            value={selectedItem.winFrequency.startTimeOfDay}
            inputType="time"
            onChange={({ target }) => {
              updateWinFrequency(target.name, target.value)
            }}
            onFocus={() => setCurrentInfo(
                textTranslated({
                  group: 'forms-tabs-helpers',
                  key: 'input-startTimeOfDay-help',
                  returnDefault: 'nothing',
                }),
              )}
          />
        </Grid>
        <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.75rem)' }}>
          <InputGroup
            id="endTimeOfDay"
            name="endTimeOfDay"
            label="endTimeOfDay"
            feedback={errors?.['winFrequency-endTimeOfDay']}
            status={errors?.['winFrequency-endTimeOfDay'] && 'error'}
            value={selectedItem.winFrequency.endTimeOfDay}
            inputType="time"
            onChange={({ target }) => {
              updateWinFrequency(target.name, target.value)
            }}
            onFocus={() => setCurrentInfo(
                textTranslated({
                  group: 'forms-tabs-helpers',
                  key: 'input-endTimeOfDay-help',
                  returnDefault: 'nothing',
                }),
              )}
          />
        </Grid>
      </Grid>

      <Grid padding={['pt-5', 'pb-5']}>
        <TypeButton
          name="individualContributionSetup"
          label="individual-contribution"
          onChange={({ target }) => {
            if (!target.value) {
              updateField('contributionFrequency', selectedItem.winFrequency)
            }
            setIndividualContributionSetup(target.value)
          }}
          value={individualContributionSetup}
          onFocus={() => setCurrentInfo(
              textTranslated({
                group: 'forms-tabs-helpers',
                key: 'input-individual-contribution-frequency-help',
                returnDefault: 'nothing',
              }),
            )}
          options={[
            {
              label: (
                <Typography
                  translateGroup="individual-contribution-setup"
                  translateKey="no"
                />
              ),
              value: false,
            },
            {
              label: (
                <Typography
                  translateGroup="individual-contribution-setup"
                  translateKey="yes"
                />
              ),
              value: true,
            },
          ]}
        />
      </Grid>

      {
        // contribution frequency
      }
      <Grid
        hidden={!individualContributionSetup}
        gap="1.5rem"
        verticalAlgin="flex-start"
      >
        <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.75rem)' }}>
          <TypeButton
            options={frequencyOptions}
            name="frequency"
            onChange={({ target }) => updateContributionFrequency(target.name, target.value)}
            value={selectedItem.contributionFrequency.frequency}
            label="frequency"
            feedback={errors?.['contributionFrequency-frequency']}
            status={errors?.['contributionFrequency-frequency'] && 'error'}
            onFocus={() => setCurrentInfo(
                textTranslated({
                  group: 'forms-tabs-helpers',
                  key: 'input-contributionFrequency-frequency-help',
                  returnDefault: 'nothing',
                }),
              )}
          />
        </Grid>
        <Grid
          hidden={
            !['WEEKLY', 'MONTHLY'].includes(
              selectedItem.contributionFrequency.frequency,
            )
          }
          responsiveWidth={{ sm: 100, md: 'calc(50% - 0.75rem)' }}
        >
          <SelectGroup
            label={`${selectedItem.contributionFrequency.frequency}-frequency-day`}
            id="frequency-day"
            name="frequency-day"
            onChange={({ target }) => updateContributionFrequency('day', target.value)}
            options={
              selectedItem.contributionFrequency.frequency === 'WEEKLY'
                ? weeklyOptions
                : daysOptions
            }
            value={(
              (selectedItem.contributionFrequency.frequency === 'WEEKLY'
                ? weeklyOptions
                : daysOptions) as any
            ).find(
              (o: any) => o?.value === selectedItem.contributionFrequency.day,
            )}
            feedback={errors?.['contributionFrequency-day']}
            status={errors?.['contributionFrequency-day'] && 'error'}
          />
        </Grid>
        <Grid padding={['pt-5']} gap="1.5rem">
          <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.75rem)' }}>
            <InputGroup
              id="startTimeOfDay"
              name="startTimeOfDay"
              label="startTimeOfDay"
              inputType="time"
              feedback={errors?.startTimeOfDay}
              status={errors?.startTimeOfDay && 'error'}
              value={selectedItem.contributionFrequency.startTimeOfDay}
              onChange={({ target }) => {
                updateContributionFrequency(target.name, target.value)
              }}
              onFocus={() => setCurrentInfo(
                  textTranslated({
                    group: 'forms-tabs-helpers',
                    key: 'input-startTimeOfDay-help',
                    returnDefault: 'nothing',
                  }),
                )}
            />
          </Grid>
          <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.75rem)' }}>
            <InputGroup
              id="endTimeOfDay"
              name="endTimeOfDay"
              inputType="time"
              label="endTimeOfDay"
              feedback={errors?.endTimeOfDay}
              status={errors?.endTimeOfDay && 'error'}
              value={selectedItem.contributionFrequency.endTimeOfDay}
              onChange={({ target }) => {
                updateContributionFrequency(target.name, target.value)
              }}
              onFocus={() => setCurrentInfo(
                  textTranslated({
                    group: 'forms-tabs-helpers',
                    key: 'input-endTimeOfDay-help',
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
