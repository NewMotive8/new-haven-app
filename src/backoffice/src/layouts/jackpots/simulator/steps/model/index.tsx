import { textTranslated } from 'components/TextTranslated'
import Grid from 'components/uiKit/grid'
import TypeButton from 'components/uiKit/inputs/TypeButton'
import Typography from 'components/uiKit/typography'
import { ReactNode, useContext, useEffect } from 'react'
import { SimulatorCrudContext } from '../..'
import { formTabs } from './form'

const tabsHelper: { [key in any]: ReactNode } = {
  1: textTranslated({
    group: 'forms-tabs-helpers',
    key: 'jackpot-model-maximum-tab-help',
    returnDefault: 'nothing',
  }),
  2: textTranslated({
    group: 'forms-tabs-helpers',
    key: 'jackpot-model-average-tab-help',
    returnDefault: 'nothing',
  }),
  3: textTranslated({
    group: 'forms-tabs-helpers',
    key: 'jackpot-model-fixed-tab-help',
    returnDefault: 'nothing',
  }),
}
export default function ModelSteps() {
  const { selectedItem, updateField } = useContext(SimulatorCrudContext)
  const isMustDrop = selectedItem.type === 'MUST_DROP'
  const isMultiLevel = selectedItem.type === 'MULTI_LEVEL'
  
    function defineModel(target: any) {
    const modelValue = parseInt(target.value, 10)
   
    updateField('model', modelValue)
    
    if (modelValue === 1) {
      // Fixed payout model
     
      updateField('fixedWinAmount', 1)
      updateField('averageWinAmount', 0)
      updateField('maximumWinAmount', 0)
  
    } else if (modelValue === 2) {
      // Average payout model
     
      updateField('averageWinAmount', 1)
      updateField('maximumWinAmount', 0)
      updateField('fixedWinAmount', 0)

    } else if (modelValue === 3) {
      // Maximum payout model
      
      updateField('maximumWinAmount', 1)
      updateField('averageWinAmount', 0)
      updateField('fixedWinAmount', 0)
    }
  }

  useEffect(() => {
    if (selectedItem.type === 'MUST_DROP') {
      defineModel({ name: 'model', id: 'model', value: 3 })
    }
    if (selectedItem.type === 'MULTI_LEVEL') {
      defineModel({ name: 'model', id: 'model', value: 2 })
    }
  }, [selectedItem.type])

  return (
    <>
      <Grid gap="0.5rem">
        <Grid>
          <Typography
            translateGroup="global"
            translateKey="select-a-jackpot-model"
            size="md"
            weight={600}
          />
        </Grid>
        <TypeButton
          label="select-model"
          name="model"
          value={selectedItem.model}
          onChange={({ target }) => {
            defineModel(target)
          }}
          options={formTabs({
            isMustDrop,
            isMultiLevel,
            disable: !!selectedItem.id,
          }).filter((item) => !item.hidden)}
        />
      </Grid>
      <Grid padding={['p-3']}>
        {
          formTabs({
            isMustDrop,
            isMultiLevel,
            disable: !!selectedItem.id,
          }).find((tab) => tab.value === selectedItem.model)?.content
        }
      </Grid>
    </>
  )
}
