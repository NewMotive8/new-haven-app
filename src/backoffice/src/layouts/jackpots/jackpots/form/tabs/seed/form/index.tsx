import { textTranslated } from 'components/TextTranslated'
import Grid from 'components/uiKit/grid'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import BrandContext from 'context/brand'
import { CrudContext } from 'layouts/jackpots/jackpots'
import { useContext, useEffect } from 'react'
import { FormContext } from '../../..'
import { validateSeedTab } from '../../../formValidation'
import { usePoolForm } from '../../pool/usePool'
import ContributionInputs from '../components/ContributionInputs'
import MinMaxContributionInputs from '../components/MinMaxContributionInputs'
import OperatorContributionInputs from '../components/OperatorContributionInputs'
import SelectContributionType from '../components/Selector'
import { useSeedForm } from '../useSeed'

export default function FormSeed({ index = 0, isMultiLevel }: any) {
  const { currentBrand } = useContext(BrandContext)
  const { selectedItem } = useContext(CrudContext)
  const {
    errors, setErrors, setCurrentInfo, validateTab,
  } = useContext(FormContext)
  const { updatePool } = usePoolForm()
  const { updateSeed } = useSeedForm()

  const pools = selectedItem?.pools || []
  const minimumAmount = pools[index]?.minimumAmount || ''

  useEffect(() => {
    if (!selectedItem?.id) {
      const resultValidade = validateSeedTab(selectedItem?.seeds[index])

      setErrors((stage) => {
        return {
          ...stage,
          ...resultValidade,
          count: stage.count + resultValidade.count,
        }
      })
    }
  }, [index])
  return (
    <Grid gap="1.5rem">
      <Grid
        id="re-seed-amount-box"
        responsiveWidth={{ sm: 100, md: 'calc(50% - 1rem)' }}
      >
        <InputGroup
          inputType="number"
          id="minimumAmount"
          name="minimumAmount"
          label="re-seed-amount-after-a-win"
          feedback={errors?.minimumAmount}
          status={errors?.minimumAmount && 'error'}
          value={selectedItem?.pools[index]?.minimumAmount}
          onChange={({ target }) => {
            updatePool(target.name, target.value, index)
          }}
          onFocus={() => setCurrentInfo(
            textTranslated({
              group: 'forms-tabs-helpers',
              key: 'input-pool-minimumAmount-help',
              returnDefault: 'nothing',
            }),
          )}
          inputProps={{ readOnly: !!selectedItem.id }}
        />
      </Grid>
      {parseFloat(minimumAmount) ? (
        <Grid hidden={isMultiLevel}>
          <SelectContributionType
            readonly={selectedItem.seeds[index]?.id}
            selectedType={selectedItem.seeds[index].type}
            updateSeed={updateSeed}
            setCurrentInfo={setCurrentInfo}
            index={index}
          />
          <ContributionInputs
            selectedType={selectedItem?.seeds[index]?.type || 1}
            errors={errors}
            selectedItem={selectedItem}
            updateSeed={updateSeed}
            setCurrentInfo={setCurrentInfo}
            readOnly={selectedItem.seeds[index]?.id}
            index={index}
          />
          {!currentBrand?.operatorOnly && (
            <OperatorContributionInputs
              seed={selectedItem.seeds[index]}
              errors={errors}
              updateSeed={updateSeed}
              setCurrentInfo={setCurrentInfo}
              readOnly={selectedItem.seeds[index]?.id}
              index={index}
            />
          )}
          <MinMaxContributionInputs
            errors={errors}
            selectedItem={selectedItem}
            updateSeed={updateSeed}
            setCurrentInfo={setCurrentInfo}
            readOnly={selectedItem.seeds[index]?.id}
            index={index}
          />
        </Grid>
      ) : (
        <></>
      )}
    </Grid>
  )
}
