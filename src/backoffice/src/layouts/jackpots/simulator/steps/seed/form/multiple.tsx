import { textTranslated } from 'components/TextTranslated'
import Card from 'components/cards/card'
import InfoCard from 'components/cards/infoCard'
import Button from 'components/uiKit/buttons'
import Grid from 'components/uiKit/grid'
import TypeButton from 'components/uiKit/inputs/TypeButton'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import RangeInput from 'components/uiKit/inputs/inputGroup/variants/rangeInput'
import Typography from 'components/uiKit/typography'
import BrandContext from 'context/brand'
import { SimulatorCrudContext } from 'layouts/jackpots/simulator'
import { useContext, useState } from 'react'
import { BsCoin } from 'react-icons/bs'
import { useThemeWatcher } from 'utils/customHooks'
import { formatCurrency } from 'utils/functions/numbers'
import { PoolType } from 'utils/services/api/requests/pools'
import { seedsI } from 'utils/services/api/requests/seeds'
import { useSeedForm } from '../useSeed'
import { usePoolForm } from '../../pool/usePool'

interface MenuStates {
  [key: string]: boolean
}
export default function FormSeedMulti() {
  const {
 selectedItem, setCurrentInfo, setSelectedItem, errors,
  } = useContext(SimulatorCrudContext)

  const { currentBrand } = useContext(BrandContext)
  const [menuStates, setMenuStates] = useState<MenuStates>({})
  const theme = useThemeWatcher()
  const cardColor = theme === 'light' ? 'primary' : 'primary-full'
  const toggleMenu = (attendeeId: string) => {
    setMenuStates((prevState: any) => ({
      ...prevState,
      [attendeeId]: !prevState[attendeeId] || false,
    }))
  }
  const { updateSeed } = useSeedForm(selectedItem, setSelectedItem)
  const { updatePool } = usePoolForm(selectedItem, setSelectedItem)

  return (
    <Grid>
      {selectedItem?.pools.map((_: seedsI, index: any) => (
        <Grid>
          <Grid margin={['mb-4']}>
            <Button
              color={theme === 'light' ? 'primary' : 'primary-full'}
              block
              onClick={() => {}}
              style={{ padding: 0 }}
              id="advanced-toggle"
            >
              <Grid
                gap="0.5rem"
                horizontalAlgin="flex-start"
                wrap="nowrap"
                padding={['pe-2']}
              >
                <Grid
                  gap="0.5rem"
                  onClick={() => toggleMenu(index)}
                  padding={['p-2']}
                >
                  <Typography
                    translateGroup="jackpot-pool"
                    translateKey="tier"
                  />
                  <Typography
                    translateGroup="jackpot-pool-tier"
                    translateKey={index + 1}
                  />
                </Grid>
              </Grid>
            </Button>
          </Grid>

          <Card
            key={index}
            color="transparent"
            style={{
              height: 'fit-content',
              maxHeight: menuStates[index] ? '100%' : '0px',
              transition: 'max-height 0.5s ease-in-out',
              overflow: 'hidden',
              padding: '0',
            }}
          >
            <Grid
              style={{
                padding: menuStates[index] ? '1rem' : '0',
                transition: 'padding 0.5s ease-in-out',
              }}
            >
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
                    value={selectedItem?.seeds[index]?.minimumAmount}
                    onChange={({ target }) => {
                      updateSeed(target.name, target.value, index)
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
                <Grid
                  gap="1rem"
                  hidden={
                    !parseFloat(selectedItem?.seeds[index]?.minimumAmount)
                  }
                >
                  <Grid
                    hidden={!selectedItem.pools[index]?.id}
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

                  <Grid
                    style={{
                      opacity: selectedItem.pools[index]?.id ? 0.7 : 1,
                      pointerEvents: selectedItem.pools[index]?.id
                        ? 'none'
                        : 'unset',
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
                      value={selectedItem?.seeds[index]?.contributionType || 1}
                      name="poolType"
                      onChange={({ target }) => updateSeed('contributionType', target.value, index)}
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
                              <Typography
                                translateGroup="pool-form"
                                translateKey="fixed"
                              />
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
                    <Grid
                      responsiveWidth={{ sm: 100, md: 'calc(50% - 0.5rem/2)' }}
                    >
                      {(selectedItem.seeds[index].contributionType || 1)
                      === PoolType.Fixed ? (
                        <InputGroup
                          id="contributionAmount"
                          name="contributionAmount"
                          label="pool-contribution-amount-fixed"
                          feedback={errors?.contributionAmount}
                          status={errors?.contributionAmount && 'error'}
                          value={
                            selectedItem?.seeds[index]?.contributionAmount || 0
                          }
                          onChange={({ target }) => updateSeed(
                              'contributionAmount',
                              target.value,
                              index,
                            )}
                          inputType="number"
                          onFocus={() => setCurrentInfo(
                              textTranslated({
                                group: 'forms-tabs-helpers',
                                key: 'pool-input-contribution-amount-fixed-help',
                                returnDefault: 'nothing',
                              }),
                            )}
                          inputProps={{
                            readOnly: !!selectedItem.seeds[index]?.id,
                          }}
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
                          value={
                            selectedItem?.seeds[index]?.contributionAmount || 0
                          }
                          onChange={({ target }) => updateSeed(
                              'contributionAmount',
                              target.value,
                              index,
                            )}
                          onFocus={() => setCurrentInfo(
                              textTranslated({
                                group: 'forms-tabs-helpers',
                                key: 'pool-input-contribution-amount-percentage-help',
                                returnDefault: 'nothing',
                              }),
                            )}
                          inputProps={{
                            readOnly: !!selectedItem.seeds[index]?.id,
                          }}
                        />
                      )}
                    </Grid>
                  </Grid>

                  <Grid gap="0.5rem">
                    <Grid
                      responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}
                    >
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
                          Number(
                            selectedItem.seeds[index]
                              ?.playerContributionPercent,
                          ) || 0.0
                        }
                        onChange={({ target }) => {
                          const { name, value } = target
                          if (/^\d+(\.\d{0,2})?$/.test(value)) {
                            const parsedValue = parseFloat(value) || 0
                            const reactValue = (100 - parsedValue).toFixed(2)

                            updateSeed(name, value, index)
                            updateSeed(
                              'operatorContribution',
                              reactValue,
                              index,
                            )
                          }
                        }}
                        onFocus={() => setCurrentInfo(
                            textTranslated({
                              group: 'forms-tabs-helpers',
                              key: 'pool-input-playerContributionPercent-help',
                              returnDefault: 'nothing',
                            }),
                          )}
                        inputProps={{
                          readOnly: !!selectedItem.seeds[index]?.id,
                        }}
                      />
                    </Grid>
                    <Grid
                      responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}
                    >
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
                          selectedItem.seeds[index]?.operatorContribution
                          || (
                            100
                            - parseFloat(
                              selectedItem.seeds[index]
                                ?.playerContributionPercent,
                            )
                          ).toFixed(2)
                        }
                        onChange={({ target }) => {
                          const { name, value } = target
                          if (/^\d+(\.\d{0,2})?$/.test(value)) {
                            const parsedValue = parseFloat(value) || 0
                            const reactValue = (100 - parsedValue).toFixed(2)

                            updateSeed(name, value, index)
                            updateSeed(
                              'playerContributionPercent',
                              reactValue,
                              index,
                            )
                          }
                        }}
                        onFocus={() => setCurrentInfo(
                            textTranslated({
                              group: 'forms-tabs-helpers',
                              key: 'pool-input-operatorContribution-help',
                              returnDefault: 'nothing',
                            }),
                          )}
                        inputProps={{ readOnly: !!selectedItem.seeds[index]?.id }}
                      />
                    </Grid>
                  </Grid>

                  <Grid gap="0.5rem">
                    <Grid
                      responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}
                    >
                      <InputGroup
                        id="minimumWagerAmount"
                        name="minimumWagerAmount"
                        label="seed-minimumWagerAmount"
                        feedback={errors?.minimumWagerAmount}
                        status={errors?.minimumWagerAmount && 'error'}
                        value={
                          selectedItem?.seeds[index]?.minimumWagerAmount || 0
                        }
                        inputType="number"
                        onChange={({ target }) => updateSeed('minimumWagerAmount', target.value, index)}
                        onFocus={() => setCurrentInfo(
                            textTranslated({
                              group: 'forms-tabs-helpers',
                              key: 'seed-input-minimumWagerAmount-help',
                              returnDefault: 'nothing',
                            }),
                          )}
                        inputProps={{ readOnly: selectedItem.seeds[index]?.id }}
                      />
                    </Grid>
                    <Grid
                      responsiveWidth={{ sm: 100, md: 'calc(50% - 0.25rem)' }}
                    >
                      <InputGroup
                        id="targetAmount"
                        name="targetAmount"
                        label="max-seed-amount"
                        feedback={errors?.targetAmount}
                        status={errors?.targetAmount && 'error'}
                        value={selectedItem?.seeds[index]?.targetAmount || 0}
                        inputType="number"
                        onChange={({ target }) => updateSeed('targetAmount', target.value, index)}
                        onFocus={() => setCurrentInfo(
                            textTranslated({
                              group: 'forms-tabs-helpers',
                              key: 'seed-input-targetAmount-help',
                              returnDefault: 'nothing',
                            }),
                          )}
                        inputProps={{ readOnly: selectedItem.seeds[index]?.id }}
                      />
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Card>
        </Grid>
      ))}
    </Grid>
  )
}
