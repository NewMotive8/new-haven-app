import Card from 'components/cards/card'
import Button from 'components/uiKit/buttons'
import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'
import React, { createRef, useEffect, useState } from 'react'
import {
    XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line,
} from 'recharts'
import { useThemeWatcher } from 'utils/customHooks'
import { WinEvents } from 'utils/services/api/requests/simulator'

function downDataSize(data: WinEvents[], targetLength: number) {
    if (data.length <= targetLength) {
        return data
    }

    const binSize = data.length / targetLength
    const downsampledData = []

    for (let i = 0; i < targetLength; i += 1) {
        const startIdx = Math.floor(i * binSize)
        const endIdx = Math.floor((i + 1) * binSize)
        const binSlice = data.slice(startIdx, endIdx)

        const avgWinningAmount = binSlice.reduce((acc, curr) => acc + curr.winningAmount, 0) / binSlice.length
        const avgCurrentPoolAmount = binSlice.reduce((acc, curr) => acc + curr.currentPoolAmount, 0) / binSlice.length
        const avgCurrentSeedAmount = binSlice.reduce((acc, curr) => acc + curr.currentSeedAmount, 0) / binSlice.length
        const representativeWinningIteration = binSlice[binSlice.length - 1].winningIteration

        downsampledData.push({
            winningAmount: avgWinningAmount,
            currentPoolAmount: avgCurrentPoolAmount,
            currentSeedAmount: avgCurrentSeedAmount,
            winningIteration: representativeWinningIteration,
        })
    }

    return downsampledData
}

export default function SimulatorDashGraph({ data, title }: any) {
    const [lines, setLines] = useState({
        currentPoolAmount: true,
        currentSeedAmount: true,
        winningAmount: true,
    })
    const cardRef: any = createRef()
    const [chartWidth, setChartWidth] = useState(100)
    const DataFormatter = (number: number) => {
        if (number > 1000000000) {
            return `${(number / 1000000000).toString()}B`
        } if (number > 1000000) {
            return `${(number / 1000000).toString()}M`
        } if (number > 1000) {
            return `${(number / 1000).toString()}K`
        }
        return number?.toString()
    }
    function updateChartSize() {
        if (cardRef.current) {
            const cardWidth = cardRef.current?.clientWidth
            setChartWidth(cardWidth)
            cardRef.current?.addEventListener('resize', () => {
                setTimeout(() => {
                    updateChartSize()
                }, 200)
            })
            window.addEventListener('resize', () => {
                setTimeout(() => {
                    updateChartSize()
                }, 200)
            })
        }
    }
    useEffect(() => {
        updateChartSize()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cardRef])

    function customToolTip(props: any) {
        const { payload } = props
        const info: any = payload?.length ? payload[0]?.payload : null

        return info
            ? (
                <Card width="300px" color="secondary" style={{ backgroundColor: 'var(--secondary-900)', transform: 'translateY(-70%)', color: '#fff' }}>
                    <Grid>
                        <Typography
                            translateGroup="simulator"
                            translateKey="Winning Iteration"
                            style={{ width: '100%' }}
                        />
                        <Typography weight={600} elementType="p">
                            {parseFloat(info?.winningIteration)}
                        </Typography>
                    </Grid>
                    <Grid>
                        <Typography
                            translateGroup="simulator"
                            translateKey="Current Pool Amount"
                            style={{ width: '100%' }}
                        />
                        <Typography color="var(--info)" weight={600} elementType="p">
                            {parseFloat(info?.currentPoolAmount)?.toFixed(2)}
                        </Typography>
                    </Grid>
                   
                    <Grid>
                        <Typography
                            translateGroup="simulator"
                            translateKey="Winning Amount"
                            style={{ width: '100%' }}
                        />
                        <Typography color="var(--success)" weight={600} elementType="p">
                            {parseFloat(info?.winningAmount)?.toFixed(2)}
                        </Typography>
                    </Grid>
                </Card>
            )
            : <></>
    }
    const theme = useThemeWatcher()
    const cardColor = theme === 'light' ? 'primary' : 'primary-full'

    return (
        <Card color={cardColor}>
            <div ref={cardRef} style={{ width: '100%' }}>
                <Grid padding={['p-3']}>
                    <Typography
                        translateGroup="simulator-graph"
                        translateKey=" Win Amount x Pool Amount x Seed Amount"
                        weight={600}
                    />
                </Grid>
                <Grid>
                    <Grid>
                        <LineChart
                            data={downDataSize(data, 1500)}
                            width={(chartWidth * 0.93) || 100}
                            height={(chartWidth * 0.2) || 45}
                            margin={{
                                top: 0,
                                right: 0,
                                left: 0,
                                bottom: 0,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                            <XAxis dataKey="a" />
                            <YAxis domain={['auto', 'auto']} scale="sqrt" tickFormatter={() => ''} />
                            <Tooltip content={(content) => customToolTip(content)} />
                            {
                                lines.winningAmount
                                    ? <Line type="monotone" dataKey="winningAmount" stroke="var(--success)" dot={false} strokeWidth="2px" />
                                    : <></>
                            }
                            {
                                lines.currentPoolAmount
                                    ? <Line type="monotone" dataKey="currentPoolAmount" stroke="var(--info)" dot={false} strokeWidth="2px" />
                                    : <></>
                            }
                            {
                                lines.currentSeedAmount
                                    ? <Line type="monotone" dataKey="currentSeedAmount" stroke="var(--warning)" dot={false} strokeWidth="2px" />
                                    : <></>
                            }
                        </LineChart>
                        <Grid gap="0.5rem" horizontalAlgin="center">
                            <Button
                                id="winning-cta"
                                color={lines.winningAmount ? 'success' : 'success-outline'}
                                onClick={() => { setLines({ ...lines, winningAmount: !lines.winningAmount }) }}
                            >
                                <Typography
                                    translateGroup="global"
                                    translateKey="winning-amount"
                                    weight={600}
                                />
                            </Button>
                            <Button
                                id="current-pool-amount-cta"
                                color={lines.currentPoolAmount ? 'info' : 'info-outline'}
                                onClick={() => { setLines({ ...lines, currentPoolAmount: !lines.currentPoolAmount }) }}
                            >
                                <Typography
                                    translateGroup="global"
                                    translateKey="current-pool-amount-amount"
                                    weight={600}
                                />
                            </Button>
                            <Button
                                id="current-seed-amount-cta"
                                color={lines.currentSeedAmount ? 'warning' : 'warning-outline'}
                                onClick={() => { setLines({ ...lines, currentSeedAmount: !lines.currentSeedAmount }) }}
                            >
                                <Typography
                                    translateGroup="global"
                                    translateKey="current-seed-amount-amount"
                                    weight={600}
                                />
                            </Button>
                        </Grid>
                    </Grid>
                </Grid>
            </div>
        </Card>
    )
}
