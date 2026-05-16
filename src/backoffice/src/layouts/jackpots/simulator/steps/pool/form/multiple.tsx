import { textTranslated } from 'components/TextTranslated'
import Card from 'components/cards/card'
import ExpandCollapseCard from 'components/cards/expandCollapseCard'
import InfoCard from 'components/cards/infoCard'
import Button from 'components/uiKit/buttons'
import Grid from 'components/uiKit/grid'
import TypeButton from 'components/uiKit/inputs/TypeButton'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import RangeInput from 'components/uiKit/inputs/inputGroup/variants/rangeInput'
import Typography from 'components/uiKit/typography'
import BrandContext from 'context/brand'
import { SimulatorCrudContext } from 'layouts/jackpots/simulator'
import { useContext, useEffect, useState } from 'react'
import { BsCoin, BsTools, BsTrash } from 'react-icons/bs'
import { useThemeWatcher } from 'utils/customHooks'
import { formatCurrency } from 'utils/functions/numbers'
import { PoolType, poolsI } from 'utils/services/api/requests/pools'
import { useSeedForm } from '../../seed/useSeed'
import { usePoolForm } from '../usePool'

interface MenuStates {
  [key: string]: boolean
}
export default function FormPoolMulti() {
  const {
 selectedItem, setCurrentInfo, setSelectedItem, errors,
} = useContext(SimulatorCrudContext)
  const [menuStates, setMenuStates] = useState<MenuStates>({})
  const [expand, setExpand] = useState(false)
  const { currentBrand } = useContext(BrandContext)
  const { addPool, removePool, updatePool, updatePoolsCommonFields } = usePoolForm(
    selectedItem,
    setSelectedItem,
  )
  const { addSeed, removeSeed, updateSeed } = useSeedForm(selectedItem, setSelectedItem)

  function handlerDelet(position: any) {
    if (!selectedItem.id) {
      removePool(position)
      removeSeed(position)
    }
  }
  const theme = useThemeWatcher()
  const cardColor = theme === 'light' ? 'primary' : 'primary-full'
  const { model } = selectedItem
  const toggleMenu = (attendeeId: string) => {
    setMenuStates((prevState: any) => ({
      ...prevState,
      [attendeeId]: !prevState[attendeeId] || false,
    }))
  }
  useEffect(() => {
    if (!selectedItem.id) {
      toggleMenu('0')
    }
  }, [])
  return (
    <>
      <Grid gap="1rem">
        <Grid gap="1rem">
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
              onChange={({ target }) => updatePoolsCommonFields('contributionType', target.value)}
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
            <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.5rem/2)' }}>
              {(selectedItem.pools[0].contributionType || 1)
              === PoolType.Fixed ? (
                <InputGroup
                  id="contributionAmount"
                  name="contributionAmount"
                  label="pool-contribution-amount-fixed"
                  feedback={errors?.contributionAmount}
                  status={errors?.contributionAmount && 'error'}
                  value={selectedItem?.pools[0]?.contributionAmount || 0}
                  onChange={({ target }) => updatePoolsCommonFields('contributionAmount', target.value)}
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
                  onChange={({ target }) => updatePoolsCommonFields('contributionAmount', target.value)}
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
                  label="pool-playerContributionPercent"
                  feedback={errors?.playerContributionPercent}
                  status={errors?.playerContributionPercent && 'error'}
                  value={
                    Number(selectedItem.pools[0]?.playerContributionPercent)
                    || 0.0
                  }
                  onChange={({ target }) => {
                    const { name, value } = target
                    if (/^\d+(\.\d{0,2})?$/.test(value)) {
                      const parsedValue = parseFloat(value) || 0
                      const reactValue = (100 - parsedValue).toFixed(2)

                      updatePoolsCommonFields(name, value)
                      updatePoolsCommonFields('operatorContribution', reactValue)
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
                      - parseFloat(
                        selectedItem.pools[0]?.playerContributionPercent,
                      )
                    ).toFixed(2)
                  }
                  onChange={({ target }) => {
                    const { name, value } = target
                    if (/^\d+(\.\d{0,2})?$/.test(value)) {
                      const parsedValue = parseFloat(value) || 0
                      const reactValue = (100 - parsedValue).toFixed(2)

                      updatePoolsCommonFields(name, value)
                      updatePoolsCommonFields('playerContributionPercent', reactValue)
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
          )}
        </Grid>

        <Grid gap="1rem">
          {selectedItem?.pools.map((_: poolsI, index: any) => (
            <ExpandCollapseCard
              color="primary-full"
              key={index}
              header={(
                <Grid wrap="nowrap" horizontalAlgin="space-between">
                  <Grid gap="0.5rem">
                    <Typography
                      translateGroup="jackpot-pool"
                      translateKey="tier"
                    />
                    <Typography>{` ${index + 1}`}</Typography>
                  </Grid>
                  <BsTrash onClick={() => handlerDelet(index)} />
                </Grid>
              )}
            >
              <Grid
                style={{
                  padding: menuStates[index] ? '1rem' : '0',
                  transition: 'padding 0.5s ease-in-out',
                }}
                gap="1rem"
              >
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

                <Grid gap="1rem">
                  <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.5rem)' }}>
                    {model === 2 ? (
                      <InputGroup
                        inputType="number"
                        id="averageWinAmount"
                        name="averageWinAmount"
                        label="averageWinAmount"
                        feedback={errors?.averageWinAmount}
                        status={errors?.averageWinAmount && 'error'}
                        value={selectedItem?.pools[index].averageWinAmount}
                        onChange={({ target }) => {
                          updatePool(target.name, target.value, index)
                        }}
                        onFocus={() => setCurrentInfo(
                            textTranslated({
                              group: 'forms-tabs-helpers',
                              key: 'input-averageWinAmount-help',
                              returnDefault: 'nothing',
                            }),
                          )}
                        inputProps={{ readOnly: !!selectedItem.id }}
                      />
                    ) : model === 3 ? (
                      <InputGroup
                        inputType="number"
                        id="maximumWinAmount"
                        name="maximumWinAmount"
                        label="maximumWinAmount"
                        feedback={errors?.maximumWinAmount}
                        status={errors?.maximumWinAmount && 'error'}
                        value={selectedItem?.pools[index].maximumWinAmount}
                        onChange={({ target }) => {
                          updatePool(target.name, target.value, index)
                         
                        }}
                        onFocus={() => setCurrentInfo(
                            textTranslated({
                              group: 'forms-tabs-helpers',
                              key: 'input-maximumWinAmount-help',
                              returnDefault: 'nothing',
                            }),
                          )}
                        inputProps={{ readOnly: !!selectedItem.id }}
                      />
                    ) : (
                      <></>
                    )}
                  </Grid>
                  <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.5rem)' }}>
                    <Grid>
                      <RangeInput
                        min={0.1}
                        max={0.99}
                        step={0.01}
                        id="multiLevelWeight"
                        name="multiLevelWeight"
                        label="pool-multiLevelWeight"
                        feedback={errors?.multiLevelWeight}
                        status={errors?.multiLevelWeight && 'error'}
                        value={(
                          Number(
                            selectedItem?.pools[index]?.multiLevelWeight,
                          ) || 0
                        ).toFixed(2)}
                        onChange={({ target }) => {
                          updatePool(target.name, target.value, index)
                          updateSeed(target.name, target.value, index)
                        }}
                        onFocus={() => setCurrentInfo(
                            textTranslated({
                              group: 'forms-tabs-helpers',
                              key: 'pool-input-playerContributionPercent-help',
                              returnDefault: 'nothing',
                            }),
                          )}
                        inputProps={{
                          readOnly: !!selectedItem.pools[index]?.id,
                        }}
                      />
                    </Grid>
                  </Grid>
                  <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.5rem)' }}>
                    <InputGroup
                      inputType="number"
                      id="currentAmount"
                      name="currentAmount"
                      label="initial-jackpot-amount"
                      feedback={errors?.currentAmount}
                      status={errors?.currentAmount && 'error'}
                      value={selectedItem?.pools[index]?.currentAmount || 0}
                      onChange={({ target }) => {
                        updatePool(target.name, target.value, index)
                      }}
                      onFocus={() => setCurrentInfo(
                          textTranslated({
                            group: 'forms-tabs-helpers',
                            key: 'input-currentAmount-help',
                            returnDefault: 'nothing',
                          }),
                        )}
                      inputProps={{
                        readOnly: !!selectedItem?.pools[index]?.id,
                      }}
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
                        <Typography
                          translateGroup="global"
                          translateKey="advanced"
                        />
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
                        value={selectedItem.pools[index]?.maximumAmount}
                        inputType="number"
                        onChange={({ target }) => {
                          updatePool(target.name, target.value, index)
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
            </ExpandCollapseCard>
          ))}
        </Grid>
        <Grid>
          <Button
            id="crud-cancelButton"
            onClick={() => {
              addPool()
              addSeed()
            }}
            type="button"
            disabled={selectedItem?.id}
            color="primary-outline"
          >
            <Grid
              wrap="nowrap"
              gap="0.25rem"
              horizontalAlgin="center"
              verticalAlgin="center"
            >
              <Typography
                translateGroup="jackpot-pool"
                translateKey="add-more-tier"
              />
            </Grid>
          </Button>
        </Grid>
      </Grid>
    </>
  )
}
