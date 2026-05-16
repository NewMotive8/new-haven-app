import React, { useContext, useEffect } from 'react'
import Grid from 'components/uiKit/grid'
import { textTranslated } from 'components/TextTranslated'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import DialogContext from 'context/dialog'
import CurrencySelector from 'components/selectors/currency'
import BrandContext from 'context/brand'
import { FormContext } from '..'
import { CrudContext } from '../..'

export default function BasicTabTab() {
  const {
    selectedItem,
  } = React.useContext(CrudContext)
  const {
    errors,
    updateField,
    setCurrentInfo,
  } = React.useContext(FormContext)
  const { displayDialog, removeDialog } = React.useContext(DialogContext)
  const { currentBrand } = useContext(BrandContext)

  useEffect(() => { updateField('brand', currentBrand) }, [currentBrand])

  function handleChooseCurrency() {
    displayDialog({
      dialogId: 'CURRENCY-SELECTOR',
      content: (<CurrencySelector onChange={(currency) => { updateField('currency', currency); removeDialog('CURRENCY-SELECTOR') }} />),
    })
  }
  return (
    <Grid gap="1.5rem">
      <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.75rem)' }}>

        <InputGroup
          id="currentRate"
          name="currentRate"
          label="rate"
          inputType="number"
          feedback={errors?.currentRate}
          status={errors?.currentRate && 'error'}
          value={selectedItem.currentRate}
          onChange={({ target }) => {
            updateField(target.name, target.value)
          }}
          onFocus={() => setCurrentInfo(
            textTranslated({
              group: 'forms-tabs-helpers',
              key: 'input-rate-help',
              returnDefault: 'nothing',
            }),
          )}
        />
      </Grid>
      <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.75rem)' }}>
        <InputGroup
          id="currency"
          name="currency"
          label="currency"
          feedback={errors?.currency}
          status={errors?.currency && 'error'}
          value={selectedItem?.currency?.iso3}
          onChange={({ target }) => { updateField(target.name, target.value) }}
          onFocus={() => { handleChooseCurrency() }}
          inputProps={{
            readOnly: true,
            onMouseEnter: () => setCurrentInfo(textTranslated({ group: 'forms-tabs-helpers', key: 'input-jackpot-currency-help', returnDefault: 'nothing' })),
          }}
        />
      </Grid>
    </Grid>
  )
}
