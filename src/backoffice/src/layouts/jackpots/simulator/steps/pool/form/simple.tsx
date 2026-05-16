import { textTranslated } from 'components/TextTranslated'
import InfoCard from 'components/cards/infoCard'
import Grid from 'components/uiKit/grid'
import TypeButton from 'components/uiKit/inputs/TypeButton'
import Typography from 'components/uiKit/typography'
import BrandContext from 'context/brand'
import { SimulatorCrudContext } from 'layouts/jackpots/simulator'
import { useContext, useState } from 'react'
import { BsCoin, BsTools } from 'react-icons/bs'
import { useThemeWatcher } from 'utils/customHooks'
import { formatCurrency } from 'utils/functions/numbers'
import { PoolType } from 'utils/services/api/requests/pools'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import RangeInput from 'components/uiKit/inputs/inputGroup/variants/rangeInput'
import Button from 'components/uiKit/buttons'
import Card from 'components/cards/card'
import { usePoolForm } from '../usePool'

export default function FormPool() {
  const {
 selectedItem, setCurrentInfo, setSelectedItem, errors,
} = useContext(SimulatorCrudContext)
  const { currentBrand } = useContext(BrandContext)
  const { updatePool } = usePoolForm(selectedItem, setSelectedItem)
  const [expand, setExpand] = useState(false)
  const theme = useThemeWatcher()
  const cardColor = theme === 'light' ? 'primary' : 'primary-full'

  return (
    <Grid gap="1rem">
      <Grid
        hidden={!selectedItem.pools[0]?.id}
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
            selectedItem.pools[0]?.initialAmount
              ? formatCurrency(
                  selectedItem.pools[0]?.initialAmount,
                  currentBrand?.currency || 'usd',
                )
              : '---'
          }
          height="100%"
        />
      </Grid>

      <Grid
        style={{
          opacity: selectedItem.pools[0]?.id ? 0.7 : 1,
          pointerEvents: selectedItem.pools[0]?.id ? 'none' : 'unset',
        }}
        onMouseEnter={() => setCurrentInfo(
            textTranslated({
              group: 'forms-tabs-helpers',
              key: 'pool-contribution-help',
              returnDefault: 'nothing',
            }),
          )}
      >
        <TypeButton
          value={selectedItem?.pools[0]?.contributionType || 1}
          name="poolType"
          onChange={({ target }) => updatePool('contributionType', target.value, 0)}
          options={[
            {
              label: (
                <Grid
                  width="fit-content"
                  onClick={() => setCurrentInfo(
                      textTranslated({
                        group: 'forms-tabs-helpers',
                        key: 'pool-contribution-fixed-help',
                        returnDefault: 'nothing',
                      }),
                    )}
                >
                  <Typography translateGroup="pool-form" translateKey="fixed" />
                </Grid>
              ),
              value: PoolType.Fixed,
            },
            {
              label: (
                <Grid
                  width="fit-content"
                  onClick={() => setCurrentInfo(
                      textTranslated({
                        group: 'forms-tabs-helpers',
                        key: 'pool-contribution-percentage-help',
                        returnDefault: 'nothing',
                      }),
                    )}
                >
                  <Typography
                    translateGroup="pool-form"
                    translateKey="percentage"
                  />
                </Grid>
              ),
              value: PoolType.Percentage,
            },
          ]}
        />
      </Grid>

      <Grid gap="0.5rem">
        <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.5rem/2)' }}>
          {(selectedItem.pools[0].contributionType || 1) === PoolType.Fixed ? (
            <InputGroup
              id="contributionAmount"
              name="contributionAmount"
              label="pool-contribution-amount-fixed"
              feedback={errors?.contributionAmount}
              status={errors?.contributionAmount && 'error'}
              value={selectedItem?.pools[0]?.contributionAmount || 0}
              onChange={({ target }) => updatePool('contributionAmount', target.value, 0)}
              inputType="number"
              onFocus={() => setCurrentInfo(
                  textTranslated({
                    group: 'forms-tabs-helpers',
                    key: 'pool-input-contribution-amount-fixed-help',
                    returnDefault: 'nothing',
                  }),
                )}
              inputProps={{ readOnly: !!selectedItem.pools[0]?.id }}
            />
          ) : (
            <RangeInput
              max={100}
              min={0}
              step={0.01}
              id="contributionAmount"
              name="contributionAmount"
              label="pool-contribution-amount-in-percent"
              feedback={errors?.contributionAmount}
              status={errors?.contributionAmount && 'error'}
              value={selectedItem?.pools[0]?.contributionAmount || 0}
              onChange={({ target }) => updatePool('contributionAmount', target.value, 0)}
              onFocus={() => setCurrentInfo(
                  textTranslated({
                    group: 'forms-tabs-helpers',
                    key: 'pool-input-contribution-amount-percentage-help',
                    returnDefault: 'nothing',
                  }),
                )}
              inputProps={{ readOnly: !!selectedItem.pools[0]?.id }}
            />
          )}
        </Grid>

        <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
          <InputGroup
            inputType="number"
            id="currentAmount"
            name="currentAmount"
            label="initial-jackpot-amount"
            feedback={errors?.currentAmount}
            status={errors?.currentAmount && 'error'}
            value={selectedItem?.pools[0]?.currentAmount || 0}
            onChange={({ target }) => {
              updatePool(target.name, target.value)
            }}
            onFocus={() => setCurrentInfo(
                textTranslated({
                  group: 'forms-tabs-helpers',
                  key: 'input-currentAmount-help',
                  returnDefault: 'nothing',
                }),
              )}
            inputProps={{ readOnly: !!selectedItem?.pools[0]?.id }}
          />
        </Grid>
      </Grid>

      <Grid gap="0.5rem">
        <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
          <RangeInput
            min={0}
            max={100}
            step={0.01}
            id="playerContributionPercent"
            name="playerContributionPercent"
            label="pool-playerContributionPercent"
            feedback={errors?.playerContributionPercent}
            status={errors?.playerContributionPercent && 'error'}
            value={
              Number(selectedItem.pools[0]?.playerContributionPercent) || 0.0
            }
            onChange={({ target }) => {
              const { name, value } = target
              if (/^\d+(\.\d{0,2})?$/.test(value)) {
                const parsedValue = parseFloat(value) || 0
                const reactValue = (100 - parsedValue).toFixed(2)

                updatePool(name, value, 0)
                updatePool('operatorContribution', reactValue, 0)
              }
            }}
            onFocus={() => setCurrentInfo(
                textTranslated({
                  group: 'forms-tabs-helpers',
                  key: 'pool-input-playerContributionPercent-help',
                  returnDefault: 'nothing',
                }),
              )}
            inputProps={{ readOnly: !!selectedItem.pools[0]?.id }}
          />
        </Grid>
        <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
          <RangeInput
            min={0.1}
            max={100}
            step={0.01}
            id="operatorContribution"
            name="operatorContribution"
            label="pool-operatorContribution"
            feedback={errors?.operatorContribution}
            status={errors?.operatorContribution && 'error'}
            value={
              selectedItem.pools[0]?.operatorContribution
              || (
                100
                - parseFloat(selectedItem.pools[0]?.playerContributionPercent)
              ).toFixed(2)
            }
            onChange={({ target }) => {
              const { name, value } = target
              if (/^\d+(\.\d{0,2})?$/.test(value)) {
                const parsedValue = parseFloat(value) || 0
                const reactValue = (100 - parsedValue).toFixed(2)

                updatePool(name, value, 0)
                updatePool('playerContributionPercent', reactValue, 0)
              }
            }}
            onFocus={() => setCurrentInfo(
                textTranslated({
                  group: 'forms-tabs-helpers',
                  key: 'pool-input-operatorContribution-help',
                  returnDefault: 'nothing',
                }),
              )}
            inputProps={{ readOnly: !!selectedItem.pools[0]?.id }}
          />
        </Grid>
      </Grid>

      <Grid>
        <Grid>
          <Button
            color={theme === 'light' ? 'primary' : 'primary-full'}
            block
            onClick={() => setExpand(!expand)}
            id="advanced-toggle"
          >
            <Grid
              gap="0.5rem"
              verticalAlgin="center"
              horizontalAlgin="flex-start"
            >
              <BsTools />
              <Typography translateGroup="global" translateKey="advanced" />
            </Grid>
          </Button>
        </Grid>
        <Card
          color="root"
          style={{
            height: 'fit-content',
            maxHeight: expand ? '500px' : '0px',
            transition: 'max-height 0.5s ease-in-out',
            overflow: 'hidden',
            borderRadius: '0pt 0pt 4pt 4pt',
            padding: 0,
          }}
        >
          <Grid padding={['p-3']} width="calc(50% - 0.25rem)">
            <InputGroup
              id="maximumAmount"
              name="maximumAmount"
              label="maximum-pool-size"
              feedback={errors?.maximumAmount}
              status={errors?.maximumAmount && 'error'}
              value={selectedItem.pools[0]?.maximumAmount}
              inputType="number"
              onChange={({ target }) => {
                updatePool(target.name, target.value, 0)
              }}
              onFocus={() => setCurrentInfo(
                  textTranslated({
                    group: 'forms-tabs-helpers',
                    key: 'input-maximumAmount-help',
                    returnDefault: 'nothing',
                  }),
                )}
            />
          </Grid>
        </Card>
      </Grid>
    </Grid>
  )
}
