import InfoCard from 'components/cards/infoCard'
import Grid from 'components/uiKit/grid'
import BrandContext from 'context/brand'
import { CrudContext } from 'layouts/jackpots/jackpots'
import { useContext, useEffect } from 'react'
import { BsCoin } from 'react-icons/bs'
import { useThemeWatcher } from 'utils/customHooks'
import { formatCurrency } from 'utils/functions/numbers'
import { FormContext } from '../../..'
import ContributionInputs from '../components/ContributionInputs'
import OperatorContributionInputs from '../components/OperatorContributionInputs'
import SelectContributionType from '../components/Selector'
import AdvancedTab from '../components/advanced'
import { usePoolForm } from '../usePool'
import { validateForm, validatePool } from './formValidation'
import MultiLevelInputs from '../components/multiLevelInputs'

export default function FormPool({ index = 0, isMultiLevel }: any) {
  const { currentBrand } = useContext(BrandContext)
  const { selectedItem } = useContext(CrudContext)
  const {
    errors, setCurrentInfo, setErrors, validateTab,
  } = useContext(FormContext)
  const { updatePool } = usePoolForm()
  useEffect(() => {
    validateTab('pool')
  }, [
    selectedItem?.pools[index].contributionType,
    selectedItem?.pools[index].contributionAmount,
    selectedItem?.pools[index].playerContributionPercent,
  ])
  useEffect(() => {
    if (selectedItem.type === 'MULTI_LEVEL' && !selectedItem?.id) {
      const resultValidade = validateForm(selectedItem)
      setErrors((stage) => {
        return {
          ...stage,
          ...resultValidade,
          count: stage.count + resultValidade.count,
        }
      })
    }
  }, [selectedItem?.pools])

  const theme = useThemeWatcher()
  const cardColor = theme === 'light' ? 'primary' : 'primary-full'
  useEffect(() => {
    if (!selectedItem?.id) {
      const resultValidade = validatePool(selectedItem?.pools[index])

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
    <Grid gap="1rem">
      <Grid
        hidden={!selectedItem.pools[index].id}
        responsiveWidth={{
          sm: 100,
          md: 'calc(50% - 0.5rem)',
          xxl: 'calc(100% / 4 - (3rem / 4))',
        }}
        style={{ minWidth: '230px' }}
      >
        <InfoCard
          color={cardColor}
          label="pool-initial-amount"
          icon={<BsCoin />}
          content={
            selectedItem.pools[index]?.initialAmount
              ? formatCurrency(
                selectedItem.pools[index]?.initialAmount,
                currentBrand?.currency || 'usd',
              )
              : '---'
          }
          height="100%"
        />
      </Grid>
      <Grid hidden={isMultiLevel}>
        <SelectContributionType
          selectedType={selectedItem.pools[index].contributionType || 1}
          updatePool={updatePool}
          setCurrentInfo={setCurrentInfo}
          index={index}
          readonly={!!selectedItem.pools[index]?.id}
        />
        <ContributionInputs
          selectedType={selectedItem.pools[index].contributionType || 1}
          errors={errors}
          selectedItem={selectedItem}
          updatePool={updatePool}
          index={index}
          setCurrentInfo={setCurrentInfo}
          readOnly={!!selectedItem.pools[index]?.id}
        />
        {!currentBrand?.operatorOnly && (
          <OperatorContributionInputs
            pool={selectedItem.pools[index]}
            errors={errors}
            updatePool={updatePool}
            index={index}
            setCurrentInfo={setCurrentInfo}
            readOnly={!!selectedItem.pools[index]?.id}
          />
        )}
      </Grid>
      {selectedItem.type === 'MULTI_LEVEL' && (
        <MultiLevelInputs index={index} />
      )}
      <Grid>
        <AdvancedTab
          pool={selectedItem.pools[index]}
          errors={errors}
          updatePool={updatePool}
          index={index}
          setCurrentInfo={setCurrentInfo}
        />
      </Grid>
    </Grid>
  )
}
