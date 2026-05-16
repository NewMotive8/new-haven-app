import React, { useContext, useEffect, useState } from 'react'
import Grid from '../../../../../components/uiKit/grid'
import jackpotsApi from '../../../../../utils/services/api/requests/jackpots'
import BrandContext from '../../../../../context/brand'
import Typography from '../../../../../components/uiKit/typography'
import Loading from '../../../../../assets/loading/index'
import AmountChart from './AmountChart'
import EventChart from './EventsChart'
import { convertObject } from './extra'
import OptinChart from './OptinChart'
import Button from '../../../../../components/uiKit/buttons'

interface Pool {
  id: number
  amountPaid: number
  amountContributed: number
  currentAmount: number
  lastPoolTransactionTimestamp: string
  lastSeedTransactionTimestamp: string
  seedId: number
  numberOfWins: number
  numberOfSpins: number
}

interface Optins {
  playersOptedIn: number
  playersNotOptedIn: number
}

interface Jackpot {
  jackpotId: number
  pools: Pool[]
  optins: Optins
}

export interface Statistics {
  jackpots: Jackpot[]
  totalEvents: number
  maximumEvents: number
}

export interface Snapshot {
  id: number
  brandId: number
  statistics: any
  createdDate: string
  lastModifiedDate: string
}

function downloadCSV(filename: string, data: string[]) {
  // Prepare CSV content: single column, header "playerId"
  const csvContent = ['playerId', ...data].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export default function SnapshotReport({ jackpotId, jackpotName }: any) {
  const [snapshot, setSnapshot] = useState<Snapshot>()
  const [loading, setLoading] = useState(true)
  const { brandId } = useContext(BrandContext)
  const [players, setPlayers] = useState<Snapshot>()

  async function getSnap() {
    setLoading(true)
    if (brandId) {
      jackpotsApi
        .getReportBrand(brandId, jackpotId || '')
        .then((res: any) => {
          setSnapshot(convertObject(res.content))
          setLoading(false)
        })
        .catch((err) => {
          setLoading(false)
        })
    }
  }
  useEffect(() => {
    getSnap()
  }, [jackpotId])

  const DataFormatter = (number: number) => {
    if (number > 1000000000) {
      return `${(number / 1000000000).toString()}B`
    }
    if (number > 1000000) {
      return `${(number / 1000000).toString()}M`
    }
    if (number > 1000) {
      return `${(number / 1000).toString()}K`
    }
    return number?.toString()
  }

  const [loadingOptIn, setLoadingOptIn] = useState(false)
  const [loadingOptOut, setLoadingOptOut] = useState(false)

  const handleDownloadOptIns = async () => {
    setLoadingOptIn(true)
    try {
      const response = await jackpotsApi.getPlayersIdOptIns(jackpotId)
      downloadCSV(`opted-in-players-jackpot-${jackpotId}.csv`, response.data)
    } catch (e) {
      // handle error, show toast or console
      console.error('Failed to download opted-in players:', e)
    }
    setLoadingOptIn(false)
  }

  const handleDownloadOptOuts = async () => {
    setLoadingOptOut(true)
    try {
      const response = await jackpotsApi.getPlayersIdOptOuts(jackpotId)
      downloadCSV(`opted-out-players-jackpot-${jackpotId}.csv`, response.data)
    } catch (e) {
      console.error('Failed to download opted-out players:', e)
    }
    setLoadingOptOut(false)
  }

  return loading ? (
    <Loading />
  ) : (
    <>
      {snapshot?.statistics?.jackpots.map((jackpot: Jackpot) => (
        <div key={jackpot.jackpotId}>
          <Grid gap="0.5rem">
            <Typography
              weight={600}
              size="md"
              translateGroup="global"
              translateKey="jackpot"
            />
            <Typography>{`${jackpotName}`}</Typography>
          </Grid>
          {jackpot.pools.map((pool) => {
            const dataAmount = [
              {
                name: 'Amounts',
                // `amountPaid` is negative to represent payout, but shown as positive for graph display purposes
                Paid: Number(Math.abs(pool.amountPaid).toFixed(2)),
                gap: Number((pool.amountPaid * 0.05).toFixed(2)),
                Contributed: Number(pool.amountContributed.toFixed(2)),
                Current: Number(pool.currentAmount.toFixed(2)),
              },
            ]
     
            const dataEvent = [
              {
                name: `Events (max. ${DataFormatter(
                  snapshot.statistics.maximumEvents,
                )})`,
                'Number of Spins': pool.numberOfSpins,
                'Number of Wins': pool.numberOfWins,
              },
            ]

            const dataOptins = [
              {
                name: 'Opt-ins',
                'Opted In': jackpot.optins?.playersOptedIn ?? 0,
                'Not Opted In': jackpot.optins?.playersNotOptedIn ?? 0,
              },
            ]

            return (
              <div key={pool.id}>
               <h3>
                  {`Pool ID: ${pool.id}`}
                </h3>

                <Grid gap="1rem">
                  <Grid responsiveWidth={{ xsm: '100%', md: '30%' }}>
                    <AmountChart data={dataAmount} />
                  </Grid>
                  <Grid responsiveWidth={{ xsm: '100%', md: '30%' }}>
                    <EventChart data={[dataEvent[0]]} />
                  </Grid>
                  <Grid responsiveWidth={{ xsm: '100%', md: '30%' }}>
                    <OptinChart data={dataOptins} />
                  </Grid>
                </Grid>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <Button
                    onClick={handleDownloadOptIns}
                    disabled={loadingOptIn}
                    id=""
                  >
                    {loadingOptIn
                      ? 'Downloading Opt-Ins...'
                      : 'Download Opted-In Players'}
                  </Button>
                  <Button
                    onClick={handleDownloadOptOuts}
                    disabled={loadingOptOut}
                    id=""
                  >
                    {loadingOptOut
                      ? 'Downloading Opt-Outs...'
                      : 'Download Opted-Out Players'}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </>
  )
}