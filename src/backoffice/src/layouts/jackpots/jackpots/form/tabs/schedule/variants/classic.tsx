import React from 'react'
import Grid from 'components/uiKit/grid'
import { textTranslated } from 'components/TextTranslated'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import { Clock } from 'components/clock'
import { FormContext } from '../../..'
import { CrudContext } from '../../../..'

export default function ClassicScheduleTab() {
  const { selectedItem } = React.useContext(CrudContext)
  const { errors, updateField, setCurrentInfo } = React.useContext(FormContext)
  return (
    <>
      <Grid gap="0.5rem">
        <Clock />
        <Grid>
          <InputGroup
            id="startDate"
            name="startDate"
            label="classic-startDate"
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
                  key: 'input-startDate-classic--help',
                  returnDefault: 'nothing',
                }),
              )}
          />
        </Grid>
        <Grid>
          <InputGroup
            id="endDate"
            name="endDate"
            label="classic-endDate"
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
                  key: 'input-classic-endDate-help',
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
            value={selectedItem.maximumWins}
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
    </>
  )
}
