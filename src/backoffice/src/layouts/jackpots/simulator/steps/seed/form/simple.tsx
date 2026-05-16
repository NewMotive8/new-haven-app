import { textTranslated } from 'components/TextTranslated'
import Grid from 'components/uiKit/grid'
import TypeButton from 'components/uiKit/inputs/TypeButton'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import RangeInput from 'components/uiKit/inputs/inputGroup/variants/rangeInput'
import Typography from 'components/uiKit/typography'
import BrandContext from 'context/brand'
import { SimulatorCrudContext } from 'layouts/jackpots/simulator'
import { useContext } from 'react'
import { SeedType } from 'utils/services/api/requests/seeds'
import { usePoolForm } from '../../pool/usePool'
import { useSeedForm } from '../useSeed'

interface MenuStates {
  [key: string]: boolean
}
export default function FormSeed() {
  const {
 selectedItem, setCurrentInfo, setSelectedItem, errors,
} = useContext(SimulatorCrudContext)
  const { currentBrand } = useContext(BrandContext)
  const { updatePool } = usePoolForm(selectedItem, setSelectedItem)
  const { updateSeed } = useSeedForm(selectedItem, setSelectedItem)
  const pools = selectedItem?.pools || []
  const minimumAmount = pools[0]?.minimumAmount || ''
  return (
    <Grid gap="1rem">
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
          value={selectedItem?.pools[0]?.minimumAmount}
          onChange={({ target }) => {
            updatePool(target.name, target.value, 0)
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
        <>
          <Grid
            style={{
              opacity: selectedItem.seeds[0]?.id ? 0.7 : 1,
              pointerEvents: selectedItem.seeds[0]?.id ? 'none' : 'unset',
            }}
            onMouseEnter={() => setCurrentInfo(
                textTranslated({
                  group: 'forms-tabs-helpers',
                  key: 'seed-contribution-help',
                  returnDefault: 'nothing',
                }),
              )}
          >
            <TypeButton
              value={selectedItem.seeds[0]?.type}
              name="seedType"
              onChange={({ target }) => updateSeed('type', target.value, 0)}
              options={[
                {
                  label: (
                    <Grid
                      width="fit-content"
                      onClick={() => setCurrentInfo(
                          textTranslated({
                            group: 'forms-tabs-helpers',
                            key: 'seed-contribution-fixed-help',
                            returnDefault: 'nothing',
                          }),
                        )}
                    >
                      <Typography
                        translateGroup="seed-form"
                        translateKey="fixed"
                      />
                    </Grid>
                  ),
                  value: SeedType.Fixed,
                },
                {
                  label: (
                    <Grid
                      width="fit-content"
                      onClick={() => setCurrentInfo(
                          textTranslated({
                            group: 'forms-tabs-helpers',
                            key: 'seed-contribution-percentage-help',
                            returnDefault: 'nothing',
                          }),
                        )}
                    >
                      <Typography
                        translateGroup="seed-form"
                        translateKey="percentage"
                      />
                    </Grid>
                  ),
                  value: SeedType.Percentage,
                },
              ]}
            />
          </Grid>

          <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
            {(selectedItem?.seeds[0]?.type || 1) === SeedType.Fixed ? (
              <InputGroup
                id="contributionAmount"
                name="contributionAmount"
                label="seed-contribution-amount-fixed"
                feedback={errors?.contributionAmount}
                status={errors?.contributionAmount && 'error'}
                value={selectedItem?.seeds[0]?.contributionAmount}
                inputType="number"
                onChange={({ target }) => updateSeed(target.name, target.value, 0)}
                onFocus={() => setCurrentInfo(
                    textTranslated({
                      group: 'forms-tabs-helpers',
                      key: 'seed-input-contribution-amount-fixed-help',
                      returnDefault: 'nothing',
                    }),
                  )}
                inputProps={{ readOnly: selectedItem.seeds[0]?.id }}
              />
            ) : (
              <RangeInput
                max={100}
                min={0}
                step={0.1}
                id="contributionAmount"
                name="contributionAmount"
                label="seed-contribution-amount-in-percent"
                feedback={errors?.contributionAmount}
                status={errors?.contributionAmount && 'error'}
                value={selectedItem?.seeds[0]?.contributionAmount}
                onChange={({ target }) => updateSeed(target.name, target.value, 0)}
                onFocus={() => setCurrentInfo(
                    textTranslated({
                      group: 'forms-tabs-helpers',
                      key: 'seed-input-contribution-amount-percentage-help',
                      returnDefault: 'nothing',
                    }),
                  )}
                inputProps={{ readOnly: selectedItem.seeds[0]?.id }}
              />
            )}
          </Grid>
          {!currentBrand?.operatorOnly && (
            <Grid gap="0.5rem">
              <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
                <RangeInput
                  min={0}
                  max={100}
                  step={0.01}
                  id="playerContributionPercent"
                  name="playerContributionPercent"
                  label="seed-playerContributionPercent"
                  feedback={errors?.playerContributionPercent}
                  status={errors?.playerContributionPercent && 'error'}
                  value={
                    Number(selectedItem.seeds[0]?.playerContributionPercent)
                    || 0.0
                  }
                  onChange={({ target }) => {
                    const { name, value } = target
                    if (/^\d+(\.\d{0,2})?$/.test(value)) {
                      const parsedValue = parseFloat(value) || 0
                      const reactValue = (100 - parsedValue).toFixed(2)

                      updateSeed(name, value, 0)
                      updateSeed('operatorContribution', reactValue, 0)
                    }
                  }}
                  onFocus={() => setCurrentInfo(
                      textTranslated({
                        group: 'forms-tabs-helpers',
                        key: 'seed-input-playerContributionPercent-help',
                        returnDefault: 'nothing',
                      }),
                    )}
                  inputProps={{ readOnly: selectedItem.seeds[0]?.id }}
                />
              </Grid>
              <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
                <RangeInput
                  min={0.1}
                  max={100}
                  step={0.01}
                  id="operatorContribution"
                  name="operatorContribution"
                  label="seed-operatorContribution"
                  feedback={errors?.operatorContribution}
                  status={errors?.operatorContribution && 'error'}
                  value={(
                    Number(selectedItem.seeds[0]?.operatorContribution)
                    || 100
                      - parseFloat(
                        selectedItem.seeds[0]?.playerContributionPercent || 0.0,
                      )
                  ).toFixed(2)}
                  onChange={({ target }) => {
                    const { name, value } = target
                    if (/^\d+(\.\d{0,2})?$/.test(value)) {
                      const parsedValue = parseFloat(value) || 0
                      const reactValue = (100 - parsedValue).toFixed(2)

                      updateSeed(name, value, 0)
                      updateSeed('playerContributionPercent', reactValue, 0)
                    }
                  }}
                  onFocus={() => setCurrentInfo(
                      textTranslated({
                        group: 'forms-tabs-helpers',
                        key: 'seed-input-operatorContribution-help',
                        returnDefault: 'nothing',
                      }),
                    )}
                  inputProps={{ readOnly: selectedItem.seeds[0]?.id }}
                />
              </Grid>
            </Grid>
          )}
          <Grid gap="0.5rem">
            <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
              <InputGroup
                id="minimumWagerAmount"
                name="minimumWagerAmount"
                label="seed-minimumWagerAmount"
                feedback={errors?.minimumWagerAmount}
                status={errors?.minimumWagerAmount && 'error'}
                value={selectedItem?.seeds[0]?.minimumWagerAmount || 0}
                inputType="number"
                onChange={({ target }) => updateSeed('minimumWagerAmount', target.value, 0)}
                onFocus={() => setCurrentInfo(
                    textTranslated({
                      group: 'forms-tabs-helpers',
                      key: 'seed-input-minimumWagerAmount-help',
                      returnDefault: 'nothing',
                    }),
                  )}
                inputProps={{ readOnly: selectedItem.seeds[0]?.id }}
              />
            </Grid>
            <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}>
              <InputGroup
                id="targetAmount"
                name="targetAmount"
                label="max-seed-amount"
                feedback={errors?.targetAmount}
                status={errors?.targetAmount && 'error'}
                value={selectedItem?.seeds[0]?.targetAmount || 0}
                inputType="number"
                onChange={({ target }) => updateSeed('targetAmount', target.value, 0)}
                onFocus={() => setCurrentInfo(
                    textTranslated({
                      group: 'forms-tabs-helpers',
                      key: 'seed-input-targetAmount-help',
                      returnDefault: 'nothing',
                    }),
                  )}
                inputProps={{ readOnly: selectedItem.seeds[0]?.id }}
              />
            </Grid>
          </Grid>
        </>
      ) : (
        <></>
      )}
    </Grid>
  )
}
