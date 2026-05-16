import React, { useEffect, useState } from 'react'
import Grid from 'components/uiKit/grid'
import { textTranslated } from 'components/TextTranslated'
import InputGroup from 'components/uiKit/inputs/inputGroup'
import RangeInput from 'components/uiKit/inputs/inputGroup/variants/rangeInput'
import Typography from 'components/uiKit/typography'
import Button from 'components/uiKit/buttons'
import {
  SimulatorResponse,
  buildJackpotSimulationBet,
  defineContributionType,
} from 'utils/services/api/requests/simulator'
import { PiMathOperationsDuotone } from 'react-icons/pi'
import Loading from 'assets/loading'
import { FormContext } from '../..'
import { CrudContext } from '../../..'
import SimulatorDashGraph from './SimulatorDashGraph'
import SimulatorStatistics from './SimulatorStatistics'

export default function SimulatorTab() {
  const { selectedItem } = React.useContext(CrudContext)
  const {
 errors, setCurrentInfo, validateTab,
} = React.useContext(FormContext)
  const [loading, setLoading] = useState(false)
  const [simulatorItems, setSimulatorItems] = useState({
    wagerAmount: 10,
    iterations: 1000000,
  })
  useEffect(() => {
    validateTab('simulator')
  }, [
    selectedItem.internalName,
    selectedItem.internalDescription,
    selectedItem.currency,
  ])
  const [simulatorResponse, setSimulatorResponse] = useState<SimulatorResponse>()
  const simulatorData = {
    wagerAmount: simulatorItems.wagerAmount,
    iterations: simulatorItems.iterations,
    averageWinAmount: selectedItem?.averageWinAmount || 0,
    fixedWinAmount: selectedItem?.fixedWinAmount || 0,
    minimumWagerAmount: selectedItem?.minimumWagerAmount || 0,
    maximumWagerAmount: selectedItem?.maximumWagerAmount || 0,
    minimumWinAmount: selectedItem?.minimumWinAmount || 0,
    maximumWinAmount: selectedItem?.maximumWinAmount || 0,
    jackpotType: selectedItem?.type,
    volatility: selectedItem?.volatility || 0,
    maximumWins: selectedItem?.maximumWins || 0,
    poolContributionType:
      defineContributionType(selectedItem?.pools[0], 'contributionType')
      || selectedItem?.pools[0]?.contributionType
      || 0,
    contributionAmount: selectedItem?.pools?.[0]?.contributionAmount || 0,
    seedContributionAmount: selectedItem?.seeds?.[0]?.contributionAmount || 0,
    seedTargetAmount: selectedItem?.seeds?.[0]?.targetAmount || 0,
    poolTargetAmount: selectedItem?.pools?.[0]?.targetAmount || 0,
    startingPoolAmount: selectedItem?.pools?.[0]?.currentAmount || 0,
    minimumAmount: selectedItem?.pools?.[0]?.minimumAmount || 0,
    maximumAmount: selectedItem?.pools?.[0]?.maximumAmount || 0,
    startingSeedAmount: selectedItem?.seeds?.[0]?.currentAmount || 0,
    seedContributionType:
      defineContributionType(selectedItem?.seeds[0], 'type')
      || selectedItem?.seeds[0]?.type
      || 0,
    poolPlayerContributionPercent:
      selectedItem?.pools?.[0]?.playerContributionPercent || 0,
    seedPlayerContributionPercent:
      selectedItem?.seeds?.[0]?.playerContributionPercent || 0,
    model: selectedItem?.model,
    durationInMinutes: selectedItem?.durationInMinutes || 0,
    intervalInMinutes: selectedItem?.intervalInMinutes || 0,
    startDate: selectedItem?.startDate,
    endDate: selectedItem?.endDate,
    mustDropPeriod: selectedItem?.mustDropPeriod,
    targetAmount: selectedItem?.targetAmount || 0,
  }

  function handleSimulate() {
    setLoading(true)
    buildJackpotSimulationBet({
      data: selectedItem,
      query: {
        iterations: simulatorItems.iterations,
        wager: simulatorItems.wagerAmount,
      },
    })
      .then((res) => {
        setLoading(false)
        setSimulatorResponse(res.data)
      })
      .catch((err) => {
        setLoading(false)
      })
  }

  if (loading) {
    return (
      <Grid gap="1rem">
        <Grid horizontalAlgin="center">
          <PiMathOperationsDuotone size={100} />
        </Grid>
        <Grid horizontalAlgin="center">
          <Loading size={50} />
        </Grid>
        <Grid horizontalAlgin="center">
          <Typography
            translateGroup="jackpot-simulator"
            translateKey="Just-a-sec-we-are-doing-some-calcs-based-on-your-model."
          />
        </Grid>
      </Grid>
    )
  }

  return (
    <Grid gap="0.5rem">
      <Grid gap="0.5rem" width="200px">
        <InputGroup
          id="wagerAmount"
          name="wagerAmount"
          label="wagerAmount"
          feedback={errors?.wagerAmount}
          status={errors?.wagerAmount && 'error'}
          value={simulatorItems.wagerAmount}
          onChange={({ target }) => {
            setSimulatorItems((current: any) => ({
              ...current,
              wagerAmount: target.value,
            }))
          }}
          onFocus={() => setCurrentInfo(
              textTranslated({
                group: 'forms-tabs-helpers',
                key: 'input-wagerAmount-help',
                returnDefault: 'nothing',
              }),
            )}
        />
        <Grid>
          <RangeInput
            min={1000}
            max={10000000}
            step={1}
            id="iterations"
            name="iterations"
            label="iterations"
            feedback={errors?.iterations}
            status={errors?.iterations && 'error'}
            value={simulatorItems.iterations}
            onChange={({ target }) => {
              setSimulatorItems((current: any) => ({
                ...current,
                iterations: target.value,
              }))
            }}
            onFocus={() => setCurrentInfo(
                textTranslated({
                  group: 'forms-tabs-helpers',
                  key: 'input-iterations-help',
                  returnDefault: 'nothing',
                }),
              )}
          />
        </Grid>
        <Grid>
          <Button block id="simulate-cta" onClick={() => handleSimulate()}>
            <Typography
              translateGroup="jackpot-simulator"
              translateKey="simulate"
            />
          </Button>
        </Grid>
      </Grid>

      <Grid width="calc(100% - 200px - 0.5rem)" hidden={!simulatorResponse}>
        <SimulatorStatistics
          simulatorData={simulatorData}
          simulatorResponse={simulatorResponse as SimulatorResponse}
        />
      </Grid>
      <Grid>
        {simulatorResponse && (
          <SimulatorDashGraph data={simulatorResponse?.winEvents} />
        )}
      </Grid>
    </Grid>
  )
}
