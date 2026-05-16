import ExpandCollapseCard from 'components/cards/expandCollapseCard'
import Grid from 'components/uiKit/grid'
import Typography from 'components/uiKit/typography'
import React from 'react'
import { JackpotI } from 'utils/services/api/requests/jackpots/types'
import { poolsI } from 'utils/services/api/requests/pools'
import MultiTabCard from 'components/cards/multiTabCard'
import PoolMLSummary from './poolMLSummary'
import SeedMLSummary from './seedMLSummary'

interface Props {
    selectedItem: JackpotI
}

export default function MultiLevelTierCardInfo(props: Props) {
    const { selectedItem } = props

    return (
        <Grid gap="0.5rem">
            {
                selectedItem.pools.map((pool: poolsI, index: number) => {
                    return (
                        <ExpandCollapseCard
                            header={(
                                <Grid gap="0.25rem">
                                    <Typography weight={600} size="md" translateGroup="jackpot-summary" translateKey="tier" />
                                    <Typography weight={600} size="md">
                                        {index + 1}
                                    </Typography>
                                </Grid>
                            )}
                            defaultState={!index ? 'expand' : 'collapse'}
                            color="primary-full"
                        >

                            <MultiTabCard
                                color="primary-full"
                                items={[
                                    {
                                        content: <PoolMLSummary pool={pool} />,
                                        title: <Grid padding={['ps-3', 'pe-3']}><Typography translateGroup="jackpot-summary" translateKey="pool" /></Grid>,
                                    },
                                    {
                                        content: <SeedMLSummary seed={selectedItem.seeds[index]} />,
                                        title: <Grid padding={['ps-3', 'pe-3']}><Typography translateGroup="jackpot-summary" translateKey="seed" /></Grid>,
                                    },
                                ]}
                            />

                        </ExpandCollapseCard>
                    )
                })
            }
        </Grid>
    )
}
