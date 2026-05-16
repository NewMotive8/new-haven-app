import React, { useMemo } from 'react'
import Grid from 'components/uiKit/grid'
import { textTranslated } from 'components/TextTranslated'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import SelectGroup from 'components/uiKit/inputs/selectGroup'
import brandApi from 'utils/services/api/requests/brand'
import operatorsApi from 'utils/services/api/requests/operators'
import { useQuery } from 'react-query'
import Loading from 'assets/loading'
import { FormContext } from '..'
import { CrudContext } from '../..'

export default function BasicTab() {
  const { selectedItem } = React.useContext(CrudContext)
  const { errors, updateField, setCurrentInfo } = React.useContext(FormContext)
  const { data: brands, isLoading: brandsIsLoading } = useQuery(
    'brands',
    () => brandApi.getItems(),
    {
      staleTime: 120000,
    },
  )
  const { data: operators, isLoading: operatorsIsLoading } = useQuery(
    'operators',
    () => operatorsApi.getItems(),
    {
      staleTime: 120000,
    },
  )
  function parseExactMatchOptions(list: any) {
    return (
      list?.content?.map((item: any) => {
        return {
          value: item.id,
          label: item.name,
        }
      }) || []
    )
  }
  const optionOperators = useMemo(() => {
    return parseExactMatchOptions(operators).filter(
      (options: any) => options?.value === selectedItem?.operators?.id,
    )[0]
  }, [selectedItem?.brand])
  const optionBrand = useMemo(() => {
    return parseExactMatchOptions(brands).filter(
      (options: any) => options?.value === selectedItem?.brand?.id,
    )[0]
  }, [selectedItem?.brand])
  function filter(array: any, id: number) {
    return array?.content?.filter((options: any) => options?.id === id)[0]
  }
  const optionContributionType = [
    { value: 1, label: 'Fixed' },
    { value: 2, label: 'Percentage' },
    { value: 3, label: 'Shared Fixed' },
    { value: 4, label: 'Shared Percentage' },
  ]
  if (brandsIsLoading || operatorsIsLoading) {
    <Grid>
      <Loading />
    </Grid>
  }
  const selectedOption = optionContributionType?.find(
    (option) => option.value === selectedItem?.type,
  )

  const labelPoolInput = selectedOption?.label === 'Fixed' ? 'Amount' : selectedOption?.label || ''
  return (
    <Grid gap="0.5rem" verticalAlgin="center">
      <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
        <InputGroup
          id="name"
          name="name"
          label="seed-name"
          feedback={errors?.name}
          status={errors?.name && 'error'}
          value={selectedItem.name}
          onChange={({ target }) => {
            updateField(target.name, target.value)
          }}
          onFocus={() => setCurrentInfo(
              textTranslated({
                group: 'forms-tabs-helpers',
                key: 'input-name-help',
                returnDefault: 'nothing',
              }),
            )}
        />
      </Grid>
      <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
        <InputGroup
          id="currentAmount"
          name="currentAmount"
          label="seed-currentAmount"
          feedback={errors?.currentAmount}
          status={errors?.currentAmount && 'error'}
          value={selectedItem.currentAmount}
          onChange={({ target }) => {
            updateField(target.name, target.value)
          }}
          onFocus={() => setCurrentInfo(
              textTranslated({
                group: 'forms-tabs-helpers',
                key: 'input-currentAmount-help',
                returnDefault: 'nothing',
              }),
            )}
        />
      </Grid>
      <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
        <InputGroup
          id="targetAmount"
          name="targetAmount"
          label="targetAmount"
          feedback={errors?.targetAmount}
          status={errors?.targetAmount && 'error'}
          value={selectedItem.targetAmount}
          onChange={({ target }) => {
            updateField(target.name, target.value)
          }}
          onFocus={() => setCurrentInfo(
              textTranslated({
                group: 'forms-tabs-helpers',
                key: 'input-targetAmount-help',
                returnDefault: 'nothing',
              }),
            )}
        />
      </Grid>
      <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
        <SelectGroup
          id="type"
          name="type"
          label="contributionType"
          value={
            optionContributionType.filter(
              (options: any) => options?.value === selectedItem?.type,
            )[0]
          }
          options={optionContributionType}
          onChange={({ target }: any) => {
            updateField(target.name, target.value)
          }}
        />
      </Grid>

      <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
        <InputGroup
          id="playerContributionPercent"
          name="playerContributionPercent"
          label={`Pool ${labelPoolInput}`}
          feedback={errors?.playerContributionPercent}
          status={errors?.playerContributionPercent && 'error'}
          value={selectedItem.playerContributionPercent}
          onChange={({ target }) => {
            updateField(target.name, target.value)
          }}
          onFocus={() => setCurrentInfo(
              textTranslated({
                group: 'forms-tabs-helpers',
                key: 'input-playerContributionPercent-help',
                returnDefault: 'nothing',
              }),
            )}
        />
      </Grid>
      <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
        <SelectGroup
          id="operator"
          name="operator"
          label="operator"
          value={optionOperators}
          options={parseExactMatchOptions(operators || [])}
          onChange={({ target }: any) => {
            updateField(target.name, filter(operators, target.value))
          }}
        />
      </Grid>
      <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
        <SelectGroup
          id="brand"
          name="brand"
          label="brand"
          value={optionBrand}
          options={parseExactMatchOptions(brands || [])}
          onChange={({ target }: any) => {
            updateField(target.name, filter(brands, target.value))
          }}
        />
      </Grid>
    </Grid>
  )
}
