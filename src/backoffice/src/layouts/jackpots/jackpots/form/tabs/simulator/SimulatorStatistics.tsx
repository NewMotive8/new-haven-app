import InfoCard from 'components/cards/infoCard'
import GenericCarousel from 'components/genericCarousel'
import Typography from 'components/uiKit/typography'
import React from 'react'
import { BsCurrencyDollar, BsTrophy, BsWallet } from 'react-icons/bs'
import { GiMoneyStack, GiTargetPrize } from 'react-icons/gi'
import { useThemeWatcher } from 'utils/customHooks'
import { SimulatorData, SimulatorResponse } from 'utils/services/api/requests/simulator'
import { TfiTarget } from 'react-icons/tfi'
import { FaMoneyBillTransfer, FaMoneyBillTrendUp } from 'react-icons/fa6'
import Grid from 'components/uiKit/grid'

interface Props {
    simulatorResponse: SimulatorResponse,
    simulatorData: SimulatorData,
}

const calculateAverage = (numerator: number, denominator: number, decimalPlaces: number, maxLength: number) => {
    let result: number | string = numerator / denominator || 0
    const resultString = result.toString()
    if (resultString.length > maxLength) {
        result = result.toFixed(decimalPlaces)
    }
    return parseFloat(`${result}`)
}
export default function SimulatorStatistics(props: Props) {
    const { simulatorResponse, simulatorData } = props
    const {
        iterations,
        winCounter,
        winAmountCounter,
        contributionCounter,
        poolContribution,
        maxWin,
        rtp,
        averageWinAmount,
    } = simulatorResponse

    const averageWins = calculateAverage(winCounter, iterations, 10, 12)
    const averageAmountWon = calculateAverage(winAmountCounter, winCounter, 2, Infinity)
    const contributionRatio = calculateAverage(contributionCounter, winAmountCounter, 6, 8)
    const target = (poolContribution / (simulatorData.averageWinAmount || simulatorData.fixedWinAmount || simulatorData.maximumWinAmount)).toFixed(6)

    const theme = useThemeWatcher()
    const cardColor = theme === 'light' ? 'primary' : 'primary-full'

    const responsiveWidth = 'calc(100% / 4 - (3rem / 4))'

    return (
        <Grid gap="1rem" verticalAlgin="stretch">
            <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.5rem)', xxl: responsiveWidth }} style={{ minWidth: '230px' }}>
                <InfoCard
                    color={cardColor}
                    label="wins"
                    icon={<BsTrophy />}
                    content={winCounter}
                    height="100%"
                />
            </Grid>
            <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.5rem)', xxl: responsiveWidth }} style={{ minWidth: '230px' }}>
                <InfoCard
                    color={cardColor}
                    label={simulatorData.model === 1
                        ? 'Fixed Amount Won'
                        : 'Average Amount Won'}
                    icon={<BsWallet />}
                    content={averageWinAmount}
                    height="100%"
                />
            </Grid>
            <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.5rem)', xxl: responsiveWidth }} style={{ minWidth: '230px' }}>
                <InfoCard
                    color={cardColor}
                    label="contribution-ratio-and-rtp"
                    icon={<BsCurrencyDollar />}
                    content={(
                        <Grid gap="1.5rem">
                            <Grid gap="0.5rem" responsiveWidth={{ sm: 100, md: 'calc(50% - 0.75rem)' }}>
                                <Typography translateGroup="simulator" weight={600} translateKey="contribution-ratio" style={{ width: '100%', textAlign: 'center' }} />
                                <Typography style={{ width: '100%', textAlign: 'center' }}>
                                    {contributionRatio}
                                </Typography>
                            </Grid>
                            <Grid gap="0.5rem" responsiveWidth={{ sm: 100, md: 'calc(50% - 0.75rem)' }}>
                                <Typography translateGroup="simulator" weight={600} translateKey="rtp" style={{ width: '100%', textAlign: 'center' }} />
                                <Typography style={{ width: '100%', textAlign: 'center' }}>
                                    {`${rtp}`}
                                </Typography>
                            </Grid>
                        </Grid>

                    )}
                    height="100%"
                />
            </Grid>
            <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.5rem)', xxl: responsiveWidth }} style={{ minWidth: '230px' }}>
                <InfoCard
                    color={cardColor}
                    label="Wins x Runs"
                    icon={<GiTargetPrize />}
                    height="100%"
                    content={(
                        <Typography
                            translateGroup="simulator"
                            translateKey="win-x-runs-value"
                            replaces={[
                                { code: '{{wins}}', value: winCounter },
                                { code: '{{runs}}', value: iterations },
                            ]}
                            returnDefault="defaultContent"
                            defaultContent={(
                                <p>
                                    There were
                                    <b>
                                        {` ${winCounter} `}
                                    </b>
                                    wins
                                    <br />
                                    from
                                    <b>
                                        {` ${iterations} `}
                                    </b>
                                    runs.
                                </p>
                            )}
                        />

                    )}
                />
            </Grid>
            <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.5rem)', xxl: responsiveWidth }} style={{ minWidth: '230px' }}>
                <InfoCard
                    color={cardColor}
                    label="target"
                    icon={<TfiTarget />}
                    height="100%"
                    content={(
                        <Typography
                            translateGroup="simulator"
                            translateKey="target-vs-wins"
                            replaces={[
                                { code: '{{target}}', value: winCounter },
                                { code: '{{averageWins}}', value: averageWins },
                            ]}
                            returnDefault="defaultContent"
                            defaultContent={(
                                <p>
                                    From a target of
                                    <br />
                                    <b>
                                        {` ${target}`}
                                    </b>
                                    , we got
                                    <b>
                                        {` ${averageWins}`}
                                    </b>
                                </p>
                            )}
                        />

                    )}
                />
            </Grid>
            <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.5rem)', xxl: responsiveWidth }} style={{ minWidth: '230px' }}>
                <InfoCard
                    color={cardColor}
                    label="won"
                    icon={<FaMoneyBillTrendUp />}
                    height="100%"
                    content={(
                        <Typography
                            translateGroup="simulator"
                            translateKey="total-won-info"
                            replaces={[
                                { code: '{{winAmountCounter}}', value: `${parseFloat(`${winAmountCounter}`)?.toFixed(2)}` },
                                { code: '{{winTarget}}', value: `${simulatorData.averageWinAmount || simulatorData.fixedWinAmount || simulatorData.maximumWinAmount} ` },
                                { code: '{{averageAmountWon}}', value: averageAmountWon },
                            ]}
                            returnDefault="defaultContent"
                            defaultContent={(
                                <p>
                                    In total,
                                    <b>
                                        {`${parseFloat(`${winAmountCounter}`)?.toFixed(2)}`}
                                    </b>
                                    was won,
                                    <br />
                                    making an average of
                                    <b>
                                        {` ${(averageAmountWon)} `}
                                    </b>
                                    per win while targeting
                                    <b>
                                        {`${simulatorData.averageWinAmount || simulatorData.fixedWinAmount || simulatorData.maximumWinAmount} `}
                                    </b>
                                </p>
                            )}
                        />

                    )}
                />
            </Grid>
            <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.5rem)', xxl: responsiveWidth }} style={{ minWidth: '230px' }}>
                <InfoCard
                    color={cardColor}
                    label="Contributions"
                    icon={<FaMoneyBillTransfer />}
                    height="100%"
                    content={(
                        <Typography
                            translateGroup="simulator"
                            translateKey="Contributions-info"
                            replaces={[
                                { code: '{{contributionCounter}}', value: `${contributionCounter?.toFixed(2)}` },
                                { code: '{{contributionRatio}}', value: contributionRatio },
                            ]}
                            returnDefault="defaultContent"
                            defaultContent={(
                                <p>
                                    In total we received
                                    <b>
                                        {` ${contributionCounter?.toFixed(2)} `}
                                    </b>

                                    in contributions,
                                    <br />
                                    giving a contribution ratio of
                                    <b>
                                        {` ${contributionRatio}`}
                                    </b>
                                </p>
                            )}
                        />

                    )}
                />
            </Grid>
            <Grid responsiveWidth={{ sm: 100, md: 'calc(50% - 0.5rem)', xxl: responsiveWidth }} style={{ minWidth: '230px' }}>
                <InfoCard
                    color={cardColor}
                    label="Max Won"
                    icon={<GiMoneyStack />}
                    height="100%"
                    content={(
                        <Typography
                            translateGroup="simulator"
                            translateKey="Max-Won-info"
                            replaces={[
                                { code: '{{maxWin}}', value: `${maxWin}` },
                            ]}
                            returnDefault="defaultContent"
                            defaultContent={(
                                <p>
                                    Maximum single
                                    <br />
                                    amount won:
                                    <b>
                                        {parseFloat(`${maxWin}`).toFixed(2)}
                                    </b>
                                </p>
                            )}
                        />

                    )}
                />
            </Grid>
        </Grid>

    )
}
