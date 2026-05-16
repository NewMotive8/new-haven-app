import React, { useMemo } from 'react'
import Grid from 'components/uiKit/grid'
import { textTranslated } from 'components/TextTranslated'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import Toggle from 'components/uiKit/inputs/Toggle'
import SelectGroup from 'components/uiKit/inputs/selectGroup'
import { useQuery } from 'react-query'
import jackpotsApi from 'utils/services/api/requests/jackpots'
import { CrudContext } from '../..'
import { FormContext } from '..'

const rules = [
  {
    label: 'Jackpot Win',
    value: 'jackpotWin',
    inputAllowed: false,
    intervalAllowed: false,
  },
  {
    label: 'Jackpot Has Ended',
    value: 'jackpotEnd',
    inputAllowed: false,
    intervalAllowed: false,
  },
  {
    label: 'No Contributions',
    value: 'noContributions',
    inputAllowed: true,
    intervalAllowed: true,
  },
  {
    label: 'Pool Higher than Target',
    value: 'highPool',
    inputAllowed: false,
    intervalAllowed: true,
  },
  {
    label: 'Deposit Failed',
    value: 'depositFailed',
    inputAllowed: false,
    intervalAllowed: false,
  },
]
export default function BasicTab() {
  const { selectedItem } = React.useContext(CrudContext)
  const { errors, updateField, setCurrentInfo } = React.useContext(FormContext)
  const { data: jackpots } = useQuery(
    'jackpots',
    () => jackpotsApi.getItems(),
    {
      staleTime: 120000,
    },
  )
  function parseExactMatchOptions(list: any) {
    return (
      list?.content?.map((item: any) => {
        return {
          value: item.id,
          label: item.internalName,
        }
      }) || []
    )
  }
  const optionJackpots = useMemo(() => {
    return parseExactMatchOptions(jackpots).filter(
      (options: any) => options?.value === selectedItem?.jackpot,
    )[0]
  }, [selectedItem?.jackpot])

  return (
    <>
      <Grid gap="0.5rem" verticalAlgin="flex-start">
        <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
          <SelectGroup
            id="alertRule"
            name="alertRule"
            label="Rule"
            value={
              rules.filter(
                (options: any) => options?.value === selectedItem?.alertRule,
              )[0]
            }
            options={rules}
            onChange={({ target }: any) => {
              updateField(target.name, target.value)
            }}
          />
        </Grid>

        <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
          <SelectGroup
            id="jackpot"
            name="jackpot"
            label="jackpot"
            value={optionJackpots}
            options={parseExactMatchOptions(jackpots || [])}
            onChange={({ target }: any) => {
              updateField(target.name, target.value)
            }}
          />
        </Grid>

        {['noContributions'].includes(selectedItem.alertRule) && (
          <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
            <InputGroup
              id="ruleInput"
              name="ruleInput"
              label="Value to trigger alert"
              feedback={errors?.ruleInput}
              status={errors?.ruleInput && 'error'}
              value={selectedItem.ruleInput}
              onChange={({ target }) => {
                updateField(target.name, target.value)
              }}
              onFocus={() => setCurrentInfo(
                  textTranslated({
                    group: 'forms-tabs-helpers',
                    key: 'input-ruleInput-help',
                    returnDefault: 'nothing',
                  }),
                )}
            />
          </Grid>
        )}
        {['noContributions', 'highPool'].includes(selectedItem.alertRule) && (
          <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
            <InputGroup
              id="interval"
              name="interval"
              label="Alerting check frequency in minutes"
              feedback={errors?.interval}
              status={errors?.interval && 'error'}
              value={selectedItem.interval}
              onChange={({ target }) => {
                updateField(target.name, target.value)
              }}
              onFocus={() => setCurrentInfo(
                  textTranslated({
                    group: 'forms-tabs-helpers',
                    key: 'input-interval-help',
                    returnDefault: 'nothing',
                  }),
                )}
            />
          </Grid>
        )}

        <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
          <InputGroup
            id="emailList"
            name="emailList"
            label="Email Addresses"
            feedback={errors?.emailList}
            status={errors?.emailList && 'error'}
            value={selectedItem.emailList}
            onChange={({ target }) => {
              updateField(target.name, target.value)
            }}
            onFocus={() => setCurrentInfo(
                textTranslated({
                  group: 'forms-tabs-helpers',
                  key: 'input-emailList-help',
                  returnDefault: 'nothing',
                }),
              )}
          />
        </Grid>

        <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
          <Toggle
            id="enabled"
            name="enabled"
            label="enabled"
            value={selectedItem.enabled}
            onChange={({ target }) => {
              updateField(target.name, target.value)
            }}
            displayInfo={
              !!textTranslated({
                group: 'forms-tabs-helpers',
                key: 'input-enabled-help',
                returnDefault: 'nothing',
              })
            }
            onFocus={() => setCurrentInfo(
                textTranslated({
                  group: 'forms-tabs-helpers',
                  key: 'input-enabled-help',
                  returnDefault: 'nothing',
                }),
              )}
          />
        </Grid>
      </Grid>
    </>
  )
}
