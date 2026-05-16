import React, { createRef, useEffect, useState } from 'react'
import Card from 'components/cards/card'
import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'
import Button from 'components/uiKit/buttons'
import {
  XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line,
} from 'recharts'
import { useThemeWatcher } from 'utils/customHooks'
import { WinEvents } from 'utils/services/api/requests/simulator'

function downDataSize(data: WinEvents[], targetLength: number) {
  if (!data || data.length === 0) return []
  if (data.length <= targetLength) return data

  const binSize = data.length / targetLength
  const downsampledData: any[] = []

  for (let i = 0; i < targetLength; i += 1) {
    const startIdx = Math.floor(i * binSize)
    const endIdx = Math.floor((i + 1) * binSize)
    const binSlice = data.slice(startIdx, Math.max(endIdx, startIdx + 1))
    if (binSlice.length === 0) continue

    const avg = (key: keyof WinEvents) => binSlice.reduce((acc, curr) => acc + (Number(curr[key]) || 0), 0) / binSlice.length

    downsampledData.push({
      winningAmount: avg('winningAmount'),
      currentPoolAmount: avg('currentPoolAmount'),
      currentSeedAmount: avg('currentSeedAmount'),
      winningIteration: binSlice[binSlice.length - 1].winningIteration,
      winningTier: binSlice[binSlice.length - 1]?.winningTier ?? Math.round(avg('winningTier') || 0),
    })
  }
  return downsampledData
}

type Props = { data: WinEvents[]; title?: string; maxPointsPerTier?: number }

export default function SimulatorTierGraphs({ data = [], title, maxPointsPerTier = 1000 }: Props) {
  const [chartWidth, setChartWidth] = useState(400)
  const containerRef: any = createRef()
  const theme = useThemeWatcher()
  const cardColor = theme === 'light' ? 'primary' : 'primary-full'

  // visibility state per tier for each metric
  const [visibility, setVisibility] = useState<Record<number, {
    winningAmount: boolean
    currentPoolAmount: boolean
    currentSeedAmount: boolean
  }>>({})

  useEffect(() => {
    function update() {
      if (containerRef.current) setChartWidth(containerRef.current.clientWidth || 400)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [containerRef])

  // group by tier (use 0 for undefined/null)
  const tiers = Array.from(new Set((data || []).map((d) => (d.winningTier ?? 0)))).sort((a, b) => a - b)

  // initialize visibility for tiers when data/tiers change
  useEffect(() => {
    if (!tiers || tiers.length === 0) return
    setVisibility((prev) => {
      const next = { ...prev }
      tiers.forEach((t) => {
        if (!next.hasOwnProperty(t)) {
          next[t] = { winningAmount: true, currentPoolAmount: true, currentSeedAmount: true }
        }
      })
      // remove tiers that no longer exist
      Object.keys(next).forEach((k) => {
        if (!tiers.includes(Number(k))) delete next[Number(k)]
      })
      return next
    })
  }, [JSON.stringify(tiers)])

  function toggleVisibility(tier: number, key: keyof typeof visibility[number]) {
    setVisibility((prev) => ({
      ...prev,
      [tier]: {
        ...prev[tier],
        [key]: !prev[tier]?.[key],
      },
    }))
  }

  function DataFormatter(n: number) {
    if (n > 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`
    if (n > 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
    if (n > 1_000) return `${(n / 1_000).toFixed(2)}K`
    return `${n}`
  }

  function TierTooltip({ payload }: any) {
    const info = payload?.length ? payload[0]?.payload : null
    if (!info) return <></>

    return (
      <Card width="300px" color="secondary" style={{ backgroundColor: 'var(--secondary-900)', color: '#fff' }}>
        <Grid>
          <Typography
            translateGroup="simulator"
            translateKey="Winning Tier"
            style={{ width: '100%' }}
          />
          <Typography weight={600} elementType="p">{String(info.winningTier)}</Typography>
        </Grid>
        <Grid>
          <Typography
            translateGroup="simulator"
            translateKey="Winning Iteration"
            style={{ width: '100%' }}
          />
          <Typography weight={600} elementType="p">{String(info.winningIteration)}</Typography>
        </Grid>
        <Grid>
          <Typography
            translateGroup="simulator"
            translateKey="Current Pool Amount"
            style={{ width: '100%' }}
          />
          <Typography color="var(--info)" weight={600} elementType="p">{Number(info.currentPoolAmount).toFixed(2)}</Typography>
        </Grid>
        <Grid>
          <Typography
            translateGroup="simulator"
            translateKey="Current Seed Amount"
            style={{ width: '100%' }}
          />
          <Typography  weight={600} elementType="p">{Number(info.currentSeedAmount).toFixed(2)}</Typography>
        </Grid>
        <Grid>
          <Typography
            translateGroup="simulator"
            translateKey="Winning Amount"
            style={{ width: '100%' }}
          />
          <Typography color="var(--success)" weight={600} elementType="p">{Number(info.winningAmount).toFixed(2)}</Typography>
        </Grid>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return <Card color={cardColor}><div ref={containerRef}><Grid padding={['p-3']}><Typography>{title ?? 'No data'}</Typography></Grid></div></Card>
  }

  return (
    <Card color={cardColor}>
      <div ref={containerRef} style={{ width: '100%' }}>
        <Grid padding={['p-3']}>
          <Typography weight={600}>{title ?? 'Winning tiers'}</Typography>
        </Grid>

        {tiers.map((tier) => {
          const series = data.filter((d) => (d.winningTier ?? 0) === tier)
          const ds = downDataSize(series, maxPointsPerTier)
          const vis = visibility[tier] ?? { winningAmount: true, currentPoolAmount: true, currentSeedAmount: true }

          return (
            <Grid key={`tier-${tier}`} style={{ marginBottom: '1rem' }}>
              <Grid padding={['p-2']}>
                <Typography weight={600}>
                  Tier {tier}
                </Typography>
              </Grid>
              <LineChart
                data={ds}
                width={Math.max(200, chartWidth * 0.95)}
                height={Math.max(80, chartWidth * 0.18)}
                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.08} />
                <XAxis dataKey="winningIteration" tickFormatter={(v) => String(v)} />
                <YAxis domain={['auto', 'auto']} tickFormatter={DataFormatter} />
                <Tooltip content={<TierTooltip />} />
                {vis.winningAmount && (
                  <Line type="monotone" dataKey="winningAmount" stroke="var(--success)" dot={false} strokeWidth={2} />
                )}
                {vis.currentPoolAmount && (
                  <Line type="monotone" dataKey="currentPoolAmount" stroke="var(--info)" dot={false} strokeWidth={2} />
                )}
                {vis.currentSeedAmount && (
                  <Line type="monotone" dataKey="currentSeedAmount" stroke="var(--warning)" dot={false} strokeWidth={2} />
                )}
              </LineChart>
              <Grid gap="0.5rem" horizontalAlgin="center">
                <Button
                  id={`winning-cta-${tier}`}
                  color={vis.winningAmount ? 'success' : 'success-outline'}
                  onClick={() => toggleVisibility(tier, 'winningAmount')}
                >
                  <Typography
                    translateGroup="simulator"
                    translateKey="Winning Amount"
                    weight={600}
                  />
                </Button>
                <Button
                  id={`pool-cta-${tier}`}
                  color={vis.currentPoolAmount ? 'info' : 'info-outline'}
                  onClick={() => toggleVisibility(tier, 'currentPoolAmount')}
                >
                  <Typography
                    translateGroup="simulator"
                    translateKey="Current Pool Amount"
                    weight={600}
                  />
                </Button>
                <Button
                  id={`seed-cta-${tier}`}
                  color={vis.currentSeedAmount ? 'warning' : 'warning-outline'}
                  onClick={() => toggleVisibility(tier, 'currentSeedAmount')}
                >
                  <Typography
                    translateGroup="simulator"
                    translateKey="Current Seed Amount"
                    weight={600}
                  />
                </Button>
              </Grid>
            </Grid>
          )
        })}
      </div>
    </Card>
  )
}