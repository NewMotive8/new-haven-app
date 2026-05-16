import Loading from 'assets/loading'
import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'
import { useContext } from 'react'
import { PiMathOperationsDuotone } from 'react-icons/pi'
import {
  SimulatorResponse,
  defineContributionType,
} from 'utils/services/api/requests/simulator'
import { SimulatorCrudContext } from '../..'
import SimulatorDashGraph from './SimulatorDashGraph'
import SimulatorStatistics from './SimulatorStatistics'
import SimulatorTierGraphs from './SimulatorTierGraph'

export default function ResultSteps() {
  const {
 selectedItem, isLoading, rageSimulator, simulatorResponse,
} = useContext(SimulatorCrudContext)

  const simulatorData = {
    wagerAmount: rageSimulator.wager,
    iterations: rageSimulator.iterations,
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
      selectedItem?.pools[0]?.length > 0
        ? defineContributionType(selectedItem?.pools[0], 'contributionType')
          || selectedItem?.pools[0]?.contributionType
          || 0
        : 0,
    contributionAmount: selectedItem?.pools?.[0]?.contributionAmount || 0,
    seedContributionAmount: selectedItem?.seeds?.[0]?.contributionAmount || 0,
    seedTargetAmount: selectedItem?.seeds?.[0]?.targetAmount || 0,
    poolTargetAmount: selectedItem?.pools?.[0]?.targetAmount || 0,
    startingPoolAmount: selectedItem?.pools?.[0]?.currentAmount || 0,
    minimumAmount: selectedItem?.pools?.[0]?.minimumAmount || 0,
    maximumAmount: selectedItem?.pools?.[0]?.maximumAmount || 0,
    startingSeedAmount: selectedItem?.seeds?.[0]?.currentAmount || 0,
    seedContributionType:
      selectedItem?.seeds[0]?.length > 0
        ? defineContributionType(selectedItem?.seeds[0], 'type')
          || selectedItem?.seeds[0]?.type
          || 0
        : 0,
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
  }
  if (isLoading) {
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
      <Grid width="calc(100%)" hidden={!simulatorResponse}>
        <SimulatorStatistics
          simulatorData={simulatorData}
          simulatorResponse={simulatorResponse as SimulatorResponse}
        />
      </Grid>
      <Grid>
        {simulatorResponse && (
         <Grid gap="0.5rem">
            <SimulatorDashGraph data={simulatorResponse?.winEvents} />
            <SimulatorTierGraphs data={simulatorResponse?.winEvents} title="Winning tiers" />
          </Grid>
        )}

      </Grid>
    </Grid>
  )
}
